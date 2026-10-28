export type Coin = {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number | null;
  total_volume: number;
  high_24h: number | null;
  low_24h: number | null;
  price_change_percentage_24h: number | null;
  price_change_percentage_7d_in_currency?: number | null;
  price_change_percentage_30d_in_currency?: number | null;
  ath: number | null;
  ath_change_percentage: number | null;
  circulating_supply: number | null;
  max_supply: number | null;
  sparkline_in_7d?: { price: number[] };
};

export type GlobalStats = {
  totalMarketCap: number;
  totalVolume: number;
  marketCapChangePercentage24h: number;
  btcDominance: number;
  ethDominance: number;
  activeCryptocurrencies: number;
};

export type ChartPoint = {
  time: number;
  price: number;
  volume?: number;
};

export type Candle = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

export type RangeKey = '1H' | '1D' | '1W' | '1M' | '1Y' | 'ALL';

export type ChartRange = {
  key: RangeKey;
  label: string;
  days: number | 'max';
  kind: 'hour' | 'day' | 'week' | 'month' | 'year' | 'all';
};
