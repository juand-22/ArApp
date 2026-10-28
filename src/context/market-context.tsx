import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { AppState } from 'react-native';

import { fetchGlobal, fetchMarkets } from '@/lib/api';
import {
  createBinanceTickerStream,
  type BinanceStreamStatus,
  type BinanceTickerUpdate,
} from '@/lib/binance-stream';
import {
  fallbackCoins,
  fallbackGlobal,
  fallbackUpdatedAt,
} from '@/lib/fallback';
import type { Coin, GlobalStats } from '@/lib/types';

const WATCHLIST_KEY = 'orbit.watchlist.v1';
const REFRESH_INTERVAL = 30_000;

type Status = 'loading' | 'ready';

type MarketContextValue = {
  coins: Coin[];
  global: GlobalStats | null;
  status: Status;
  error: string | null;
  isRefreshing: boolean;
  lastUpdated: number | null;
  isDemo: boolean;
  streamStatus: BinanceStreamStatus;
  binanceSymbols: string[];
  refresh: () => void;
  getCoin: (id: string) => Coin | undefined;
  watchlist: string[];
  isWatched: (id: string) => boolean;
  toggleWatch: (id: string) => void;
  watchedCoins: Coin[];
};

const MarketContext = createContext<MarketContextValue | null>(null);

function parseWatchlist(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter((id): id is string => typeof id === 'string');
    }
  } catch {
    // Ignorar almacenamiento corrupto y empezar de cero.
  }
  return [];
}

export function MarketProvider({ children }: { children: ReactNode }) {
  const [coins, setCoins] = useState<Coin[]>(fallbackCoins);
  const [global, setGlobal] = useState<GlobalStats | null>(fallbackGlobal);
  const [status, setStatus] = useState<Status>('loading');
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<number | null>(fallbackUpdatedAt);
  const [isDemo, setIsDemo] = useState(true);
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [streamStatus, setStreamStatus] = useState<BinanceStreamStatus>('connecting');
  const [binanceSymbols, setBinanceSymbols] = useState<string[]>([]);
  const [appIsActive, setAppIsActive] = useState(true);

  const inFlight = useRef(false);
  const hasLiveData = useRef(false);
  const lastUpdatedRef = useRef<number | null>(fallbackUpdatedAt);
  const coinSymbolsKey = Array.from(
    new Set(coins.map((coin) => coin.symbol.trim().toUpperCase()))
  )
    .sort()
    .join(',');

  const load = useCallback(async (reason: 'initial' | 'user' | 'silent') => {
    if (inFlight.current) return;
    inFlight.current = true;
    if (reason === 'user') setIsRefreshing(true);

    try {
      const [marketsResult, statsResult] = await Promise.allSettled([
        fetchMarkets(),
        fetchGlobal(),
      ]);

      if (marketsResult.status === 'fulfilled' && marketsResult.value.length > 0) {
        setCoins(marketsResult.value);
        setIsDemo(false);
        hasLiveData.current = true;
        setError(null);
        setLastUpdated(Date.now());
        lastUpdatedRef.current = Date.now();
      } else {
        if (!hasLiveData.current) {
          setCoins((previous) => (previous.length > 0 ? previous : fallbackCoins));
          setIsDemo(true);
          setError(
            marketsResult.status === 'rejected'
              ? marketsResult.reason instanceof Error
                ? marketsResult.reason.message
                : 'Live prices are unavailable right now.'
              : 'Live prices are unavailable right now.'
          );
          setLastUpdated(fallbackUpdatedAt);
          lastUpdatedRef.current = fallbackUpdatedAt;
        } else {
          setError(
            marketsResult.status === 'rejected'
              ? marketsResult.reason instanceof Error
                ? marketsResult.reason.message
                : 'Could not refresh market prices.'
              : 'No market prices were returned.'
          );
        }
      }

      if (statsResult.status === 'fulfilled') {
        setGlobal(statsResult.value);
      } else if (!hasLiveData.current) {
        setGlobal((previous) => previous ?? fallbackGlobal);
      }

      setStatus('ready');
    } finally {
      inFlight.current = false;
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    // La carga inicial lanza las peticiones de red; el estado se actualiza cuando terminan.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load('initial');
    const interval = setInterval(() => void load('silent'), REFRESH_INTERVAL);

    const subscription = AppState.addEventListener('change', (state) => {
      setAppIsActive(state === 'active');
      if (
        state === 'active' &&
        Date.now() - (lastUpdatedRef.current ?? 0) > REFRESH_INTERVAL
      ) {
        void load('silent');
      }
    });

    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, [load]);

  useEffect(() => {
    if (!appIsActive) return;
    if (!coinSymbolsKey) return;

    let liveReported = false;
    const pending = new Map<string, BinanceTickerUpdate>();

    const flush = () => {
      if (pending.size === 0) return;
      const updates = Array.from(pending.values());
      pending.clear();

      const bySymbol = new Map<string, BinanceTickerUpdate>();
      for (const entry of updates) {
        bySymbol.set(entry.symbol.slice(0, -4), entry);
      }

      setCoins((previous) => {
        let changed = false;
        const next = previous.map((coin) => {
          const update = bySymbol.get(coin.symbol.toUpperCase());
          if (!update) return coin;
          if (
            coin.current_price === update.price &&
            coin.price_change_percentage_24h === update.change24h &&
            coin.high_24h === update.high24h &&
            coin.low_24h === update.low24h &&
            coin.total_volume === update.quoteVolume24h
          ) {
            return coin;
          }

          changed = true;
          return {
            ...coin,
            current_price: update.price,
            price_change_percentage_24h: update.change24h,
            high_24h: update.high24h,
            low_24h: update.low24h,
            total_volume: update.quoteVolume24h,
          };
        });
        return changed ? next : previous;
      });

      const updatedAt = updates.reduce((latest, entry) => Math.max(latest, entry.eventTime), 0);
      if (updatedAt > 0) {
        setLastUpdated(updatedAt);
        lastUpdatedRef.current = updatedAt;
      }
    };

    // Binance envía un mensaje de ticker por símbolo, que puede ser decenas por
    // segundo. Agruparlos en dos actualizaciones por segundo mantiene la UI fluida.
    const timer = setInterval(flush, 500);

    const stop = createBinanceTickerStream(
      coinSymbolsKey.split(',').map((symbol) => ({ symbol })),
      {
        onStatus: (status) => {
          // Una reconexión debe poder reportar "live" de nuevo en el siguiente tick.
          liveReported = false;
          setStreamStatus(status);
        },
        onSymbols: setBinanceSymbols,
        onUpdate: (update) => {
          if (!liveReported) {
            liveReported = true;
            setStreamStatus('live');
            setIsDemo(false);
            hasLiveData.current = true;
          }
          pending.set(update.symbol, update);
        },
      }
    );

    return () => {
      clearInterval(timer);
      stop();
    };
  }, [appIsActive, coinSymbolsKey]);

  useEffect(() => {
    AsyncStorage.getItem(WATCHLIST_KEY)
      .then((raw) => setWatchlist(parseWatchlist(raw)))
      .catch((cause: unknown) => {
        console.error('Could not load the saved watchlist.', cause);
        setWatchlist([]);
      });
  }, []);

  const toggleWatch = useCallback((id: string) => {
    setWatchlist((previous) => {
      const next = previous.includes(id)
        ? previous.filter((entry) => entry !== id)
        : [id, ...previous];
      void AsyncStorage.setItem(WATCHLIST_KEY, JSON.stringify(next)).catch((cause: unknown) => {
        console.error('Could not save the watchlist.', cause);
      });
      return next;
    });
  }, []);

  const coinsById = useMemo(() => new Map(coins.map((coin) => [coin.id, coin])), [coins]);

  const watchedCoins = useMemo(
    () =>
      watchlist
        .map((id) => coinsById.get(id))
        .filter((coin): coin is Coin => Boolean(coin)),
    [coinsById, watchlist]
  );

  const value = useMemo<MarketContextValue>(
    () => ({
      coins,
      global,
      status,
      error,
      isRefreshing,
      lastUpdated,
      isDemo,
      streamStatus: appIsActive ? streamStatus : 'paused',
      binanceSymbols,
      refresh: () => void load('user'),
      getCoin: (id: string) => coinsById.get(id),
      watchlist,
      isWatched: (id: string) => watchlist.includes(id),
      toggleWatch,
      watchedCoins,
    }),
    [
      coins,
      global,
      status,
      error,
      isRefreshing,
      lastUpdated,
      isDemo,
      streamStatus,
      binanceSymbols,
      appIsActive,
      load,
      coinsById,
      watchlist,
      toggleWatch,
      watchedCoins,
    ]
  );

  return <MarketContext.Provider value={value}>{children}</MarketContext.Provider>;
}

export function useMarket(): MarketContextValue {
  const context = useContext(MarketContext);
  if (!context) {
    throw new Error('useMarket must be used inside a MarketProvider');
  }
  return context;
}
