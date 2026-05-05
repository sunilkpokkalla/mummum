import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { Platform, NativeModules } from 'react-native';
import 'react-native-reanimated';


import { useColorScheme } from '@/hooks/useColorScheme';

import { useBabyStore } from '@/store/useBabyStore';
import { useRouter, useSegments, useRootNavigationState } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async (_notification: any) => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  const { setPro, isOnboarded, babies, tempBaby, addBaby, isTrial, trialStartedAt } = useBabyStore();

  // Trial Expiry Logic (7 Days)
  useEffect(() => {
    if (isTrial && trialStartedAt) {
      const trialDuration = 3 * 24 * 60 * 60 * 1000; // 3 days in ms
      const now = Date.now();
      if (now - trialStartedAt > trialDuration) {
        setPro(false, false); // Expire trial
      }
    }
  }, [isTrial, trialStartedAt]);

  // Self-healing for onboarding data leak
  useEffect(() => {
    if (isOnboarded && babies.length === 0 && tempBaby.name) {
      addBaby({
        id: Math.random().toString(36).substring(7),
        name: tempBaby.name,
        birthDate: tempBaby.birthDate || new Date(),
        photoUri: tempBaby.photoUri,
      });
    }
  }, [isOnboarded, babies.length, tempBaby.name]);

  // RevenueCat Initialization
  useEffect(() => {
    const initPurchases = async () => {
      // Check the actual native bridge — not the JS proxy wrapper
      if (!NativeModules.RNPurchases || Platform.OS !== 'ios') {
        console.log('RevenueCat: Skipped — native module unavailable on this target.');
        return;
      }
      try {
        const { default: Purchases, LOG_LEVEL } = await import('react-native-purchases');
        Purchases.setLogLevel(LOG_LEVEL.DEBUG);
        Purchases.configure({ apiKey: "appl_JYLndmcdSjoNMbEIPlPydtdGLtf" });
        const customerInfo = await Purchases.getCustomerInfo();
        const activePro = !!customerInfo.entitlements.active['pro'] || Object.keys(customerInfo.entitlements.active).length > 0;
        setPro(activePro);
      } catch (e) {
        console.log('RevenueCat Init error:', e);
      }
    };

    initPurchases();
  }, []);

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const colorScheme = 'light';
  const { isOnboarded } = useBabyStore();
  const segments = useSegments();
  const router = useRouter();
  const rootNavigationState = useRootNavigationState();

  useEffect(() => {
    if (!rootNavigationState?.key) return;

    const inOnboardingGroup = segments[0] === 'onboarding';

    if (!isOnboarded && !inOnboardingGroup) {
      // Redirect to onboarding if not onboarded and not already there
      setTimeout(() => {
        router.replace('/onboarding');
      }, 1);
    } else if (isOnboarded && inOnboardingGroup) {
      // Redirect to home if onboarded but trying to access onboarding
      setTimeout(() => {
        router.replace('/(tabs)');
      }, 1);
    }
  }, [isOnboarded, segments, rootNavigationState?.key]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={DefaultTheme}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="onboarding/index" />
          <Stack.Screen name="onboarding/name" />
          <Stack.Screen name="onboarding/birthdate" />
          <Stack.Screen name="onboarding/wishes" />
          <Stack.Screen name="onboarding/offer" />
          <Stack.Screen name="onboarding/welcome" />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="log/feed" options={{ presentation: 'modal', headerShown: false }} />
          <Stack.Screen name="log/sleep" options={{ presentation: 'modal', headerShown: false }} />
          <Stack.Screen name="log/diaper" options={{ presentation: 'modal', headerShown: false }} />
        </Stack>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
