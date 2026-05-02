import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';

import { useBabyStore } from '@/store/useBabyStore';
import { useRouter, useSegments, useRootNavigationState } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
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

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  // We still render even if fonts aren't loaded to avoid blank screen if fonts fail
  // but we can check error if needed.

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
          <Stack.Screen name="onboarding/auth" />
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
