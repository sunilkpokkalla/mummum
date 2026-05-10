import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ThemeProvider, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { useColorScheme } from '@/hooks/useColorScheme';
import * as SplashScreen from 'expo-splash-screen';
import { useBabyStore } from '@/store/useBabyStore';
import ElegantModal from '@/components/ElegantModal';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const { globalModalConfig, hideGlobalModal } = useBabyStore();

  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="onboarding/index" options={{ headerShown: false }} />
          <Stack.Screen name="onboarding/baby-info" options={{ headerShown: false }} />
          <Stack.Screen name="onboarding/offer" options={{ headerShown: false, presentation: 'fullScreenModal' }} />
          <Stack.Screen name="premium" options={{ headerShown: false, presentation: 'fullScreenModal' }} />
        </Stack>
        <StatusBar style="auto" />
        
        {/* Global Master Modal Controller */}
        <ElegantModal 
          visible={globalModalConfig.visible}
          onClose={hideGlobalModal}
          onConfirm={() => {
            if (globalModalConfig.onConfirm) globalModalConfig.onConfirm();
            hideGlobalModal();
          }}
          onSecondary={() => {
            if (globalModalConfig.onSecondary) globalModalConfig.onSecondary();
            hideGlobalModal();
          }}
          title={globalModalConfig.title}
          description={globalModalConfig.description}
          confirmText={globalModalConfig.confirmText}
          secondaryText={globalModalConfig.secondaryText}
          cancelText={globalModalConfig.cancelText || "Cancel"}
        />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
