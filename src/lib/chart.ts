import type { Candle, ChartPoint, RangeKey } from './types';

export type ScaledPoint = { x: number; y: number };

export type ChartGeometry = {
  points: ScaledPoint[];
  linePath: string;
  areaPath: string;
  min: number;
  max: number;
};

/** Suaviza una lista de puntos con una conversión Catmull-Rom → bézier cúbica. */
function smoothPath(points: ScaledPoint[]): string {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }
  return d;
}

export function buildChartGeometry(
  data: ChartPoint[],
  width: number,
  height: number,
  padding: { top: number; right: number; bottom: number; left: number }
): ChartGeometry | null {
  if (data.length < 2 || width <= 0 || height <= 0) return null;

  const values = data.map((point) => point.price);
  let min = Math.min(...values);
  let max = Math.max(...values);
  if (min === max) {
    const fallback = Math.abs(min) * 0.01 || 1;
    min -= fallback;
    max += fallback;
  }

  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const range = max - min;

  const points = data.map((point, index) => ({
    x: padding.left + (index / (data.length - 1)) * plotWidth,
    y: padding.top + plotHeight - ((point.price - min) / range) * plotHeight,
  }));

  const linePath = smoothPath(points);
  const baseline = padding.top + plotHeight;
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${baseline} L ${points[0].x} ${baseline} Z`;

  return { points, linePath, areaPath, min, max };
}

export function sparklinePath(values: number[], width: number, height: number, stroke = 1.8): string {
  if (!values.length) return '';
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const inset = stroke;
  const usableHeight = height - inset * 2;

  const points = values.map((value, index) => ({
    x: (index / Math.max(1, values.length - 1)) * width,
    y: inset + usableHeight - ((value - min) / range) * usableHeight,
  }));

  return smoothPath(points);
}

export function percentChangeFromPoints(data: ChartPoint[]): number {
  if (data.length < 2) return 0;
  const first = data[0].price;
  const last = data[data.length - 1].price;
  if (!first) return 0;
  return ((last - first) / first) * 100;
}

const RANGE_DURATION: Record<RangeKey, number | null> = {
  '1H': 60 * 60 * 1000,
  '1D': 24 * 60 * 60 * 1000,
  '1W': 7 * 24 * 60 * 60 * 1000,
  '1M': 30 * 24 * 60 * 60 * 1000,
  '1Y': 365 * 24 * 60 * 60 * 1000,
  ALL: null,
};

const CANDLE_INTERVAL: Record<Exclude<RangeKey, 'ALL'>, number> = {
  '1H': 5 * 60 * 1000,
  '1D': 60 * 60 * 1000,
  '1W': 6 * 60 * 60 * 1000,
  '1M': 24 * 60 * 60 * 1000,
  '1Y': 7 * 24 * 60 * 60 * 1000,
};

export function buildCandles(
  data: ChartPoint[],
  range: RangeKey,
  currentPrice?: number,
  now = Date.now()
): Candle[] {
  if (data.length === 0) return [];

  const duration = RANGE_DURATION[range];
  const start = duration === null ? data[0].time : now - duration;
  let interval =
    range === 'ALL'
      ? Math.max(30 * 24 * 60 * 60 * 1000, Math.ceil((now - start) / 60))
      : CANDLE_INTERVAL[range];
  const points = data
    .filter(
      (point) =>
        point.time >= start &&
        point.time <= now &&
        Number.isFinite(point.price) &&
        point.price > 0
    )
    .sort((left, right) => left.time - right.time);

  if (range !== 'ALL' && points.length > 2) {
    const gaps = points.slice(1).map((point, index) => point.time - points[index].time);
    gaps.sort((left, right) => left - right);
    const medianGap = gaps[Math.floor(gaps.length / 2)];
    const minimumUsefulInterval = Math.ceil((medianGap * 1.5) / (5 * 60 * 1000)) * (5 * 60 * 1000);
    interval = Math.max(interval, minimumUsefulInterval);
  }

  if (
    currentPrice !== undefined &&
    Number.isFinite(currentPrice) &&
    currentPrice > 0 &&
    (!points.length || points[points.length - 1].time < now)
  ) {
    points.push({ time: now, price: currentPrice });
  }

  const buckets = new Map<number, Candle>();
  for (const point of points) {
    const bucketTime = Math.floor(point.time / interval) * interval;
    const candle = buckets.get(bucketTime);
    if (!candle) {
      buckets.set(bucketTime, {
        time: bucketTime,
        open: point.price,
        high: point.price,
        low: point.price,
        close: point.price,
        volume: point.volume ?? 0,
      });
    } else {
      candle.high = Math.max(candle.high, point.price);
      candle.low = Math.min(candle.low, point.price);
      candle.close = point.price;
      candle.volume += point.volume ?? 0;
    }
  }

  return Array.from(buckets.values()).sort((left, right) => left.time - right.time);
}

export function percentChangeFromCandles(candles: Candle[]): number {
  if (candles.length === 0 || candles[0].open <= 0) return 0;
  return ((candles[candles.length - 1].close - candles[0].open) / candles[0].open) * 100;
}

/** Generador pseudoaleatorio determinista para que los datos demo nunca salten. */
export function seededRandom(seed: string): () => number {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return () => {
    hash += 0x6d2b79f5;
    let t = hash;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
