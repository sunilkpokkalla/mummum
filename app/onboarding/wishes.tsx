import React, { useEffect } from 'react';
import { StyleSheet, View, Image, TouchableOpacity, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import Typography from '@/components/Typography';
import { useBabyStore } from '@/store/useBabyStore';
import { Heart, ArrowRight } from 'lucide-react-native';
import Animated, { 
  FadeIn, FadeInDown, FadeInUp,
  useSharedValue, useAnimatedStyle, withTiming, withDelay, withRepeat, withSequence,
  Easing, interpolate
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const HEART_CONFIGS = [
  { size: 18, startX: '10%', delay: 300,  duration: 3500, color: '#e8a0bf' },
  { size: 24, startX: '25%', delay: 800,  duration: 4000, color: '#f4a0a0' },
  { size: 14, startX: '40%', delay: 200,  duration: 3200, color: '#d4a0d4' },
  { size: 20, startX: '55%', delay: 1200, duration: 3800, color: '#e8a0bf' },
  { size: 16, startX: '70%', delay: 600,  duration: 3600, color: '#f4a0a0' },
  { size: 22, startX: '85%', delay: 1000, duration: 4200, color: '#d4a0d4' },
  { size: 12, startX: '15%', delay: 1500, duration: 3000, color: '#f4a0a0' },
  { size: 18, startX: '48%', delay: 400,  duration: 3400, color: '#e8a0bf' },
  { size: 15, startX: '78%', delay: 900,  duration: 3700, color: '#d4a0d4' },
  { size: 20, startX: '33%', delay: 1800, duration: 4100, color: '#f4a0a0' },
];

function FloatingHeart({ size, startX, delay, duration, color }: typeof HEART_CONFIGS[0]) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withRepeat(
        withTiming(1, { duration, easing: Easing.out(Easing.quad) }),
        -1, // infinite repeat
        false
      )
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    const translateY = interpolate(progress.value, [0, 1], [0, -(SCREEN_HEIGHT * 0.55)]);
    const opacity = interpolate(progress.value, [0, 0.1, 0.7, 1], [0, 1, 0.8, 0]);
    const scale = interpolate(progress.value, [0, 0.3, 0.7, 1], [0.3, 1.1, 1, 0.6]);
    const translateX = interpolate(progress.value, [0, 0.25, 0.5, 0.75, 1], [0, 12, -8, 10, -5]);

    return {
      transform: [{ translateY }, { translateX }, { scale }],
      opacity,
    };
  });

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          bottom: 10,
          left: startX,
        },
        animatedStyle,
      ]}
    >
      <Heart size={size} color={color} fill={color} />
    </Animated.View>
  );
}

export default function WishesScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const themeColors = Colors[colorScheme];
  const { tempBaby } = useBabyStore();

  const handleNext = () => {
    router.push('/onboarding/welcome');
  };

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      {/* Top half — baby celebration image with floating hearts */}
      <Animated.View entering={FadeIn.duration(1000)} style={styles.imageContainer}>
        <Image
          source={require('@/assets/images/baby_celebration.png')}
          style={styles.image}
          resizeMode="cover"
        />
        <View style={[styles.overlay, { backgroundColor: themeColors.background + '40' }]} />
        
        {/* Floating hearts */}
        {HEART_CONFIGS.map((config, index) => (
          <FloatingHeart key={index} {...config} />
        ))}
      </Animated.View>

      {/* Bottom half — clean white with centered bold text */}
      <View style={styles.bottomHalf}>
        <Animated.View entering={FadeInDown.delay(500).duration(800)} style={styles.textContent}>
          <View style={[styles.iconCircle, { backgroundColor: themeColors.error + '15' }]}>
            <Heart size={32} color={themeColors.error} fill={themeColors.error} />
          </View>
          <Typography variant="display" weight="800" style={styles.title}>
            Congratulations!
          </Typography>
          <Typography variant="bodyLg" weight="600" color={themeColors.icon} style={styles.message}>
            Wishing {tempBaby.name || 'your baby'} a world filled with love, laughter, and beautiful moments.
          </Typography>
          <Typography variant="bodyMd" color={themeColors.icon} style={styles.submessage}>
            We're so happy to be part of your journey.
          </Typography>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(1000).duration(800)} style={styles.footer}>
          <TouchableOpacity 
            style={[styles.button, { backgroundColor: themeColors.primary }]}
            onPress={handleNext}
          >
            <Typography weight="600" style={{ color: '#fff' }}>Thank you</Typography>
            <ArrowRight size={20} color="#fff" />
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  imageContainer: {
    flex: 1,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  bottomHalf: {
    flex: 1,
    justifyContent: 'space-between',
  },
  textContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 36,
  },
  title: {
    fontSize: 36,
    textAlign: 'center',
    marginBottom: 20,
    letterSpacing: -0.5,
  },
  message: {
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: 10,
  },
  submessage: {
    textAlign: 'center',
    lineHeight: 22,
    opacity: 0.6,
  },
  footer: {
    paddingHorizontal: 32,
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
    width: '100%',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
});

