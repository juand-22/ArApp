import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Colors, Radius } from '@/constants/theme';
import { formatPercent } from '@/lib/format';

type Props = {
  value: number | null | undefined;
  size?: 'small' | 'medium';
  style?: StyleProp<ViewStyle>;
};

export function ChangeBadge({ value, size = 'small', style }: Props) {
  const numeric = typeof value === 'number' && Number.isFinite(value);
  const positive = (value ?? 0) >= 0;
  const color = !numeric ? Colors.textSecondary : positive ? Colors.positive : Colors.negative;
  const backgroundColor = !numeric
    ? Colors.surfaceHigh
    : positive
      ? Colors.positiveSoft
      : Colors.negativeSoft;

  return (
    <View
      style={[
        styles.badge,
        size === 'medium' && styles.badgeMedium,
        { backgroundColor },
        style,
      ]}>
      <AppText
        variant={size === 'medium' ? 'label' : 'caption'}
        tabular
        style={{ color }}>
        {formatPercent(numeric ? value : null)}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: Radius.pill,
    alignSelf: 'flex-start',
  },
  badgeMedium: {
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
});
