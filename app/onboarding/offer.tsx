import React from 'react';
import { 
  StyleSheet, 
  View, 
  TouchableOpacity, 
  Image, 
  ScrollView,
  Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import Typography from '@/components/Typography';
import { Check, Star, ShieldCheck, Zap } from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

import { useBabyStore } from '@/store/useBabyStore';

export default function OnboardingOfferScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const themeColors = Colors[colorScheme];
  const { setPro } = useBabyStore();

  const handleSubscribe = () => {
    // In a real app, trigger RevenueCat or similar here
    setPro(true);
    router.push('/onboarding/complete');
  };

  const benefits = [
    { 
      icon: <Star size={20} color="#FFB300" />, 
      title: "Social Snapshots", 
      desc: "Beautiful daily health cards to share with family." 
    },
    { 
      icon: <Zap size={20} color="#1565C0" />, 
      title: "Quarterly Reports", 
      desc: "Professional 90-day PDFs for your pediatrician." 
    },
    { 
      icon: <ShieldCheck size={20} color="#2E7D32" />, 
      title: "Data Persistence", 
      desc: "Permanent cloud backup for all milestones." 
    }
  ];

  return (
    <View style={[styles.container, { backgroundColor: '#FDFCFB' }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.delay(200).duration(800)} style={styles.header}>
          <View style={[styles.badge, { backgroundColor: '#1B3C3515' }]}>
            <Zap size={14} color="#1B3C35" />
            <Typography variant="label" weight="800" color="#1B3C35">ONE-TIME LAUNCH SPECIAL</Typography>
          </View>
          <Typography variant="display" style={[styles.title, { color: '#1B3C35' }]}>Clinical Lifetime Launch Special</Typography>
          <Typography variant="bodyLg" color="#607D8B" style={styles.subtitle}>
            Secure lifetime access to Shriyukth's clinical hub for a one-time launch price.
          </Typography>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(400).duration(800)} style={styles.benefitsContainer}>
          {benefits.map((benefit, index) => (
            <View key={index} style={styles.benefitRow}>
              <View style={styles.benefitIcon}>{benefit.icon}</View>
              <View style={styles.benefitText}>
                <Typography variant="body" weight="800" color="#1B3C35">{benefit.title}</Typography>
                <Typography variant="label" color="#90A4AE">{benefit.desc}</Typography>
              </View>
            </View>
          ))}
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(600).duration(800)} style={[styles.pricingCard, { borderColor: '#F1F5F9' }]}>
          <View style={styles.pricingHeader}>
            <Typography variant="label" weight="800" color="#B0BEC5">UNLIMITED LIFETIME ACCESS</Typography>
            <View style={styles.priceRow}>
              <Typography variant="display" style={{ fontSize: 56, color: '#1B3C35' }}>$29.99</Typography>
              <View style={{ marginLeft: 12 }}>
                <Typography variant="body" color="#B0BEC5" style={{ textDecorationLine: 'line-through' }}>$69.99</Typography>
                <Typography variant="label" color="#C69C82" weight="800">LAUNCH PRICE</Typography>
              </View>
            </View>
          </View>

          <TouchableOpacity style={[styles.button, { backgroundColor: '#1B3C35' }]} onPress={handleSubscribe}>
            <Typography variant="bodyLg" weight="800" style={{ color: '#fff' }}>Secure Lifetime Access</Typography>
          </TouchableOpacity>

          <Typography variant="label" color="#B0BEC5" style={{ textAlign: 'center', marginTop: 16, fontWeight: '700' }}>
            NO SUBSCRIPTION REQUIRED • LIFETIME WIN
          </Typography>
        </Animated.View>

        <TouchableOpacity 
          style={styles.skipButton} 
          onPress={() => router.push('/onboarding/complete')}
        >
          <Typography variant="label" weight="800" color="#CFD8DC">CONTINUE WITH LIMITED VERSION</Typography>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 32,
    paddingTop: 80,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    lineHeight: 40,
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  benefitsContainer: {
    marginBottom: 40,
    gap: 20,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: '#F8FAFB',
    padding: 16,
    borderRadius: 20,
  },
  benefitIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitText: {
    flex: 1,
  },
  pricingCard: {
    backgroundColor: '#fff',
    borderRadius: 32,
    padding: 24,
    borderWidth: 2,
    borderColor: '#E8F5E9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 4,
  },
  pricingHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginVertical: 8,
  },
  button: {
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  skipButton: {
    alignItems: 'center',
    marginTop: 32,
    padding: 12,
  }
});
