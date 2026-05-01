import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';

export default function AddScreen() {
  const router = useRouter();

  useEffect(() => {
    // For now, redirect to feeding log or show a menu
    // Since this is a FAB, the tab bar button usually handles the action
    // but we need the screen to exist for Expo Router.
    router.replace('/log/feed');
  }, []);

  return <View />;
}
