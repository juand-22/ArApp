import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { useEffect, type ReactNode } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  Easing,
  interpolateColor,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { IconMarkets, IconStar } from '@/components/icons';
import { AppText } from '@/components/ui/app-text';
import { PressableScale } from '@/components/ui/pressable-scale';
import { Colors, Radius, Spacing } from '@/constants/theme';

const MARKET_ROUTE = 'index';
const WATCHLIST_ROUTE = 'explore';

/**
 * Barra de pestañas propia para el navegador de tabs. Mantenerla montada entre
 * cambios de tab permite animar la píldora activa en lugar de recrearla en
 * cada navegación.
 */
export function BottomNav({ state, emitter, navigateToTab }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const activeName = state.routes[state.index]?.name;
  const isMarket = activeName === MARKET_ROUTE;
  const isWatchlist = activeName === WATCHLIST_ROUTE;

  const goTo = (name: string) => {
    const route = state.routes.find((item) => item.name === name);
    if (!route) return;

    const event = emitter.emit({
      type: 'tabPress',
      target: route.key,
      canPreventDefault: true,
    });

    if (activeName === name || event.defaultPrevented) return;
    navigateToTab(route.key);
  };

  return (
    <View style={[styles.safeArea, { paddingBottom: Math.max(insets.bottom, Spacing.two) }]}>
      <View style={styles.bar}>
        <NavItem active={isMarket} label="Mercado" onPress={() => goTo(MARKET_ROUTE)}>
          <IconMarkets size={20} color={isMarket ? Colors.accentLight : Colors.textMuted} />
        </NavItem>

        <NavItem active={isWatchlist} label="Favoritos" onPress={() => goTo(WATCHLIST_ROUTE)}>
          <IconStar
            size={20}
            color={isWatchlist ? Colors.accentLight : Colors.textMuted}
            filled={isWatchlist}
          />
        </NavItem>
      </View>
    </View>
  );
}

function NavItem({
  active,
  label,
  onPress,
  children,
}: {
  active: boolean;
  label: string;
  onPress: () => void;
  children: ReactNode;
}) {
  const progress = useSharedValue(active ? 1 : 0);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    progress.value = withTiming(active ? 1 : 0, {
      duration: reducedMotion ? 70 : 160,
      easing: Easing.out(Easing.cubic),
    });
  }, [active, progress, reducedMotion]);

  const surface = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      ['rgba(124, 92, 255, 0)', Colors.accentSoft]
    ),
  }));

  // Pequeño elevado/escala del icono para que el cambio de tab se lea como
  // movimiento y no solo como cambio de color. Corre en el hilo de UI.
  const iconStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: reducedMotion ? 1 : 1 + progress.value * 0.06 },
      { translateY: reducedMotion ? 0 : -progress.value },
    ],
  }));

  return (
    <PressableScale
      accessibilityRole={Platform.OS === 'ios' ? 'button' : 'tab'}
      aria-selected={active}
      animatedStyle={surface}
      onPress={onPress}
      pressedOpacity={0.78}
      scaleTo={0.94}
      style={styles.tab}>
      <Animated.View style={iconStyle}>{children}</Animated.View>
      <AppText variant="caption" color={active ? Colors.text : Colors.textMuted}>
        {label}
      </AppText>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    minHeight: 62,
    borderRadius: Radius.xlarge,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    paddingHorizontal: Spacing.four,
    gap: Spacing.two,
  },
  tab: {
    flex: 1,
    maxWidth: 140,
    minWidth: 96,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: Spacing.two,
  },
});
