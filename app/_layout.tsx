import { useEffect } from 'react';
import { LogBox, Platform, NativeModules } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ThemeProvider, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { useColorScheme } from '@/hooks/useColorScheme';
import * as SplashScreen from 'expo-splash-screen';
import { useBabyStore } from '@/store/useBabyStore';
import ElegantModal from '@/components/ElegantModal';
import { useCloudSync } from '@/hooks/useCloudSync';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

// CLINICAL SILENCE: Suppress non-critical production noise
LogBox.ignoreLogs([
  'deployment version mismatch',
  'ignoring duplicate libraries',
  'NativeEventEmitter',
  'Non-serializable value',
  'ClonableElement',
  'Task exceeded',
  'Sending',
  'Purchase was cancelled',
]);

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const { globalModalConfig, hideGlobalModal, _hasHydrated } = useBabyStore();
  
  useEffect(() => {
    if (Platform.OS === 'ios' && NativeModules.RNPurchases) {
      try {
        const Purchases = require('react-native-purchases').default;
        Purchases.setLogLevel(Purchases.LOG_LEVEL.INFO);
        Purchases.configure({ apiKey: 'appl_gWsdCGHELkQjkHmjNeeTGKwgvnd' });
        
        // PROACTIVE STATUS CHECK: Ensure local state matches store truth on launch
        const syncProStatus = async () => {
          try {
            const customerInfo = await Purchases.getCustomerInfo();
            const activeEntitlements = Object.keys(customerInfo.entitlements.active);
            const hasPro = !!customerInfo.entitlements.active['pro'] || activeEntitlements.length > 0;
            
            if (hasPro !== useBabyStore.getState().isPro) {
              useBabyStore.getState().setPro(hasPro);
            }
          } catch (e) {
            console.log('[RevenueCat]: Initial status check failed', e);
          }
        };
        syncProStatus();
      } catch (e) {
        console.error('[RevenueCat]: Configuration failed', e);
      }
    }
  }, []);
  
  // ACTIVATE REAL-TIME CLINICAL SYNC
  useCloudSync();

  useEffect(() => {
    if (_hasHydrated) {
      SplashScreen.hideAsync();
    }
  }, [_hasHydrated]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" options={{ animation: 'none' }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false, animation: 'none' }} />
          <Stack.Screen name="onboarding/index" options={{ headerShown: false, animation: 'none' }} />
          <Stack.Screen name="onboarding/baby-info" options={{ headerShown: false }} />
          <Stack.Screen name="onboarding/offer" options={{ headerShown: false, presentation: 'fullScreenModal' }} />
          <Stack.Screen name="premium" options={{ headerShown: false, presentation: 'fullScreenModal' }} />
          <Stack.Screen name="log/feed" options={{ headerShown: false, presentation: 'modal' }} />
          <Stack.Screen name="log/diaper" options={{ headerShown: false, presentation: 'modal' }} />
          <Stack.Screen name="log/sleep" options={{ headerShown: false, presentation: 'modal' }} />
          <Stack.Screen name="log/medical" options={{ headerShown: false, presentation: 'modal' }} />
          <Stack.Screen name="checklists/index" options={{ headerShown: false, presentation: 'modal' }} />
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
