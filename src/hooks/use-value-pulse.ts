import { useEffect, useRef } from 'react';
import {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

/** Tiempo mínimo entre pulsos para que los ticks en vivo no se vean nerviosos. */
const PULSE_INTERVAL_MS = 1200;

/** Pulso sutil de escala cada vez que cambia un valor en vivo (p. ej. un precio). */
export function useValuePulse(value: number | string | null | undefined) {
  const scale = useSharedValue(1);
  const reducedMotion = useReducedMotion();
  const previous = useRef(value);
  const lastPulseAt = useRef(0);

  useEffect(() => {
    if (previous.current === value) return;
    previous.current = value;
    if (reducedMotion) return;

    const now = Date.now();
    if (now - lastPulseAt.current < PULSE_INTERVAL_MS) return;
    lastPulseAt.current = now;

    scale.value = withSequence(
      withTiming(1.01, { duration: 90 }),
      withSpring(1, { damping: 20, stiffness: 240, mass: 0.5 })
    );
  }, [reducedMotion, scale, value]);

  return useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
}
