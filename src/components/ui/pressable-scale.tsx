import type { ReactNode } from 'react';
import {
  Pressable,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, {
  type AnimatedStyle,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const SPRING = { damping: 20, stiffness: 320, mass: 0.5 };

type Props = Omit<PressableProps, 'style' | 'children'> & {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Estilo animado extra (p. ej. colores de selección) combinado con el estilo de presión. */
  animatedStyle?: StyleProp<AnimatedStyle<ViewStyle>>;
  /** Escala final mientras el elemento está presionado. */
  scaleTo?: number;
  /** Opacidad final mientras el elemento está presionado. */
  pressedOpacity?: number;
};

/**
 * Feedback de presión multiplataforma basado en shared values de Reanimated,
 * de modo que la animación corre en el hilo de UI en Android e iOS.
 */
export function PressableScale({
  children,
  style,
  animatedStyle,
  scaleTo = 0.97,
  pressedOpacity = 0.9,
  disabled,
  onPressIn,
  onPressOut,
  ...rest
}: Props) {
  const pressed = useSharedValue(0);
  const reducedMotion = useReducedMotion();

  const pressStyle = useAnimatedStyle(() => ({
    opacity: 1 - pressed.value * (1 - pressedOpacity),
    transform: [{ scale: reducedMotion ? 1 : 1 - pressed.value * (1 - scaleTo) }],
  }));

  return (
    <AnimatedPressable
      {...rest}
      disabled={disabled}
      onPressIn={(event) => {
        if (!disabled) {
          pressed.value = withSpring(1, SPRING);
        }
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        pressed.value = withSpring(0, SPRING);
        onPressOut?.(event);
      }}
      style={[style, animatedStyle, pressStyle]}>
      {children}
    </AnimatedPressable>
  );
}
