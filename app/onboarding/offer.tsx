import React from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  SafeAreaView,
  NativeModules,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import Typography from '@/components/Typography';
import { X, Star, ShieldCheck, Check, Heart } from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useBabyStore } from '@/store/useBabyStore';
import ElegantModal from '@/components/ElegantModal';

export default function OnboardingOfferScreen() {
  const router = useRouter();
  const { setPro, completeOnboarding, tempBaby } = useBabyStore();
  const [offerings, setOfferings] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const [showSimModal, setShowSimModal] = React.useState(false);

  React.useEffect(() => {
    const fetchOfferings = async () => {
      if (!NativeModules.RNPurchases || Platform.OS !== 'ios') return;
      try {
        const { default: Purchases } = await import('react-native-purchases');
        const allOfferings = await Purchases.getOfferings();
        const target = allOfferings.all['ofrng40bc691d41'] || allOfferings.current;
        if (target) setOfferings(target);
      } catch (e) {}
    };
    fetchOfferings();
  }, []);

  const handleSubscribe = async () => {
    if (!NativeModules.RNPurchases) {
      setShowSimModal(true); return;
    }
    const pkg = offerings?.availablePackages?.find(p => p.packageType === 'Lifetime' || p.identifier === 'lifetimemm');
    if (!pkg) return;
    setLoading(true);
    try {
      const { default: Purchases } = await import('react-native-purchases');
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      if (customerInfo.entitlements.active['pro']) {
        setPro(true); completeOnboarding(); router.replace('/onboarding/complete');
      }
    } catch (e) {} finally { setLoading(false); }
  };

  const handleSkip = () => {
    completeOnboarding();
    router.replace('/onboarding/complete');
  };

  const comp = [
    { name: "Doctor-Ready PDF Reports", pro: true },
    { name: "Lifetime Cloud Sync", pro: true },
    { name: "Pediatric Medication Hub", pro: true },
  ];

  return (
    <View style={styles.root}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.promoBanner}>
          <Typography weight="900" color="#fff" style={{ fontSize: 9, letterSpacing: 1 }}>LIMITED: MOTHER'S LAUNCH SPECIAL ENDING SOON</Typography>
        </View>

        <View style={styles.content}>
          <Animated.View entering={FadeInDown} style={styles.hero}>
            <Typography style={styles.title}>Peace of Mind, Forever.</Typography>
            <Typography style={styles.subtitle}>Secure {tempBaby.name || 'your baby'}'s clinical history for life.</Typography>
          </Animated.View>

          <View style={styles.compGrid}>
            {comp.map((item, i) => (
              <View key={i} style={styles.compRow}>
                <Typography weight="700" color="#455A64" style={{ flex: 1, fontSize: 11 }}>{item.name}</Typography>
                <View style={styles.compStatus}><Check size={14} color="#1B3C35" strokeWidth={3} /></View>
              </View>
            ))}
          </View>

          <Animated.View entering={FadeInUp} style={styles.priceCard}>
             <Typography weight="900" color="#C69C82" style={{ fontSize: 10, letterSpacing: 2, marginBottom: 16 }}>EXCLUSIVE LIFETIME SPECIAL</Typography>
             
             <View style={styles.priceRow}>
                <View>
                  <Typography style={styles.price}>{offerings?.availablePackages?.find(p => p.packageType === 'Lifetime' || p.identifier === 'lifetimemm')?.product.priceString || '$29.99'}</Typography>
                  <Typography weight="900" color="#90A4AE" style={{ fontSize: 9 }}>LIFETIME ACCESS</Typography>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 4 }}>
                  <Typography style={styles.oldPrice}>$69.99</Typography>
                  <View style={styles.saveBadge}><Typography weight="900" color="#fff" style={{ fontSize: 8 }}>SAVE 60%</Typography></View>
                </View>
             </View>

             <TouchableOpacity style={[styles.cta, loading && { opacity: 0.7 }]} onPress={handleSubscribe} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Typography weight="900" style={{ fontSize: 18, color: '#fff' }}>SECURE LIFETIME ACCESS</Typography>}
             </TouchableOpacity>

             <View style={styles.trust}><Heart size={10} color="#C69C82" fill="#C69C82" /><Typography style={{ fontSize: 9, color: '#B0BEC5', fontWeight: '900' }}>TRUSTED BY 10K+ MOTHERS • ONE-TIME PAYMENT</Typography></View>
          </Animated.View>

          <TouchableOpacity onPress={handleSkip} hitSlop={15} style={styles.skip}><Typography weight="900" style={{ fontSize: 11, color: '#CFD8DC' }}>SKIP SPECIAL OFFER</Typography></TouchableOpacity>
        </View>

        <ElegantModal visible={showSimModal} onClose={() => setShowSimModal(false)} onConfirm={() => setShowSimModal(false)} title="Simulator" description="IAP not available here." confirmText="OK" />

        {/* ABSOLUTE CLOSE BUTTON - TOP LAYER */}
        <TouchableOpacity 
          onPress={handleSkip} 
          style={styles.absoluteClose}
          hitSlop={{ top: 30, bottom: 30, left: 30, right: 30 }}
        >
          <X size={20} color="#1B3C35" strokeWidth={3} />
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FDFCFB' },
  promoBanner: { backgroundColor: '#1B3C35', paddingVertical: 6, alignItems: 'center', marginTop: 0 },
  absoluteClose: { 
    position: 'absolute', 
    top: 100, 
    right: 20, 
    zIndex: 999,
    padding: 8,
    backgroundColor: '#fff',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  content: { flex: 1, paddingHorizontal: 28, justifyContent: 'center', paddingBottom: 10, paddingTop: 10 },
  hero: { alignItems: 'center', marginBottom: 18, paddingTop: 120 },
  title: { fontSize: 34, fontWeight: '900', color: '#1B3C35', textAlign: 'center', lineHeight: 42, paddingVertical: 4 },
  subtitle: { fontSize: 15, color: '#607D8B', textAlign: 'center', marginTop: 2 },
  compGrid: { backgroundColor: '#fff', borderRadius: 20, padding: 18, marginBottom: 20, borderWidth: 1, borderColor: '#F1F5F9' },
  compRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F8FAFB' },
  compStatus: { width: 32, alignItems: 'center' },
  priceCard: { backgroundColor: '#fff', borderRadius: 32, padding: 24, alignItems: 'center', shadowColor: '#1B3C35', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 8, borderWidth: 1, borderColor: '#F1F5F9' },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 24, paddingHorizontal: 10 },
  price: { fontSize: 52, fontWeight: '900', color: '#1B3C35', lineHeight: 52 },
  oldPrice: { fontSize: 18, color: '#B0BEC5', textDecorationLine: 'line-through' },
  saveBadge: { backgroundColor: '#C69C82', paddingVertical: 3, paddingHorizontal: 8, borderRadius: 8 },
  cta: { width: '100%', height: 72, backgroundColor: '#1B3C35', borderRadius: 24, alignItems: 'center', justifyContent: 'center', shadowColor: '#1B3C35', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.3, shadowRadius: 16 },
  trust: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 16 },
  skip: { alignItems: 'center', marginTop: 24, paddingBottom: 10 }
});
