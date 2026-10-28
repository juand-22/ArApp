import { useEffect, useMemo, useRef, useState } from 'react';

import { buildFallbackChart } from '@/lib/fallback';
import { fetchChart } from '@/lib/api';
import { buildCandles, percentChangeFromCandles } from '@/lib/chart';
import type { Candle, ChartPoint, ChartRange, Coin } from '@/lib/types';

type ChartState = {
  coinId: string | null;
  range: ChartRange['key'];
  points: ChartPoint[];
  isDemo: boolean;
  error: string | null;
};

type ChartResult = {
  candles: Candle[];
  change: number;
  isDemo: boolean;
  error: string | null;
  loading: boolean;
};

/** El gráfico necesita como máximo unos pocos refrescos de precio por segundo. */
const PRICE_SYNC_MS = 2_000;

export function useCoinChart(coin: Coin | undefined, range: ChartRange['key']): ChartResult {
  const [state, setState] = useState<ChartState>({
    coinId: null,
    range: '1D',
    points: [],
    isDemo: false,
    error: null,
  });
  const coinRef = useRef(coin);
  const coinId = coin?.id ?? null;
  const currentPrice = coin?.current_price;
  const [chartTick, setChartTick] = useState<{
    coinId: string | null;
    price: number | undefined;
  }>({ coinId, price: currentPrice });

  useEffect(() => {
    coinRef.current = coin;
  }, [coin]);

  // Los ticks en vivo actualizan el precio varias veces por segundo. Muestrearlo
  // en un temporizador lento evita que el gráfico se re-renderice en cada tick.
  useEffect(() => {
    const timer = setInterval(() => {
      const nextCoin = coinRef.current;
      if (!nextCoin) return;
      setChartTick((previous) =>
        previous.coinId === nextCoin.id && previous.price === nextCoin.current_price
          ? previous
          : { coinId: nextCoin.id, price: nextCoin.current_price }
      );
    }, PRICE_SYNC_MS);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let active = true;
    const chartCoin = coinRef.current;
    if (!coinId || !chartCoin) return;
    const controller = new AbortController();

    const rangeConfig = {
      '1H': { days: 1 },
      '1D': { days: 1 },
      '1W': { days: 7 },
      '1M': { days: 30 },
      '1Y': { days: 365 },
      ALL: { days: 'max' as const },
    }[range];

    fetchChart(coinId, rangeConfig.days, controller.signal)
      .then((points) => {
        const candles = buildCandles(points, range, coinRef.current?.current_price);
        if (candles.length < 2) {
          throw new Error('Not enough recent market data is available for this range.');
        }
        if (active) {
          setState({
            coinId,
            range,
            points,
            isDemo: false,
            error: null,
          });
        }
      })
      .catch((cause: unknown) => {
        if (!active) return;
        const currentCoin = coinRef.current;
        if (!currentCoin) return;
        const points = buildFallbackChart(currentCoin, range);
        setState({
          coinId,
          range,
          points,
          isDemo: true,
          error: cause instanceof Error ? cause.message : 'Chart data is unavailable.',
        });
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [coinId, range]);

  const currentResult = state.coinId === coinId && state.range === range;
  const chartPrice = chartTick.coinId === coinId ? chartTick.price : currentPrice;
  const candles = useMemo(
    () =>
      currentResult && chartPrice !== undefined
        ? buildCandles(state.points, range, chartPrice)
        : [],
    [chartPrice, currentResult, range, state.points]
  );
  const change = useMemo(() => percentChangeFromCandles(candles), [candles]);

  return {
    candles,
    change,
    loading: !currentResult,
    isDemo: currentResult && state.isDemo,
    error: currentResult ? state.error : null,
  };
}
