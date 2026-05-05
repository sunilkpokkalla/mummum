import React, { useEffect } from 'react';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useBabyStore } from '@/store/useBabyStore';
import Typography from '@/components/Typography';
import { CheckCircle2 } from 'lucide-react-native';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';

export default function OnboardingCompleteScreen() {
  const router = useRouter();
  const { tempBaby, addBaby, completeOnboarding } = useBabyStore();

  useEffect(() => {
    const finalize = async () => {
      // 1. Create the permanent baby record from temp data
      if (tempBaby.name) {
        addBaby({
          id: Math.random().toString(36).substring(7),
          name: tempBaby.name,
          birthDate: tempBaby.birthDate || new Date(),
          photoUri: tempBaby.photoUri,
        });
      }

      // 2. Mark onboarding as complete to allow main app access
      completeOnboarding();

      // 3. Short delay for visual confirmation then redirect
      setTimeout(() => {
        router.replace('/(tabs)');
      }, 1500);
    };

    finalize();
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View entering={ZoomIn.duration(800)} style={styles.iconBox}>
        <CheckCircle2 size={80} color="#1B3C35" />
      </Animated.View>
      
      <Animated.View entering={FadeIn.delay(400).duration(800)} style={styles.textBox}>
        <Typography variant="headline" weight="800" color="#1B3C35">Setup Complete!</Typography>
        <Typography variant="body" color="#607D8B" align="center" style={{ marginTop: 8 }}>
          Building your baby's clinical timeline...
        </Typography>
      </Animated.View>

      <ActivityIndicator color="#1B3C35" style={{ marginTop: 40 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDFCFB',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  iconBox: {
    marginBottom: 24,
  },
  textBox: {
    alignItems: 'center',
  },
});
