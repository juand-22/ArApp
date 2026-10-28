import type { RangeKey } from './types';

const DASH = '—';

function isNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

export function formatPrice(value: number | null | undefined): string {
  if (!isNumber(value)) return DASH;
  const abs = Math.abs(value);
  const decimals = abs >= 1000 ? 2 : abs >= 1 ? 2 : abs >= 0.01 ? 4 : 6;
  return `$${value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}

export function formatCompactCurrency(value: number | null | undefined): string {
  if (!isNumber(value)) return DASH;
  const abs = Math.abs(value);
  if (abs >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
  if (abs >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `$${(value / 1e3).toFixed(2)}K`;
  return formatPrice(value);
}

export function formatCompactNumber(value: number | null | undefined): string {
  if (!isNumber(value)) return DASH;
  const abs = Math.abs(value);
  if (abs >= 1e12) return `${(value / 1e12).toFixed(2)}T`;
  if (abs >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `${(value / 1e3).toFixed(2)}K`;
  return value.toLocaleString('en-US', { maximumFractionDigits: 0 });
}

export function formatPercent(value: number | null | undefined, digits = 2): string {
  if (!isNumber(value)) return DASH;
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(digits)}%`;
}

export function formatSupply(value: number | null | undefined, symbol?: string): string {
  if (!isNumber(value)) return DASH;
  const formatted = formatCompactNumber(value).replace('T', 'T').replace('B', 'B');
  return symbol ? `${formatted} ${symbol.toUpperCase()}` : formatted;
}

export function formatChartTime(time: number, range: RangeKey): string {
  const date = new Date(time);
  switch (range) {
    case '1H':
      return date.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
    case '1D':
      return date.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
    case '1W':
      return date.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });
    case '1M':
      return date.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });
    case '1Y':
      return date.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' });
    case 'ALL':
      return date.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' });
    default:
      return date.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });
  }
}

export function formatTooltipTime(time: number, range: RangeKey): string {
  const date = new Date(time);
  const day = date.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });
  const clock = date.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  if (range === '1H') return clock;
  if (range === '1D' || range === '1W' || range === '1M') return `${day} · ${clock}`;
  return date.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function timeAgo(timestamp: number | null): string {
  if (!timestamp) return 'sincronizando';
  const seconds = Math.max(0, Math.round((Date.now() - timestamp) / 1000));
  if (seconds < 10) return 'ahora';
  if (seconds < 60) return `hace ${seconds} s`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.round(minutes / 60);
  return `hace ${hours} h`;
}

export function changeToColor(value: number | null | undefined): string {
  if (!isNumber(value) || value === 0) return '#9AA4B8';
  return value > 0 ? '#3DDC97' : '#FF5C7C';
}
