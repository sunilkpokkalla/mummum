import React from 'react';
import { StyleSheet, View, Image, TouchableOpacity, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import Typography from '@/components/Typography';
import { ArrowRight } from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useBabyStore } from '@/store/useBabyStore';

const { width } = Dimensions.get('window');

export default function LogoSlideScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const themeColors = Colors[colorScheme];
  const { babies } = useBabyStore();

  const handleStart = () => {
    if (babies.length > 0) {
      router.replace('/(tabs)');
    } else {
      router.push('/onboarding/name');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <View style={styles.content}>
        <Animated.View entering={FadeInDown.duration(1000)} style={styles.logoContainer}>
          <Image 
            source={require('@/assets/images/MUMMUM_FINAL.png')} 
            style={styles.logo}
            resizeMode="contain"
          />
        </Animated.View>
        
        <Animated.View entering={FadeInDown.delay(500).duration(1000)} style={styles.textContainer}>
          <Typography 
            variant="headline" 
            weight="500" 
            align="center" 
            color={themeColors.icon} 
            style={styles.subtitle}
          >
            Your baby's journey, beautifully tracked.
          </Typography>
        </Animated.View>
      </View>

      <Animated.View entering={FadeInUp.delay(1000).duration(800)} style={styles.footer}>
        <TouchableOpacity 
          style={[styles.button, { backgroundColor: themeColors.primary }]}
          onPress={handleStart}
        >
          <Typography weight="600" style={{ color: '#fff' }}>
            {babies.length > 0 ? 'Welcome Back' : 'Get Started'}
          </Typography>
          <ArrowRight size={20} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.signInBtn}
          onPress={() => router.push('/onboarding/auth')}
        >
          <Typography variant="body" weight="600" color={themeColors.icon}>
            Already have an account? <Typography weight="700" color={themeColors.primary}>Sign In</Typography>
          </Typography>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  logoContainer: {
    width: width * 0.8,
    height: width * 0.8,
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  textContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: 40,
    fontWeight: '800',
    marginBottom: 12,
    display: 'none',
  },
  subtitle: {
    paddingHorizontal: 20,
    lineHeight: 24,
  },
  footer: {
    padding: 32,
    paddingBottom: 48,
    alignItems: 'center',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 40,
    borderRadius: 32,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
    width: '100%',
    justifyContent: 'center',
  },
  signInBtn: {
    marginTop: 20,
    paddingVertical: 12,
  },
});
