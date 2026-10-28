import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
} from '@expo-google-fonts/manrope';
import { DarkTheme, ThemeProvider } from 'expo-router';
import { Stack, TransitionPresets } from 'expo-router/js-stack';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { useEffect } from 'react';
import { Easing, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';

import { Colors } from '@/constants/theme';
import { MarketProvider } from '@/context/market-context';

void SplashScreen.preventAutoHideAsync();

/**
 * Las transiciones del stack nativo no se pueden acortar en Android
 * (`transitionDuration` solo aplica en iOS), así que la pantalla de detalle
 * usa el stack JS, que permite elegir la duración exacta en ambas plataformas.
 */
const DETAIL_TRANSITION = {
  ...TransitionPresets.SlideFromRightIOS,
  transitionSpec: {
    open: {
      animation: 'timing' as const,
      config: { duration: 200, easing: Easing.out(Easing.cubic) },
    },
    close: {
      animation: 'timing' as const,
      config: { duration: 160, easing: Easing.out(Easing.quad) },
    },
  },
};

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      void SplashScreen.hideAsync();
    }
  }, [fontError, fontsLoaded]);

  if (fontError) throw fontError;
  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={styles.root}>
      <ThemeProvider value={DarkTheme}>
        <MarketProvider>
          <StatusBar style="light" />
          <Stack
            screenOptions={{
              headerShown: false,
              cardStyle: { backgroundColor: Colors.background },
              cardOverlayEnabled: false,
              ...DETAIL_TRANSITION,
            }}>
            <Stack.Screen name="(tabs)" />
            {/*
              Mantener la pantalla anterior montada evita el destello en blanco
              cuando el detalle se desliza fuera: si no, la pantalla de tabs se
              desmonta al inicio de la animación de cierre y solo se remonta a
              mitad de camino.
            */}
            <Stack.Screen name="coin/[id]" options={{ detachPreviousScreen: false }} />
          </Stack>
        </MarketProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
});
