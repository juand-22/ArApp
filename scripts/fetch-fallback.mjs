/**
 * Actualiza el snapshot de mercado incluido, usado cuando la API de CoinGecko
 * no está disponible (sin conexión, rate limit, etc).
 *
 *   node scripts/fetch-fallback.mjs
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const headers = { accept: 'application/json', 'user-agent': 'orbit-crypto-demo/1.0' };

const downsample = (values = [], size = 84) => {
  if (values.length <= size) return values;
  const step = values.length / size;
  return Array.from({ length: size }, (_, i) => values[Math.floor(i * step)]);
};

const marketsUrl =
  'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=30&page=1&sparkline=true&price_change_percentage=24h,7d,30d';

const [marketsRes, globalRes] = await Promise.all([
  fetch(marketsUrl, { headers }),
  fetch('https://api.coingecko.com/api/v3/global', { headers }),
]);

if (!marketsRes.ok) throw new Error(`markets request failed: ${marketsRes.status}`);
if (!globalRes.ok) throw new Error(`global request failed: ${globalRes.status}`);

const markets = await marketsRes.json();
const global = (await globalRes.json()).data;

const coins = markets.map((coin) => ({
  id: coin.id,
  symbol: coin.symbol,
  name: coin.name,
  image: coin.image,
  current_price: coin.current_price,
  market_cap: coin.market_cap,
  market_cap_rank: coin.market_cap_rank,
  total_volume: coin.total_volume,
  high_24h: coin.high_24h,
  low_24h: coin.low_24h,
  price_change_percentage_24h: coin.price_change_percentage_24h,
  price_change_percentage_7d_in_currency: coin.price_change_percentage_7d_in_currency,
  price_change_percentage_30d_in_currency: coin.price_change_percentage_30d_in_currency,
  ath: coin.ath,
  ath_change_percentage: coin.ath_change_percentage,
  circulating_supply: coin.circulating_supply,
  max_supply: coin.max_supply,
  sparkline_in_7d: { price: downsample(coin.sparkline_in_7d?.price) },
}));

const stats = {
  totalMarketCap: global.total_market_cap.usd,
  totalVolume: global.total_volume.usd,
  marketCapChangePercentage24h: global.market_cap_change_percentage_24h_usd,
  btcDominance: global.market_cap_percentage.btc,
  ethDominance: global.market_cap_percentage.eth,
  activeCryptocurrencies: global.active_cryptocurrencies,
};

await mkdir(path.join(root, 'src', 'lib'), { recursive: true });
await writeFile(
  path.join(root, 'src', 'lib', 'fallback-market.json'),
  `${JSON.stringify({ updatedAt: new Date().toISOString(), stats, coins }, null, 2)}\n`
);

console.log(`Saved snapshot with ${coins.length} coins.`);
