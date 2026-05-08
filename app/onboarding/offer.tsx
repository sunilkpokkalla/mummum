import React from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  NativeModules,
  Platform,
  Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import Typography from '@/components/Typography';
import { X, Star, ShieldCheck, Zap } from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useBabyStore } from '@/store/useBabyStore';

const { height } = Dimensions.get('window');

export default function OnboardingOfferScreen() {
  const router = useRouter();
  const { setPro, completeOnboarding, tempBaby } = useBabyStore();
  const [offerings, setOfferings] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    const fetchOfferings = async () => {
      if (!NativeModules.RNPurchases || Platform.OS !== 'ios') return;
      try {
        const { default: Purchases } = await import('react-native-purchases');
        const allOfferings = await Purchases.getOfferings();
        const target = allOfferings.all['ofrng8f6aab4fec'] || allOfferings.current;
        if (target) setOfferings(target);
      } catch (e) {
        console.log('Offerings fetch failed', e);
      }
    };
    fetchOfferings();
  }, []);

  const handleSubscribe = async () => {
    if (!NativeModules.RNPurchases) {
      Alert.alert(
        "Simulator Mode",
        "In-App Purchases are not available in the iOS Simulator. Please test on a physical device.",
        [{ text: "OK" }]
      );
      return;
    }
    const pkg = offerings?.availablePackages?.find(
      (p: any) => p.product.identifier === 'lifetimemm' || p.identifier === 'prodeb4f0692c5'
    );
    if (!pkg) {
      Alert.alert("Store Error", "Launch special is currently unavailable. Please check back later.");
      return;
    }
    setLoading(true);
    try {
      const { default: Purchases } = await import('react-native-purchases');
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      if (customerInfo.entitlements.active['pro']) {
        setPro(true); completeOnboarding();
        router.push('/onboarding/complete');
      }
    } catch (e: any) {
      if (!e.userCancelled) console.error('Purchase Error', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    completeOnboarding();
    router.push('/onboarding/complete');
  };

  const benefits = [
    { icon: <Star size={18} color="#FFB300" />,       title: 'Social Snapshots',  desc: 'Daily health cards to share with family.' },
    { icon: <Zap size={18} color="#1565C0" />,        title: 'Clinical Reports',  desc: '90-day PDFs for your pediatrician.' },
    { icon: <ShieldCheck size={18} color="#2E7D32" />, title: 'Data Persistence', desc: 'Permanent cloud backup for all milestones.' },
  ];

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe}>

        {/* ── Close ── */}
        <View style={styles.closeRow}>
          <TouchableOpacity onPress={handleSkip} style={styles.closeBtn}>
            <X size={26} color="#CFD8DC" />
          </TouchableOpacity>
        </View>

        {/* ── Body — space-between so sections fill height evenly ── */}
        <View style={styles.body}>

          {/* HERO */}
          <Animated.View entering={FadeInDown.delay(150).duration(700)} style={styles.hero}>
            <View style={styles.badge}>
              <Zap size={13} color="#1B3C35" />
              <Typography variant="label" weight="800" color="#1B3C35" style={styles.badgeText}>
                LIFETIME LAUNCH SPECIAL
              </Typography>
            </View>
            <Typography style={styles.title}>Unlock Clinical Pro</Typography>
            <Typography style={styles.subtitle}>
              Secure {tempBaby.name || 'your baby'}'s clinical hub forever{'\n'}with a one-time launch special.
            </Typography>
          </Animated.View>

          {/* BENEFITS */}
          <Animated.View entering={FadeInDown.delay(300).duration(700)} style={styles.benefits}>
            {benefits.map((b, i) => (
              <View key={i} style={styles.benefitRow}>
                <View style={styles.iconBox}>{b.icon}</View>
                <View style={styles.benefitText}>
                  <Typography weight="800" color="#1B3C35" style={styles.benefitTitle}>{b.title}</Typography>
                  <Typography style={styles.benefitDesc}>{b.desc}</Typography>
                </View>
              </View>
            ))}
          </Animated.View>

          {/* PRICING CARD */}
          <Animated.View entering={FadeInUp.delay(450).duration(700)} style={styles.card}>
            {/* Label */}
            <Typography weight="800" color="#B0BEC5" style={styles.cardLabel}>
              UNLIMITED LIFETIME ACCESS
            </Typography>

            {/* Price row */}
            <View style={styles.priceRow}>
              <Typography style={styles.price}>{offerings?.availablePackages?.find((p:any) => p.product.identifier === 'lifetimemm')?.product.priceString || '$29.99'}</Typography>
              <View style={styles.strikeBadge}>
                <Typography style={styles.strikethrough}>$69.99</Typography>
                <Typography weight="800" style={styles.saveText}>SAVE 60%</Typography>
              </View>
            </View>

            {/* CTA */}
            <TouchableOpacity
              style={[styles.ctaBtn, loading && { opacity: 0.65 }]}
              onPress={handleSubscribe}
              disabled={loading}
            >
              <Typography weight="800" style={styles.ctaText}>
                {loading ? 'Processing…' : 'Secure Lifetime Access'}
              </Typography>
            </TouchableOpacity>

            <Typography style={styles.legalText}>
              NO SUBSCRIPTION REQUIRED • PRO FEATURES LOCKED
            </Typography>
          </Animated.View>

          {/* SKIP */}
          <TouchableOpacity onPress={handleSkip} style={styles.skipBtn}>
            <Typography weight="800" style={styles.skipText}>CONTINUE WITH BASIC ACCESS</Typography>
          </TouchableOpacity>

        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FDFCFB' },
  safe: { flex: 1 },

  // Close button row
  closeRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 6,
  },
  closeBtn: {
    width: 44, height: 44,
    alignItems: 'center', justifyContent: 'center',
  },

  // Main content — fills remaining height and spaces items evenly
  body: {
    flex: 1,
    paddingHorizontal: 28,
    paddingBottom: 12,
    justifyContent: 'space-between',
  },

  // ── Hero ──
  hero: { alignItems: 'center' },
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#1B3C3515',
    paddingVertical: 6, paddingHorizontal: 14,
    borderRadius: 20, marginBottom: 14, alignSelf: 'center',
  },
  badgeText: { fontSize: 11, letterSpacing: 0.5 },
  title: {
    fontSize: 30, fontWeight: '900', color: '#1B3C35',
    textAlign: 'center', lineHeight: 36, marginBottom: 10,
  },
  subtitle: {
    fontSize: 14, color: '#607D8B', textAlign: 'center', lineHeight: 21,
  },

  // ── Benefits ──
  benefits: { gap: 10 },
  benefitRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: '#F8FAFB', borderRadius: 20,
    paddingVertical: 13, paddingHorizontal: 16,
  },
  iconBox: {
    width: 40, height: 40, borderRadius: 13,
    backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#F1F5F9',
  },
  benefitText: { flex: 1 },
  benefitTitle: { fontSize: 14, marginBottom: 2 },
  benefitDesc: { fontSize: 11, color: '#90A4AE' },

  // ── Pricing Card ──
  card: {
    backgroundColor: '#fff', borderRadius: 28,
    paddingHorizontal: 22, paddingVertical: 20,
    borderWidth: 1, borderColor: '#F1F5F9',
    shadowColor: '#1B3C35',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06, shadowRadius: 22, elevation: 8,
    alignItems: 'center',
  },
  cardLabel: { fontSize: 10, letterSpacing: 1, marginBottom: 8 },
  priceRow: {
    flexDirection: 'row', alignItems: 'baseline',
    justifyContent: 'center', gap: 14, marginBottom: 16,
  },
  price: {
    fontSize: 48, fontWeight: '900', color: '#1B3C35', lineHeight: 54,
  },
  strikeBadge: { alignItems: 'flex-start', justifyContent: 'center', gap: 2 },
  strikethrough: {
    fontSize: 15, color: '#B0BEC5', textDecorationLine: 'line-through',
  },
  saveText: { fontSize: 12, color: '#C69C82' },

  ctaBtn: {
    width: '100%', height: 58, borderRadius: 18,
    backgroundColor: '#1B3C35',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#1B3C35', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18, shadowRadius: 16, elevation: 6,
  },
  ctaText: { fontSize: 16, color: '#fff' },
  legalText: {
    fontSize: 10, color: '#B0BEC5', textAlign: 'center',
    marginTop: 12, letterSpacing: 0.3, fontWeight: '700',
  },

  // ── Skip ──
  skipBtn: { alignItems: 'center', paddingVertical: 6 },
  skipText: { fontSize: 11, color: '#CFD8DC', letterSpacing: 0.5 },
});
