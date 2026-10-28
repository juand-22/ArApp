import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import {
  Easing,
  interpolateColor,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { AppText } from '@/components/ui/app-text';
import { PressableScale } from '@/components/ui/pressable-scale';
import { Colors, Radius, Spacing } from '@/constants/theme';

type Props = {
  label: string;
  selected?: boolean;
  onPress: () => void;
};

export function Chip({ label, selected = false, onPress }: Props) {
  const progress = useSharedValue(selected ? 1 : 0);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    progress.value = withTiming(selected ? 1 : 0, {
      duration: reducedMotion ? 70 : 150,
      easing: Easing.out(Easing.quad),
    });
  }, [progress, reducedMotion, selected]);

  const surface = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      ['#10131B', 'rgba(124, 92, 255, 0.24)']
    ),
    borderColor: interpolateColor(
      progress.value,
      [0, 1],
      ['rgba(255, 255, 255, 0.06)', 'rgba(124, 92, 255, 0.5)']
    ),
  }));

  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityState={{ selected }}
      animatedStyle={surface}
      onPress={onPress}
      pressedOpacity={0.86}
      scaleTo={0.96}
      style={styles.chip}>
      <AppText variant="label" color={selected ? Colors.text : Colors.textSecondary}>
        {label}
      </AppText>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderRadius: Radius.pill,
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
