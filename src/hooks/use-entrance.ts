import { useCallback, useRef } from 'react';
import { useFocusEffect } from 'expo-router';
import {
  Easing,
  type SharedValue,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

type Options = {
  delay?: number;
  duration?: number;
  offset?: number;
  once?: boolean;
};

function playEntrance(
  progress: SharedValue<number>,
  delay: number,
  duration: number,
  reducedMotion: boolean
) {
  // Con movimiento reducido se mantiene un fundido corto en lugar de saltar,
  // para que la UI siga sintiéndose viva con las animaciones del sistema
  // desactivadas.
  progress.value = withDelay(
    reducedMotion ? 0 : delay,
    withTiming(1, {
      duration: reducedMotion ? 90 : duration,
      easing: Easing.out(Easing.cubic),
    })
  );
}

/**
 * Animación de entrada guiada por el foco de la pantalla en lugar del
 * `entering` de Reanimated. Las animaciones de layout pueden terminar antes
 * de que la transición nativa revele el contenido en Android, lo que hacía
 * que pareciera que no había animación.
 */
export function useEntrance({
  delay = 0,
  duration = 240,
  offset = 10,
  once = true,
}: Options = {}) {
  const progress = useSharedValue(0);
  const reducedMotion = useReducedMotion();
  const hasPlayed = useRef(false);

  useFocusEffect(
    useCallback(() => {
      if (once && hasPlayed.current) return;
      hasPlayed.current = true;
      playEntrance(progress, delay, duration, reducedMotion);
    }, [delay, duration, once, progress, reducedMotion])
  );

  return useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: reducedMotion ? 0 : (1 - progress.value) * offset }],
  }));
}
