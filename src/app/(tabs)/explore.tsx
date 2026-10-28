import { router } from 'expo-router';
import { memo, useMemo, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated from 'react-native-reanimated';

import { CoinRow } from '@/components/coin-row';
import { IconSearch, IconStar, LogoMark } from '@/components/icons';
import { AppText } from '@/components/ui/app-text';
import { Card } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { IconButton } from '@/components/ui/icon-button';
import { Reveal } from '@/components/ui/reveal';
import { Skeleton } from '@/components/ui/skeleton';
import { Colors, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useMarket } from '@/context/market-context';
import { useEntrance } from '@/hooks/use-entrance';
import { formatCompactNumber } from '@/lib/format';
import type { Coin } from '@/lib/types';

type Filter = 'all' | 'watchlist' | 'gainers' | 'losers';

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'Todos' },
  { key: 'watchlist', label: 'Favoritos' },
  { key: 'gainers', label: 'Alcistas' },
  { key: 'losers', label: 'Bajistas' },
];

export default function ExploreScreen() {
  const {
    coins,
    status,
    isRefreshing,
    refresh,
    watchlist,
    watchedCoins,
    isWatched,
    toggleWatch,
  } = useMarket();
  const [filter, setFilter] = useState<Filter>('watchlist');
  const [query, setQuery] = useState('');
  const topBarStyle = useEntrance({ delay: 20, offset: 8 });
  const introStyle = useEntrance({ delay: 50, offset: 10 });
  const searchStyle = useEntrance({ delay: 80, offset: 10 });
  const filtersStyle = useEntrance({ delay: 110, offset: 10 });

  const filteredCoins = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return coins.filter((coin) => {
      if (filter === 'watchlist' && !watchlist.includes(coin.id)) return false;
      if (filter === 'gainers' && (coin.price_change_percentage_24h ?? 0) <= 0) return false;
      if (filter === 'losers' && (coin.price_change_percentage_24h ?? 0) >= 0) return false;
      return (
        !normalized ||
        coin.name.toLowerCase().includes(normalized) ||
        coin.symbol.toLowerCase().includes(normalized)
      );
    });
  }, [coins, filter, query, watchlist]);

  const suggestions = useMemo(
    () => coins.filter((coin) => !isWatched(coin.id)).slice(0, 3),
    [coins, isWatched]
  );

  const openCoin = (id: string) => {
    router.push({ pathname: '/coin/[id]', params: { id } });
  };

  const listHeader = (
    <View style={styles.listHeader}>
      <Animated.View style={[styles.topBar, topBarStyle]}>
        <View style={styles.brand}>
          <LogoMark size={38} />
          <View>
            <AppText variant="title">AppAr</AppText>
            <AppText variant="micro" color={Colors.textMuted}>
              TU LISTA PERSONAL
            </AppText>
          </View>
        </View>
        <View style={styles.countBadge}>
          <IconStar size={15} color={Colors.accentLight} filled />
          <AppText variant="caption" color={Colors.accentLight}>
            {formatCompactNumber(watchedCoins.length)}
          </AppText>
        </View>
      </Animated.View>

      <Animated.View style={[styles.intro, introStyle]}>
        <AppText variant="h1">Tus favoritos</AppText>
        <AppText variant="body" color={Colors.textSecondary}>
          Todo lo que sigues, reunido en un solo lugar.
        </AppText>
      </Animated.View>

      <Animated.View style={[styles.searchBox, searchStyle]}>
        <IconSearch size={18} color={Colors.textMuted} />
        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          onChangeText={setQuery}
          placeholder="Buscar criptomonedas"
          placeholderTextColor={Colors.textMuted}
          returnKeyType="search"
          style={styles.searchInput}
          value={query}
        />
      </Animated.View>

      <Animated.View style={[styles.filters, filtersStyle]}>
        {FILTERS.map((item) => (
          <Chip
            key={item.key}
            label={item.label}
            selected={filter === item.key}
            onPress={() => setFilter(item.key)}
          />
        ))}
      </Animated.View>

      <View style={styles.sectionHeading}>
        <AppText variant="h2">
          {filter === 'watchlist' ? 'Tu colección' : 'Activos'}
        </AppText>
        <AppText variant="caption" color={Colors.textMuted}>
          {filteredCoins.length} monedas
        </AppText>
      </View>
    </View>
  );

  const emptyState =
    filter === 'watchlist' && !query.trim() ? (
      <Reveal offset={6} duration={180}>
        <View style={styles.emptyState}>
          <Card style={styles.emptyCard}>
            <View style={styles.emptyIcon}>
              <IconStar size={24} color={Colors.accentLight} />
            </View>
            <AppText variant="h2">Empieza tu lista</AppText>
            <AppText variant="body" color={Colors.textSecondary} align="center">
              Guarda tus criptomonedas favoritas para tenerlas siempre a mano.
            </AppText>
          </Card>
          {suggestions.length > 0 ? (
            <View style={styles.suggestions}>
              <AppText variant="label" color={Colors.textSecondary}>
                POPULARES PARA EMPEZAR
              </AppText>
              {suggestions.map((coin) => (
                <SuggestionRow
                  coin={coin}
                  key={coin.id}
                  onAdd={() => toggleWatch(coin.id)}
                  onPress={() => openCoin(coin.id)}
                />
              ))}
            </View>
          ) : null}
        </View>
      </Reveal>
    ) : (
      <Reveal offset={6} duration={170}>
        <Card style={styles.emptyCard}>
          <AppText variant="bodyMedium">No encontramos resultados</AppText>
          <AppText variant="caption" color={Colors.textSecondary}>
            Ajusta tu búsqueda o selecciona otra categoría.
          </AppText>
        </Card>
      </Reveal>
    );

  return (
    <View style={styles.screen}>
      <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
        <FlatList
          contentContainerStyle={styles.listContent}
          data={filteredCoins}
          keyExtractor={(coin) => coin.id}
          ListEmptyComponent={status === 'loading' ? <Skeleton height={74} /> : emptyState}
          ListFooterComponent={<View style={styles.listFooter} />}
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
            <MarketRow
              coin={item}
              watched={isWatched(item.id)}
              onPress={() => openCoin(item.id)}
              onToggle={() => toggleWatch(item.id)}
            />
          )}
          showsVerticalScrollIndicator={false}
          style={styles.list}
          windowSize={7}
          initialNumToRender={12}
          maxToRenderPerBatch={12}
          removeClippedSubviews
          ItemSeparatorComponent={ListSeparator}
        />
      </SafeAreaView>
    </View>
  );
}

const MarketRow = memo(
  function MarketRow({
    coin,
    watched,
    onPress,
    onToggle,
  }: {
    coin: Coin;
    watched: boolean;
    onPress: () => void;
    onToggle: () => void;
  }) {
    return (
      <View style={styles.marketRow}>
        <View style={styles.coinRow}>
          <CoinRow coin={coin} onPress={onPress} showRank={false} />
        </View>
        <IconButton
          accessibilityLabel={watched ? `Quitar ${coin.name} de favoritos` : `Guardar ${coin.name}`}
          onPress={onToggle}
          style={watched ? styles.starActive : undefined}>
          <IconStar size={19} color={watched ? Colors.accentLight : Colors.textMuted} filled={watched} />
        </IconButton>
      </View>
    );
  },
  (prev, next) => prev.coin === next.coin && prev.watched === next.watched
);

function SuggestionRow({
  coin,
  onAdd,
  onPress,
}: {
  coin: Coin;
  onAdd: () => void;
  onPress: () => void;
}) {
  return (
    <View style={styles.suggestionRow}>
      <View style={styles.coinRow}>
        <CoinRow coin={coin} onPress={onPress} showRank={false} showSparkline={false} />
      </View>
      <IconButton accessibilityLabel={`Agregar ${coin.name} a favoritos`} onPress={onAdd}>
        <IconStar size={19} color={Colors.accentLight} />
      </IconButton>
    </View>
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
  countBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.two + 2,
    paddingVertical: Spacing.two,
    backgroundColor: Colors.accentSoft,
  },
  intro: {
    gap: Spacing.two,
    paddingTop: Spacing.two,
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
  filters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  marketRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  coinRow: {
    flex: 1,
    minWidth: 0,
  },
  starActive: {
    backgroundColor: Colors.accentSoft,
    borderColor: 'rgba(124, 92, 255, 0.4)',
  },
  separator: {
    height: Spacing.two,
  },
  emptyState: {
    gap: Spacing.four,
  },
  emptyCard: {
    gap: Spacing.two,
    alignItems: 'center',
    paddingVertical: Spacing.five,
  },
  emptyIcon: {
    width: 54,
    height: 54,
    borderRadius: Radius.large,
    backgroundColor: Colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.two,
  },
  suggestions: {
    gap: Spacing.two,
  },
  listFooter: {
    height: Spacing.three,
  },
});
