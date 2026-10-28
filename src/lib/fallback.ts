import snapshot from './fallback-market.json';
import { seededRandom } from './chart';
import type { ChartPoint, Coin, GlobalStats, RangeKey } from './types';

export const fallbackCoins = snapshot.coins as Coin[];
export const fallbackGlobal = snapshot.stats as GlobalStats;
export const fallbackUpdatedAt = new Date(snapshot.updatedAt).getTime();

type RangeMeta = {
  durationMs: number;
  count: number;
};

const RANGE_META: Record<RangeKey, RangeMeta> = {
  '1H': { durationMs: 60 * 60 * 1000, count: 13 },
  '1D': { durationMs: 24 * 60 * 60 * 1000, count: 97 },
  '1W': { durationMs: 7 * 24 * 60 * 60 * 1000, count: 85 },
  '1M': { durationMs: 30 * 24 * 60 * 60 * 1000, count: 121 },
  '1Y': { durationMs: 365 * 24 * 60 * 60 * 1000, count: 123 },
  ALL: { durationMs: 6 * 365 * 24 * 60 * 60 * 1000, count: 124 },
};

function rangeChange(coin: Coin, range: RangeKey): number {
  const daily = coin.price_change_percentage_24h ?? 0;
  switch (range) {
    case '1H':
      return daily / 8;
    case '1D':
      return daily;
    case '1W':
      return coin.price_change_percentage_7d_in_currency ?? daily * 3;
    case '1M':
      return coin.price_change_percentage_30d_in_currency ?? daily * 7;
    case '1Y':
      return daily * 18;
    case 'ALL':
      return 240;
    default:
      return 0;
  }
}

function walk(seed: string, count: number, start: number, end: number, wobble = 0.018): number[] {
  const random = seededRandom(seed);
  const values: number[] = [];
  for (let i = 0; i < count; i += 1) {
    const progress = i / (count - 1);
    const trend = start + (end - start) * progress;
    const noise = (random() - 0.5) * 2 * wobble * trend;
    values.push(Math.max(trend + noise, end * 0.35));
  }
  values[0] = start;
  values[count - 1] = end;
  return values;
}

/**
 * Construye un gráfico plausible para el snapshot incluido. El sparkline de
 * 7 días es dato real de mercado; los demás rangos se extrapolan de forma
 * determinista.
 */
export function buildFallbackChart(coin: Coin, range: RangeKey): ChartPoint[] {
  const now = Date.now();
  const meta = RANGE_META[range];
  const spark = coin.sparkline_in_7d?.price ?? [];
  const current = coin.current_price;

  if ((range === '1W' || range === '1D') && spark.length > 8) {
    const source = range === '1W' ? spark : spark.slice(-25);
    const durationMs = range === '1W' ? meta.durationMs : 24 * 60 * 60 * 1000;
    return source.map((price, index) => ({
      time: now - durationMs + (index / (source.length - 1)) * durationMs,
      price,
    }));
  }

  const change = rangeChange(coin, range);
  const start = current / (1 + change / 100);
  const wobble = range === '1H' ? 0.004 : range === '1D' ? 0.008 : 0.02;
  const values = walk(`${coin.id}:${range}`, meta.count, start, current, wobble);

  return values.map((price, index) => ({
    time: now - meta.durationMs + (index / (values.length - 1)) * meta.durationMs,
    price,
  }));
}
