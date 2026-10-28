import type { ChartRange, ChartPoint, Coin, GlobalStats } from './types';

const BASE_URL = 'https://api.coingecko.com/api/v3';
const REQUEST_TIMEOUT = 14_000;
const CHART_CACHE_TTL = 20_000;

export const CHART_RANGES: ChartRange[] = [
  { key: '1H', label: '1H', days: 1, kind: 'hour' },
  { key: '1D', label: '24H', days: 1, kind: 'day' },
  { key: '1W', label: '7D', days: 7, kind: 'week' },
  { key: '1M', label: '30D', days: 30, kind: 'month' },
  { key: '1Y', label: '1Y', days: 365, kind: 'year' },
  { key: 'ALL', label: 'ALL', days: 'max', kind: 'all' },
];

export class ApiError extends Error {
  readonly status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function request<T>(path: string, signal?: AbortSignal): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
  const abort = () => controller.abort();
  signal?.addEventListener('abort', abort);

  try {
    const response = await fetch(`${BASE_URL}${path}`, {
      headers: { accept: 'application/json' },
      signal: controller.signal,
    });

    if (!response.ok) {
      const message =
        response.status === 429
          ? 'CoinGecko rate limit reached. Try again in a moment.'
          : `Market data request failed (${response.status}).`;
      throw new ApiError(message, response.status);
    }

    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error instanceof Error && error.name === 'AbortError') {
      throw new ApiError('The market data request timed out.');
    }
    throw new ApiError('Could not reach the market data service.');
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', abort);
  }
}

export async function fetchMarkets(signal?: AbortSignal): Promise<Coin[]> {
  const data = await request<Coin[]>(
    '/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&sparkline=true&price_change_percentage=24h,7d,30d&locale=en',
    signal
  );

  return data.filter(
    (coin) => coin && typeof coin.current_price === 'number' && Number.isFinite(coin.current_price)
  );
}

type GlobalResponse = {
  data: {
    total_market_cap: Record<string, number>;
    total_volume: Record<string, number>;
    market_cap_change_percentage_24h_usd: number;
    market_cap_percentage: Record<string, number>;
    active_cryptocurrencies: number;
  };
};

export async function fetchGlobal(signal?: AbortSignal): Promise<GlobalStats> {
  const response = await request<GlobalResponse>('/global', signal);
  const { data } = response;

  return {
    totalMarketCap: data.total_market_cap.usd,
    totalVolume: data.total_volume.usd,
    marketCapChangePercentage24h: data.market_cap_change_percentage_24h_usd,
    btcDominance: data.market_cap_percentage.btc,
    ethDominance: data.market_cap_percentage.eth,
    activeCryptocurrencies: data.active_cryptocurrencies,
  };
}

type MarketChartResponse = {
  prices: [number, number][];
  total_volumes?: [number, number][];
};

const chartCache = new Map<string, { storedAt: number; points: ChartPoint[] }>();

function downsample(points: ChartPoint[], target = 220): ChartPoint[] {
  if (points.length <= target) return points;
  const lastIndex = points.length - 1;
  return Array.from({ length: target }, (_, index) =>
    points[Math.round((index / (target - 1)) * lastIndex)]
  );
}

export async function fetchChart(
  coinId: string,
  days: number | 'max',
  signal?: AbortSignal
): Promise<ChartPoint[]> {
  const key = `${coinId}:${days}`;
  const cached = chartCache.get(key);
  if (cached && Date.now() - cached.storedAt < CHART_CACHE_TTL) {
    return cached.points;
  }

  const response = await request<MarketChartResponse>(
    `/coins/${encodeURIComponent(coinId)}/market_chart?vs_currency=usd&days=${days}`,
    signal
  );

  const volumeByTime = new Map<number, number>();
  for (const [time, volume] of response.total_volumes ?? []) {
    if (Number.isFinite(time) && Number.isFinite(volume) && volume > 0) {
      volumeByTime.set(time, volume);
    }
  }

  const points = response.prices
    .map(([time, price]) => ({ time, price, volume: volumeByTime.get(time) }))
    .filter((point) => Number.isFinite(point.time) && Number.isFinite(point.price) && point.price > 0);

  if (points.length < 2) {
    throw new ApiError('Not enough chart data available for this asset.');
  }

  const trimmed = downsample(points);
  chartCache.set(key, { storedAt: Date.now(), points: trimmed });
  return trimmed;
}

export function clearChartCache() {
  chartCache.clear();
}
