import { router, useLocalSearchParams } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated from 'react-native-reanimated';

import { CryptoIcon } from '@/components/crypto-icon';
import {
  IconChevronLeft,
  IconStar,
} from '@/components/icons';
import { PriceChart } from '@/components/price-chart';
import { AppText } from '@/components/ui/app-text';
import { Card } from '@/components/ui/card';
import { ChangeBadge } from '@/components/ui/change-badge';
import { Chip } from '@/components/ui/chip';
import { IconButton } from '@/components/ui/icon-button';
import { Reveal } from '@/components/ui/reveal';
import { SectionHeading } from '@/components/ui/section-heading';
import { Skeleton } from '@/components/ui/skeleton';
import { Colors, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useMarket } from '@/context/market-context';
import { useCoinChart } from '@/hooks/use-coin-chart';
import { useEntrance } from '@/hooks/use-entrance';
import { useValuePulse } from '@/hooks/use-value-pulse';
import { CHART_RANGES } from '@/lib/api';
import {
  formatCompactCurrency,
  formatPercent,
  formatPrice,
  formatSupply,
} from '@/lib/format';
import type { RangeKey } from '@/lib/types';

export default function CoinDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const coinId = typeof id === 'string' ? id : '';
  const {
    getCoin,
    status,
    isWatched,
    toggleWatch,
    streamStatus,
    binanceSymbols,
  } = useMarket();
  const coin = getCoin(coinId);
  const [range, setRange] = useState<RangeKey>('1D');
  const chart = useCoinChart(coin, range);
  const headerStyle = useEntrance({ delay: 0, offset: 8, duration: 180 });
  const headingStyle = useEntrance({ delay: 40, offset: 10, duration: 180 });
  const chartStyle = useEntrance({ delay: 90, offset: 12, duration: 180 });
  const statsStyle = useEntrance({ delay: 140, offset: 12, duration: 180 });
  const pricePulse = useValuePulse(coin?.current_price);
  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  if (!coin && status === 'loading') {
    return (
      <View style={styles.screen}>
        <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
          <View style={styles.loading}>
            <Skeleton height={46} width={120} />
            <Skeleton height={290} />
            <Skeleton height={140} />
          </View>
        </SafeAreaView>
      </View>
    );
  }

  if (!coin) {
    return (
      <View style={styles.screen}>
        <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
          <View style={styles.notFound}>
            <Header onBack={handleBack} />
            <Card style={styles.notFoundCard}>
              <AppText variant="h2">Activo no disponible</AppText>
              <AppText variant="body" color={Colors.textSecondary}>
                No encontramos esta criptomoneda en los datos actuales del mercado.
              </AppText>
            </Card>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  const favorite = isWatched(coin.id);
  const hasBinancePair = binanceSymbols.includes(coin.symbol.toUpperCase());
  const priceSourceLabel = hasBinancePair
    ? streamStatus === 'live'
      ? 'Precio en vivo vía Binance · par USDT'
      : streamStatus === 'reconnecting'
        ? 'Reconectando a Binance · última cotización'
        : streamStatus === 'paused'
          ? 'Conexión Binance en pausa'
          : 'Conectando al mercado en vivo'
    : 'Precio de referencia · sincronización cada 30 s';

  return (
    <View style={styles.screen}>
      <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}>
          <Animated.View style={headerStyle}>
            <Header
              onBack={handleBack}
              action={
                <IconButton
                  accessibilityLabel={
                    favorite ? `Quitar ${coin.name} de favoritos` : `Guardar ${coin.name}`
                  }
                  onPress={() => toggleWatch(coin.id)}
                  style={favorite ? styles.starActive : undefined}>
                  <IconStar
                    size={19}
                    color={favorite ? Colors.accentLight : Colors.textSecondary}
                    filled={favorite}
                  />
                </IconButton>
              }
            />
          </Animated.View>

          <Animated.View style={[styles.assetHeading, headingStyle]}>
            <View style={styles.assetIdentity}>
              <CryptoIcon symbol={coin.symbol} image={coin.image} size={52} />
              <View style={styles.assetTitle}>
                <AppText variant="h2">{coin.name}</AppText>
                <AppText variant="caption" color={Colors.textSecondary}>
                  {coin.symbol.toUpperCase()} · {coin.market_cap_rank ? `#${coin.market_cap_rank}` : 'Mercado'}
                </AppText>
              </View>
            </View>
            <AppText variant="micro" color={Colors.textMuted}>
              PRECIO EN USD
            </AppText>
            <Animated.View style={pricePulse}>
              <AppText variant="priceLarge" tabular style={styles.assetPrice}>
                {formatPrice(coin.current_price)}
              </AppText>
            </Animated.View>
            <View style={styles.priceChange}>
              <ChangeBadge value={chart.change} size="medium" />
              <AppText variant="caption" color={Colors.textSecondary}>
                en {CHART_RANGES.find((item) => item.key === range)?.label ?? range}
              </AppText>
            </View>
          </Animated.View>

          <Animated.View style={chartStyle}>
            <Card style={styles.chartCard}>
              <View style={styles.chartHeader}>
                <View>
                  <AppText variant="label" color={Colors.textSecondary}>
                    HISTORIAL DE PRECIO
                  </AppText>
                  <AppText variant="h2" style={styles.chartTitle}>
                    {chart.isDemo ? 'Velas de referencia' : 'Velas del mercado'}
                  </AppText>
                  <AppText variant="caption" color={Colors.textMuted}>
                    {priceSourceLabel}
                  </AppText>
                </View>
                <ChangeBadge value={chart.change} />
              </View>

              {chart.loading && chart.candles.length === 0 ? (
                <Skeleton height={280} radius={Radius.medium} />
              ) : (
                <Reveal key={range} duration={170} offset={4}>
                  <PriceChart candles={chart.candles} range={range} />
                </Reveal>
              )}

              <View style={styles.rangeRow}>
                {CHART_RANGES.map((item) => (
                  <Chip
                    key={item.key}
                    label={item.label}
                    selected={range === item.key}
                    onPress={() => setRange(item.key)}
                  />
                ))}
              </View>
            </Card>
          </Animated.View>

          <Animated.View style={[styles.statsSection, statsStyle]}>
            <SectionHeading title="Datos del mercado" subtitle="Métricas actualizadas del activo" />
            <View style={styles.statsGrid}>
              <MetricCard
                label="Capitalización"
                value={formatCompactCurrency(coin.market_cap)}
              />
              <MetricCard
                label="Volumen 24h"
                value={formatCompactCurrency(coin.total_volume)}
              />
              <MetricCard
                label="Máximo 24h"
                value={formatPrice(coin.high_24h)}
                accent={Colors.positive}
              />
              <MetricCard
                label="Mínimo 24h"
                value={formatPrice(coin.low_24h)}
                accent={Colors.negative}
              />
              <MetricCard
                label="Máximo histórico"
                value={formatPrice(coin.ath)}
                footnote={formatPercent(coin.ath_change_percentage)}
              />
              <MetricCard
                label="En circulación"
                value={formatSupply(coin.circulating_supply, coin.symbol)}
                footnote={
                  coin.max_supply
                    ? `Máx. ${formatSupply(coin.max_supply, coin.symbol)}`
                    : 'Sin límite conocido'
                }
              />
            </View>
          </Animated.View>

          <AppText variant="caption" color={Colors.textMuted} align="center">
            Datos de mercado en USD · Solo con fines informativos
          </AppText>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function Header({ onBack, action }: { onBack: () => void; action?: ReactNode }) {
  return (
    <View style={styles.topBar}>
      <IconButton accessibilityLabel="Volver" onPress={onBack}>
        <IconChevronLeft size={22} color={Colors.text} />
      </IconButton>
      <AppText variant="label" color={Colors.textSecondary}>
        DETALLE DEL ACTIVO
      </AppText>
      {action ?? <View style={styles.actionPlaceholder} />}
    </View>
  );
}

function MetricCard({
  label,
  value,
  footnote,
  accent,
}: {
  label: string;
  value: string;
  footnote?: string;
  accent?: string;
}) {
  return (
    <Card style={styles.metricCard}>
      <AppText variant="caption" color={Colors.textMuted}>
        {label}
      </AppText>
      <AppText variant="title" color={accent ?? Colors.text} tabular numberOfLines={1}>
        {value}
      </AppText>
      {footnote ? (
        <AppText variant="micro" color={Colors.textSecondary} numberOfLines={1}>
          {footnote}
        </AppText>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  safeArea: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  content: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.five,
    gap: Spacing.four,
  },
  loading: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    gap: Spacing.four,
  },
  notFound: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    gap: Spacing.four,
  },
  notFoundCard: {
    gap: Spacing.two,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
  },
  actionPlaceholder: {
    width: 42,
  },
  assetHeading: {
    gap: Spacing.two,
    paddingTop: Spacing.two,
  },
  assetIdentity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    marginBottom: Spacing.two,
  },
  assetTitle: {
    gap: Spacing.one,
  },
  assetPrice: {
    fontSize: 38,
    lineHeight: 46,
  },
  priceChange: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  chartCard: {
    gap: Spacing.three,
    overflow: 'hidden',
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.two,
  },
  chartTitle: {
    marginTop: 3,
  },
  rangeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  statsSection: {
    gap: Spacing.three,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  metricCard: {
    flexGrow: 1,
    flexBasis: '46%',
    minWidth: 140,
    gap: 5,
    paddingHorizontal: Spacing.three - 4,
    paddingVertical: Spacing.three,
  },
  starActive: {
    backgroundColor: Colors.accentSoft,
    borderColor: 'rgba(124, 92, 255, 0.4)',
  },
});
