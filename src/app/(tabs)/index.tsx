import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  Easing,
  interpolateColor,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { CoinRow } from '@/components/coin-row';
import { CryptoIcon } from '@/components/crypto-icon';
import {
  IconRefresh,
  IconSearch,
  LogoMark,
} from '@/components/icons';
import { PriceChart } from '@/components/price-chart';
import { Sparkline } from '@/components/sparkline';
import { AppText } from '@/components/ui/app-text';
import { Card } from '@/components/ui/card';
import { ChangeBadge } from '@/components/ui/change-badge';
import { IconButton } from '@/components/ui/icon-button';
import { PressableScale } from '@/components/ui/pressable-scale';
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
  formatPrice,
  timeAgo,
} from '@/lib/format';
import type { RangeKey } from '@/lib/types';

const HOME_RANGES: RangeKey[] = ['1H', '1D', '1W', '1M', '1Y'];

/** La lista empieza pequeña para que el primer render sea rápido y crece a demanda. */
const INITIAL_VISIBLE_COINS = 7;
const LOAD_MORE_STEP = 10;

export default function HomeScreen() {
  const {
    coins,
    global,
    status,
    error,
    isRefreshing,
    lastUpdated,
    isDemo,
    streamStatus,
    watchlist,
    refresh,
  } = useMarket();
  const [range, setRange] = useState<RangeKey>('1D');
  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_COINS);

  const featuredCoin = coins.find((coin) => coin.id === 'bitcoin') ?? coins[0];
  const chart = useCoinChart(featuredCoin, range);
  const heroStyle = useEntrance({ delay: 20, offset: 8 });
  const summaryStyle = useEntrance({ delay: 60, offset: 10 });
  const featuredStyle = useEntrance({ delay: 110, offset: 12 });
  const pricePulse = useValuePulse(featuredCoin?.current_price);

  const { orderedCoins, favoritesCount } = useMemo(() => {
    const watched = new Set(watchlist);
    const favorites = coins.filter((coin) => watched.has(coin.id));
    return {
      favoritesCount: favorites.length,
      orderedCoins: favorites.length
        ? [...favorites, ...coins.filter((coin) => !watched.has(coin.id))]
        : coins,
    };
  }, [coins, watchlist]);

  const searching = query.trim().length > 0;
  const filteredCoins = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return orderedCoins;
    return orderedCoins.filter(
      (coin) =>
        coin.name.toLowerCase().includes(normalized) ||
        coin.symbol.toLowerCase().includes(normalized)
    );
  }, [orderedCoins, query]);

  // Nunca ocultar un favorito detrás del botón "Cargar más".
  const visibleCoins = searching
    ? filteredCoins
    : filteredCoins.slice(0, Math.max(visibleCount, favoritesCount));
  const hiddenCount = filteredCoins.length - visibleCoins.length;

  const openCoin = (id: string) => {
    router.push({ pathname: '/coin/[id]', params: { id } });
  };

  const listHeader = (
    <View style={styles.listHeader}>
      <View style={styles.topBar}>
        <View style={styles.brand}>
          <LogoMark size={38} />
          <View>
            <AppText variant="title">AppAr</AppText>
            <AppText variant="micro" color={Colors.textMuted}>
              CRYPTO MARKETS
            </AppText>
          </View>
        </View>
        <View style={styles.topActions}>
          <IconButton
            accessibilityLabel={searchOpen ? 'Cerrar búsqueda' : 'Buscar criptomonedas'}
            onPress={() => {
              setSearchOpen((visible) => !visible);
              setQuery('');
            }}>
            <IconSearch size={19} color={Colors.textSecondary} />
          </IconButton>
          <IconButton
            accessibilityLabel="Actualizar precios"
            disabled={isRefreshing}
            onPress={refresh}>
            <IconRefresh size={19} color={Colors.textSecondary} />
          </IconButton>
        </View>
      </View>

      <Animated.View style={[styles.intro, heroStyle]}>
        <View style={styles.eyebrow}>
          <View
            style={[
              styles.liveDot,
              status === 'loading' && coins.length === 0 && styles.connectingDot,
              isDemo && styles.demoDot,
              streamStatus === 'reconnecting' && styles.demoDot,
            ]}
          />
          <AppText
            variant="micro"
            color={
              streamStatus === 'live'
                ? Colors.positive
                : streamStatus === 'reconnecting' ||
                    (streamStatus === 'unavailable' && isDemo)
                  ? Colors.warning
                  : Colors.textSecondary
            }>
            {streamStatus === 'live'
              ? 'BINANCE EN VIVO'
              : streamStatus === 'connecting' || status === 'loading'
                ? 'CONECTANDO'
                : streamStatus === 'reconnecting'
                  ? 'RECONECTANDO'
                  : isDemo
                    ? 'MODO DEMO'
                    : 'ACTUALIZA CADA 30 S'}
          </AppText>
          <AppText variant="caption" color={Colors.textMuted}>
            · {timeAgo(lastUpdated)}
          </AppText>
        </View>
        <View style={styles.introCopy}>
          <AppText variant="h1" style={styles.headline}>
            Tu mercado,{'\n'}en movimiento.
          </AppText>
        </View>
      </Animated.View>

      {searchOpen ? (
        <Reveal duration={160} offset={-6}>
          <View style={styles.searchBox}>
            <IconSearch size={18} color={Colors.textMuted} />
            <TextInput
              autoCapitalize="none"
              autoCorrect={false}
              onChangeText={setQuery}
              placeholder="Buscar por nombre o símbolo"
              placeholderTextColor={Colors.textMuted}
              returnKeyType="search"
              style={styles.searchInput}
              value={query}
            />
          </View>
        </Reveal>
      ) : null}

      {error && streamStatus !== 'live' ? (
        <View style={styles.notice}>
          <AppText variant="caption" color={Colors.warning}>
            No se pudieron actualizar los precios. Mostrando los últimos datos disponibles.
          </AppText>
        </View>
      ) : null}

      <Animated.View style={summaryStyle}>
        <MarketSummary
          marketCap={global?.totalMarketCap}
          volume={global?.totalVolume}
          change={global?.marketCapChangePercentage24h}
        />
      </Animated.View>

      {featuredCoin ? (
        <Animated.View style={featuredStyle}>
          <Card style={styles.featuredCard}>
            <LinearGradient
              colors={['rgba(124, 92, 255, 0.18)', 'rgba(16, 19, 27, 0)']}
              start={{ x: 0.1, y: 0 }}
              end={{ x: 0.85, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.featuredTop}>
              <PressableScale
                accessibilityRole="button"
                onPress={() => openCoin(featuredCoin.id)}
                pressedOpacity={0.85}
                scaleTo={0.98}
                style={styles.featuredIdentity}>
                <CryptoIcon symbol={featuredCoin.symbol} image={featuredCoin.image} size={42} />
                <View style={styles.featuredName}>
                  <AppText variant="label" color={Colors.textSecondary}>
                    ACTIVO DESTACADO
                  </AppText>
                  <AppText variant="title">{featuredCoin.name}</AppText>
                </View>
              </PressableScale>
              <Sparkline
                values={featuredCoin.sparkline_in_7d?.price}
                width={64}
                height={32}
                color={
                  (featuredCoin.price_change_percentage_24h ?? 0) >= 0
                    ? Colors.positive
                    : Colors.negative
                }
              />
            </View>

            <PressableScale
              accessibilityRole="button"
              accessibilityLabel={`Abrir detalle de ${featuredCoin.name}`}
              onPress={() => openCoin(featuredCoin.id)}
              pressedOpacity={0.85}
              scaleTo={0.99}
              style={styles.featuredPrice}>
              <Animated.View style={pricePulse}>
                <AppText variant="hero" tabular>
                  {formatPrice(featuredCoin.current_price)}
                </AppText>
              </Animated.View>
              <ChangeBadge value={chart.change} size="medium" />
            </PressableScale>

            <View style={styles.chartHeader}>
              <AppText variant="caption" color={Colors.textSecondary}>
                VARIACIÓN EN {CHART_RANGES.find((item) => item.key === range)?.label ?? range}
              </AppText>
              <AppText variant="caption" color={Colors.textMuted}>
                {chart.isDemo ? 'Gráfico de referencia' : 'USD'}
              </AppText>
            </View>

            {chart.loading && chart.candles.length === 0 ? (
              <Skeleton height={248} radius={Radius.medium} />
            ) : (
              <Reveal key={range} duration={180} offset={4}>
                <PriceChart candles={chart.candles} range={range} />
              </Reveal>
            )}

            <View style={styles.rangeRow}>
              {HOME_RANGES.map((key) => {
                const rangeOption = CHART_RANGES.find((item) => item.key === key);
                if (!rangeOption) return null;
                return (
                  <RangeButton
                    key={key}
                    label={rangeOption.label}
                    selected={range === key}
                    onPress={() => setRange(key)}
                  />
                );
              })}
            </View>
          </Card>
        </Animated.View>
      ) : status === 'loading' ? (
        <Skeleton height={330} radius={Radius.large} />
      ) : null}

      <SectionHeading
        title="Mercado"
        subtitle="Precios y variación en las últimas 24 horas"
      />
      <View style={styles.columnHeadings}>
        <AppText variant="micro" color={Colors.textMuted}>
          ACTIVO
        </AppText>
        <AppText variant="micro" color={Colors.textMuted}>
          PRECIO · 24H
        </AppText>
      </View>
    </View>
  );

  return (
    <View style={styles.screen}>
      <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
        <FlatList
          contentContainerStyle={styles.listContent}
          data={visibleCoins}
          keyExtractor={(coin) => coin.id}
          ListEmptyComponent={
            status === 'loading' ? (
              <Skeleton height={72} radius={Radius.large} />
            ) : (
              <Card style={styles.emptyCard}>
                <AppText variant="bodyMedium">No encontramos criptomonedas</AppText>
                <AppText variant="caption" color={Colors.textSecondary}>
                  Prueba con otro nombre o símbolo.
                </AppText>
              </Card>
            )
          }
          ListFooterComponent={
            hiddenCount > 0 ? (
              <View style={styles.listFooter}>
                <PressableScale
                  accessibilityRole="button"
                  accessibilityLabel="Cargar más criptomonedas"
                  onPress={() => setVisibleCount((count) => count + LOAD_MORE_STEP)}
                  pressedOpacity={0.86}
                  scaleTo={0.985}
                  style={styles.loadMore}>
                  <AppText variant="label" color={Colors.accentLight}>
                    Cargar más
                  </AppText>
                  <AppText variant="caption" color={Colors.textMuted}>
                    {hiddenCount} restantes
                  </AppText>
                </PressableScale>
              </View>
            ) : (
              <View style={styles.listFooter} />
            )
          }
          ListHeaderComponent={listHeader}
          refreshControl={
            <RefreshControl
              onRefresh={refresh}
              refreshing={isRefreshing}
              tintColor={Colors.accentLight}
              colors={[Colors.accent]}
            />
          }
          renderItem={({ item }) => (
            <CoinRow coin={item} onPress={() => openCoin(item.id)} />
          )}
          showsVerticalScrollIndicator={false}
          style={styles.list}
          windowSize={7}
          initialNumToRender={8}
          maxToRenderPerBatch={8}
          removeClippedSubviews
          ItemSeparatorComponent={ListSeparator}
        />
      </SafeAreaView>
    </View>
  );
}

function MarketSummary({
  marketCap,
  volume,
  change,
}: {
  marketCap?: number;
  volume?: number;
  change?: number;
}) {
  return (
    <Card style={styles.summaryCard}>
      <View style={styles.summaryMain}>
        <View style={styles.summaryTitle}>
          <AppText variant="micro" color={Colors.textSecondary}>
            CAPITALIZACIÓN TOTAL
          </AppText>
          <ChangeBadge value={change} />
        </View>
        <AppText variant="h2" tabular>
          {formatCompactCurrency(marketCap)}
        </AppText>
        <AppText variant="caption" color={Colors.textMuted}>
          Volumen 24h · {formatCompactCurrency(volume)}
        </AppText>
      </View>
      <View style={styles.marketIcon}>
        <LogoMark size={40} />
      </View>
    </Card>
  );
}

function RangeButton({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const progress = useSharedValue(selected ? 1 : 0);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    progress.value = withTiming(selected ? 1 : 0, {
      duration: reducedMotion ? 70 : 150,
      easing: Easing.out(Easing.cubic),
    });
  }, [progress, reducedMotion, selected]);

  const surface = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      ['rgba(16, 19, 27, 0)', Colors.surfaceHigh]
    ),
  }));

  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityState={{ selected }}
      animatedStyle={surface}
      onPress={onPress}
      pressedOpacity={0.82}
      scaleTo={0.94}
      style={styles.rangeButton}>
      <AppText variant="caption" color={selected ? Colors.text : Colors.textMuted}>
        {label}
      </AppText>
    </PressableScale>
  );
}

// A nivel de módulo para que FlatList no remonte el separador en cada render.
function ListSeparator() {
  return <View style={styles.separator} />;
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
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
  },
  listHeader: {
    gap: Spacing.four,
    paddingBottom: Spacing.four,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  topActions: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  intro: {
    gap: Spacing.two,
    paddingTop: Spacing.two,
  },
  introCopy: {
    gap: Spacing.two,
  },
  eyebrow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: Colors.positive,
  },
  demoDot: {
    backgroundColor: Colors.warning,
  },
  connectingDot: {
    backgroundColor: Colors.textMuted,
  },
  headline: {
    marginTop: 1,
  },
  searchBox: {
    minHeight: 50,
    paddingHorizontal: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    backgroundColor: Colors.surface,
    borderRadius: Radius.medium,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchInput: {
    flex: 1,
    color: Colors.text,
    fontFamily: 'Manrope_500Medium',
    fontSize: 14,
    paddingVertical: Spacing.two,
  },
  notice: {
    borderRadius: Radius.medium,
    backgroundColor: 'rgba(255, 181, 71, 0.08)',
    borderColor: 'rgba(255, 181, 71, 0.18)',
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  summaryCard: {
    minHeight: 126,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  summaryMain: {
    gap: 7,
  },
  summaryTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  marketIcon: {
    width: 58,
    height: 58,
    borderRadius: Radius.large,
    backgroundColor: Colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featuredCard: {
    gap: Spacing.three,
    overflow: 'hidden',
  },
  featuredTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  featuredIdentity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  featuredName: {
    gap: 2,
  },
  featuredPrice: {
    gap: Spacing.two,
    alignItems: 'flex-start',
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: -Spacing.two,
  },
  rangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 4,
    borderRadius: Radius.pill,
    backgroundColor: Colors.backgroundAlt,
  },
  rangeButton: {
    flex: 1,
    minHeight: 34,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  columnHeadings: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three - 4,
    marginTop: -Spacing.two,
    marginBottom: -Spacing.two,
  },
  separator: {
    height: Spacing.two,
  },
  emptyCard: {
    gap: Spacing.one,
    marginBottom: Spacing.three,
  },
  listFooter: {
    paddingTop: Spacing.two,
    paddingBottom: Spacing.three,
  },
  loadMore: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingVertical: Spacing.two + 2,
    borderRadius: Radius.medium,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
});
