import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import { CryptoIcon } from '@/components/crypto-icon';
import { Sparkline } from '@/components/sparkline';
import { AppText } from '@/components/ui/app-text';
import { PressableScale } from '@/components/ui/pressable-scale';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { formatPercent, formatPrice } from '@/lib/format';
import type { Coin } from '@/lib/types';

type Props = {
  coin: Coin;
  onPress: () => void;
  showRank?: boolean;
  showSparkline?: boolean;
};

function CoinRowBase({ coin, onPress, showRank = true, showSparkline = true }: Props) {
  const change = coin.price_change_percentage_24h;
  const trendColor =
    typeof change === 'number' && Number.isFinite(change)
      ? change >= 0
        ? Colors.positive
        : Colors.negative
      : Colors.textSecondary;

  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={`${coin.name}, ${formatPrice(coin.current_price)}, ${formatPercent(change)}`}
      onPress={onPress}
      pressedOpacity={0.82}
      scaleTo={0.985}
      style={styles.row}>
      {showRank ? (
        <AppText variant="caption" color={Colors.textMuted} tabular style={styles.rank}>
          {coin.market_cap_rank ?? '—'}
        </AppText>
      ) : null}

      <CryptoIcon symbol={coin.symbol} image={coin.image} size={40} />

      <View style={styles.nameColumn}>
        <AppText variant="title" numberOfLines={1}>
          {coin.name}
        </AppText>
        <AppText variant="caption" color={Colors.textMuted}>
          {coin.symbol.toUpperCase()}
        </AppText>
      </View>

      {showSparkline ? (
        <Sparkline
          values={coin.sparkline_in_7d?.price}
          width={54}
          height={28}
          color={trendColor}
        />
      ) : null}

      <View style={styles.priceColumn}>
        <AppText variant="title" tabular numberOfLines={1}>
          {formatPrice(coin.current_price)}
        </AppText>
        <AppText variant="caption" color={trendColor} tabular>
          {formatPercent(change)}
        </AppText>
      </View>
    </PressableScale>
  );
}

export const CoinRow = memo(CoinRowBase, (prev, next) => {
  // Los callbacks se recrean en cada render; el objeto coin es estable mientras
  // su precio no cambia, así que saltarse esas filas mantiene el scroll fluido.
  return (
    prev.coin === next.coin &&
    prev.showRank === next.showRank &&
    prev.showSparkline === next.showSparkline
  );
});

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two + 2,
    paddingHorizontal: Spacing.three - 4,
    paddingVertical: 10,
    borderRadius: Radius.large,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
  },
  rank: {
    width: 20,
    textAlign: 'center',
  },
  nameColumn: {
    flex: 1,
    minWidth: 0,
    gap: 1,
  },
  priceColumn: {
    alignItems: 'flex-end',
    gap: 1,
  },
});
