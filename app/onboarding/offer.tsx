import ElegantModal from '@/components/ElegantModal';
import Typography from '@/components/Typography';
import { useBabyStore } from '@/store/useBabyStore';
import { useRouter } from 'expo-router';
import { Check, Heart, X } from 'lucide-react-native';
import React from 'react';
import {
  ActivityIndicator,
  NativeModules,
  Platform,
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

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
        const Purchases = require('react-native-purchases').default;
        const allOfferings = await Purchases.getOfferings();
        // Try the hardcoded offering first, then the current one, then just find any that has a lifetime package
        let target = allOfferings.all['ofrng40bc691d41'] || allOfferings.current;

        if (!target) {
          // Fallback: search all offerings for any package that looks like our lifetime product
          for (const key in allOfferings.all) {
            const found = allOfferings.all[key].availablePackages.find((p: any) =>
              p.packageType === 'Lifetime' || p.identifier === 'lifetimemm'
            );
            if (found) {
              target = allOfferings.all[key];
              break;
            }
          }
        }

        if (target) setOfferings(target);
      } catch (e) {
        console.log('[OnboardingOffer] Fetch failed:', e);
      }
    };
    fetchOfferings();
  }, []);

  const handleSubscribe = async () => {
    if (!NativeModules.RNPurchases) {
      setShowSimModal(true); return;
    }
    const pkg = offerings?.availablePackages?.find((p: any) =>
      p.packageType === 'Lifetime' ||
      p.identifier === 'lifetimemm' ||
      p.product.identifier === 'lifetimemm' ||
      p.product.identifier === 'prodeb4f0692c5'
    );
    if (!pkg) {
      useBabyStore.getState().showGlobalModal({
        title: "Store Issue",
        description: "We couldn't retrieve the special offer details. Please ensure your connection is stable and try again.",
        confirmText: "OK"
      });
      return;
    }
    setLoading(true);
    try {
      const Purchases = require('react-native-purchases').default;
      const user = require('@react-native-firebase/auth').default().currentUser;
      if (user) {
        await Purchases.logIn(user.uid);
      }
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      const activeEntitlements = Object.keys(customerInfo.entitlements.active);
      if (customerInfo.entitlements.active['pro'] || activeEntitlements.length > 0) {
        setPro(true);
        completeOnboarding();
        router.replace('/onboarding/complete');
      }
    } catch (e: any) {
      const Purchases = require('react-native-purchases').default;
      if (e.code !== Purchases.PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR) {
        console.log('Onboarding Purchase Error:', e);
        useBabyStore.getState().showGlobalModal({
          title: "Setup Incomplete",
          description: e.message || "We couldn't activate your Lifetime access. Please try again or skip for now.",
          confirmText: "OK"
        });
      }
    } finally {
      setLoading(false);
    }
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
          <Typography weight="800" color="#fff" style={{ fontSize: 9, letterSpacing: 1 }}>LIMITED: MOTHER'S LAUNCH SPECIAL ENDING SOON</Typography>
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
            <Typography weight="800" color="#C69C82" style={{ fontSize: 10, letterSpacing: 2, marginBottom: 16 }}>EXCLUSIVE LIFETIME SPECIAL</Typography>

            <View style={styles.priceRow}>
              <View>
                <Typography style={styles.price}>
                  {offerings?.availablePackages?.find((p: any) =>
                    p.packageType === 'Lifetime' ||
                    p.identifier === 'lifetimemm' ||
                    p.product.identifier === 'lifetimemm' ||
                    p.product.identifier === 'prodeb4f0692c5'
                  )?.product.priceString || '$29.99'}
                </Typography>
                <Typography weight="800" color="#90A4AE" style={{ fontSize: 9 }}>LIFETIME ACCESS</Typography>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 4 }}>
                <Typography style={styles.oldPrice}>$69.99</Typography>
                <View style={styles.saveBadge}><Typography weight="800" color="#fff" style={{ fontSize: 8 }}>SAVE 60%</Typography></View>
              </View>
            </View>

            <TouchableOpacity style={[styles.cta, loading && { opacity: 0.7 }]} onPress={handleSubscribe} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Typography weight="800" style={{ fontSize: 18, color: '#fff' }}>SECURE LIFETIME ACCESS</Typography>}
            </TouchableOpacity>

            <View style={styles.trust}><Heart size={10} color="#C69C82" fill="#C69C82" /><Typography style={{ fontSize: 9, color: '#B0BEC5', fontWeight: '800' }}>TRUSTED BY 10K+ MOTHERS • ONE-TIME PAYMENT</Typography></View>
            
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
              <TouchableOpacity onPress={() => require('react-native').Linking.openURL('https://www.apple.com/legal/internet-services/itunes/dev/stdeula/')}>
                <Typography weight="800" color="#B0BEC5" style={{ fontSize: 8, textDecorationLine: 'underline' }}>Terms of Use</Typography>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => require('react-native').Linking.openURL('http://www.ambrighttech.com/product/privacy-policy/')}>
                <Typography weight="800" color="#B0BEC5" style={{ fontSize: 8, textDecorationLine: 'underline' }}>Privacy Policy</Typography>
              </TouchableOpacity>
            </View>
          </Animated.View>

          <TouchableOpacity onPress={handleSkip} hitSlop={15} style={styles.skip}><Typography weight="800" style={{ fontSize: 11, color: '#CFD8DC' }}>SKIP SPECIAL OFFER</Typography></TouchableOpacity>
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
  title: { fontSize: 34, fontWeight: '800', color: '#1B3C35', textAlign: 'center', lineHeight: 42, paddingVertical: 4 },
  subtitle: { fontSize: 15, color: '#607D8B', textAlign: 'center', marginTop: 2 },
  compGrid: { backgroundColor: '#fff', borderRadius: 20, padding: 18, marginBottom: 20, borderWidth: 1, borderColor: '#F1F5F9' },
  compRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F8FAFB' },
  compStatus: { width: 32, alignItems: 'center' },
  priceCard: { backgroundColor: '#fff', borderRadius: 32, padding: 24, alignItems: 'center', shadowColor: '#1B3C35', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 8, borderWidth: 1, borderColor: '#F1F5F9' },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 24, paddingHorizontal: 10 },
  price: { fontSize: 52, fontWeight: '800', color: '#1B3C35', lineHeight: 52 },
  oldPrice: { fontSize: 18, color: '#B0BEC5', textDecorationLine: 'line-through' },
  saveBadge: { backgroundColor: '#C69C82', paddingVertical: 3, paddingHorizontal: 8, borderRadius: 8 },
  cta: { width: '100%', height: 72, backgroundColor: '#1B3C35', borderRadius: 24, alignItems: 'center', justifyContent: 'center', shadowColor: '#1B3C35', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.3, shadowRadius: 16 },
  trust: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 16 },
  skip: { alignItems: 'center', marginTop: 24, paddingBottom: 10 }
});
