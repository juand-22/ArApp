import { Tabs } from 'expo-router/js-tabs';
import { Easing } from 'react-native';

import { BottomNav } from '@/components/bottom-nav';
import { Colors } from '@/constants/theme';

/**
 * Los tabs animan la escena con un fundido cruzado en lugar de reemplazar la
 * pantalla completa en el stack. Reemplazarla causaba un destello y un
 * deslizamiento en dirección incorrecta en Android, que hacía que el cambio
 * de tab se viera roto.
 */
const TAB_TRANSITION = {
  animation: 'timing' as const,
  config: {
    duration: 170,
    easing: Easing.out(Easing.cubic),
  },
};

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        transitionSpec: TAB_TRANSITION,
        sceneStyle: { backgroundColor: Colors.background },
        lazy: true,
      }}
      tabBar={(props) => <BottomNav {...props} />}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="explore" />
    </Tabs>
  );
}
