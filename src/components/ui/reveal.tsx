import { useEffect, type ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

type Props = {
  children: ReactNode;
  delay?: number;
  duration?: number;
  offset?: number;
  style?: StyleProp<ViewStyle>;
};

/**
 * Animación de montaje basada en shared values. A diferencia de `entering`,
 * sigue funcionando cuando el elemento se monta dentro de una pantalla de
 * stack nativo en Android.
 */
export function Reveal({
  children,
  delay = 0,
  duration = 200,
  offset = 8,
  style,
}: Props) {
  const progress = useSharedValue(0);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    progress.value = withDelay(
      reducedMotion ? 0 : delay,
      withTiming(1, {
        duration: reducedMotion ? 90 : duration,
        easing: Easing.out(Easing.cubic),
      })
    );
  }, [delay, duration, progress, reducedMotion]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: reducedMotion ? 0 : (1 - progress.value) * offset }],
  }));

  return <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>;
}
