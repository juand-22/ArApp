import type { Coin } from './types';

const BINANCE_REST_URL = 'https://api.binance.com/api/v3';
const BINANCE_STREAM_URL = 'wss://data-stream.binance.vision/stream?streams=';
const PAIR_LOOKUP_TIMEOUT = 12_000;
const PAIR_LOOKUP_BATCH_SIZE = 8;

export type BinanceStreamStatus =
  | 'connecting'
  | 'live'
  | 'reconnecting'
  | 'unavailable'
  | 'paused';

export type BinanceTickerUpdate = {
  symbol: string;
  price: number;
  change24h: number;
  high24h: number;
  low24h: number;
  quoteVolume24h: number;
  eventTime: number;
};

type StreamCallbacks = {
  onStatus: (status: BinanceStreamStatus) => void;
  onSymbols: (symbols: string[]) => void;
  onUpdate: (update: BinanceTickerUpdate) => void;
};

const pairCache = new Map<string, string[]>();

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function candidatePairs(coins: Pick<Coin, 'symbol'>[]): string[] {
  return Array.from(
    new Set(
      coins
        .map((coin) => coin.symbol.trim().toUpperCase())
        .filter((symbol) => /^[A-Z0-9]{2,20}$/.test(symbol) && symbol !== 'USDT')
        .map((symbol) => `${symbol}USDT`)
    )
  );
}

async function lookupUsdtPair(pair: string, signal: AbortSignal): Promise<string | null> {
  const response = await fetch(
    `${BINANCE_REST_URL}/exchangeInfo?symbol=${encodeURIComponent(pair)}`,
    { signal }
  );
  const payload: unknown = await response.json();

  if (!response.ok) {
    if (
      response.status === 400 &&
      isRecord(payload) &&
      payload.code === -1121
    ) {
      return null;
    }

    const message = isRecord(payload) && typeof payload.msg === 'string'
      ? payload.msg
      : `Binance market lookup failed (${response.status}).`;
    throw new Error(message);
  }

  if (!isRecord(payload) || !Array.isArray(payload.symbols)) {
    throw new Error('Binance returned an invalid exchange market response.');
  }

  const market = payload.symbols.find(
    (entry: unknown) =>
      isRecord(entry) &&
      entry.symbol === pair &&
      entry.status === 'TRADING' &&
      entry.quoteAsset === 'USDT'
  );
  return market ? pair : null;
}

async function findUsdtPairs(
  candidates: string[],
  parentSignal: AbortSignal
): Promise<string[]> {
  const cacheKey = candidates.join(',');
  const cached = pairCache.get(cacheKey);
  if (cached) return cached;

  const controller = new AbortController();
  const abort = () => controller.abort();
  parentSignal.addEventListener('abort', abort);
  const timeout = setTimeout(() => controller.abort(), PAIR_LOOKUP_TIMEOUT);
  const pairs: string[] = [];
  const failures: string[] = [];

  try {
    for (let index = 0; index < candidates.length; index += PAIR_LOOKUP_BATCH_SIZE) {
      const batch = candidates.slice(index, index + PAIR_LOOKUP_BATCH_SIZE);
      const results = await Promise.allSettled(
        batch.map((pair) => lookupUsdtPair(pair, controller.signal))
      );

      results.forEach((result, batchIndex) => {
        if (result.status === 'fulfilled') {
          if (result.value) pairs.push(result.value);
        } else {
          failures.push(
            `${batch[batchIndex]}: ${
              result.reason instanceof Error ? result.reason.message : 'request failed'
            }`
          );
        }
      });

      if (controller.signal.aborted) {
        throw new Error(
          parentSignal.aborted
            ? 'Binance market lookup was cancelled.'
            : 'Binance market lookup timed out.'
        );
      }
    }
  } finally {
    clearTimeout(timeout);
    parentSignal.removeEventListener('abort', abort);
  }

  if (failures.length > 0) {
    if (pairs.length === 0) {
      throw new Error(`Could not check Binance USDT markets: ${failures.join('; ')}`);
    }
    console.warn(
      `Some Binance markets could not be checked; subscribing to ${pairs.length} available pairs.`
    );
  } else {
    pairCache.set(cacheKey, pairs);
  }

  return pairs;
}

function parseTickerMessage(value: unknown): BinanceTickerUpdate | null {
  if (!isRecord(value)) return null;
  const payload = isRecord(value.data) ? value.data : value;
  const symbol = payload.s;
  const price = Number(payload.c);
  const change24h = Number(payload.P);
  const high24h = Number(payload.h);
  const low24h = Number(payload.l);
  const quoteVolume24h = Number(payload.q);
  const eventTime = Number(payload.E);

  if (
    typeof symbol !== 'string' ||
    !symbol.endsWith('USDT') ||
    !Number.isFinite(price) ||
    price <= 0 ||
    !Number.isFinite(change24h) ||
    !Number.isFinite(high24h) ||
    !Number.isFinite(low24h) ||
    !Number.isFinite(quoteVolume24h) ||
    quoteVolume24h < 0
  ) {
    return null;
  }

  return {
    symbol,
    price,
    change24h,
    high24h,
    low24h,
    quoteVolume24h,
    eventTime: Number.isFinite(eventTime) ? eventTime : Date.now(),
  };
}

export function createBinanceTickerStream(
  coins: Pick<Coin, 'symbol'>[],
  callbacks: StreamCallbacks
): () => void {
  const candidates = candidatePairs(coins);
  const controller = new AbortController();
  let stopped = false;
  let socket: WebSocket | null = null;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let reconnectAttempt = 0;
  let openedAt = 0;

  const scheduleReconnect = () => {
    if (stopped || reconnectTimer) return;
    callbacks.onStatus('reconnecting');
    const delay = Math.min(1_000 * 2 ** reconnectAttempt, 30_000);
    reconnectAttempt += 1;
    reconnectTimer = setTimeout(() => {
      reconnectTimer = null;
      void connect();
    }, delay);
  };

  const connect = async () => {
    if (stopped) return;
    callbacks.onStatus(reconnectAttempt === 0 ? 'connecting' : 'reconnecting');

    try {
      const pairs = await findUsdtPairs(candidates, controller.signal);
      if (stopped) return;
      callbacks.onSymbols(pairs.map((pair) => pair.slice(0, -4)));
      if (pairs.length === 0) {
        callbacks.onStatus('unavailable');
        return;
      }

      const streams = pairs.map((pair) => `${pair.toLowerCase()}@ticker`).join('/');
      const nextSocket = new WebSocket(`${BINANCE_STREAM_URL}${streams}`);
      socket = nextSocket;
      openedAt = Date.now();

      nextSocket.onopen = () => {
        openedAt = Date.now();
        callbacks.onStatus('connecting');
      };
      nextSocket.onmessage = (event) => {
        let message: unknown;
        try {
          message = JSON.parse(String(event.data)) as unknown;
        } catch (cause) {
          console.warn('Could not parse a Binance ticker message.', cause);
          return;
        }

        const update = parseTickerMessage(message);
        if (update) {
          callbacks.onUpdate(update);
        }
      };
      nextSocket.onerror = () => callbacks.onStatus('reconnecting');
      nextSocket.onclose = () => {
        if (socket === nextSocket) socket = null;
        if (Date.now() - openedAt >= 60_000) reconnectAttempt = 0;
        scheduleReconnect();
      };
    } catch (cause) {
      if (stopped) return;
      console.error('Binance live prices are unavailable.', cause);
      scheduleReconnect();
    }
  };

  if (candidates.length === 0) {
    callbacks.onStatus('unavailable');
  } else {
    void connect();
  }

  return () => {
    stopped = true;
    controller.abort();
    if (reconnectTimer) clearTimeout(reconnectTimer);
    if (socket) {
      socket.onopen = null;
      socket.onmessage = null;
      socket.onerror = null;
      socket.onclose = null;
      socket.close();
    }
  };
}
