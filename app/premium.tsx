import Typography from '@/components/Typography';
import { useBabyStore } from '@/store/useBabyStore';
import { useRouter } from 'expo-router';
import {
  Check,
  ShieldCheck,
  X
} from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  NativeModules,
  Platform,
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
  View
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

export default function PremiumPaywallScreen() {
  const router = useRouter();
  const { setPro, currentBabyId, babies, showGlobalModal, hideGlobalModal } = useBabyStore();
  const [selectedPlan, setSelectedPlan] = useState('yearlymm');
  const [offerings, setOfferings] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchOfferings = async () => {
      if (Platform.OS === 'ios' && !NativeModules.RNPurchases) return;
      try {
        const Purchases = require('react-native-purchases').default;
        const fetchedOfferings = await Purchases.getOfferings();
        const target = fetchedOfferings.all['ofrng40bc691d41'] || fetchedOfferings.current;
        if (target) {
          setOfferings(target);
        } else {
          console.log('[RevenueCat] No offerings found');
        }
      } catch (e) {
        console.log('[RevenueCat] Fetch offerings failed', e);
      }
    };
    fetchOfferings();
  }, []);

  const handlePurchase = async () => {
    if (!NativeModules.RNPurchases || Platform.OS !== 'ios') {
      showGlobalModal({ title: "Simulator", description: "IAP not available here.", confirmText: "OK" });
      return;
    }
    const pkg = offerings?.availablePackages?.find((p: any) => p.product.identifier === selectedPlan || p.identifier === selectedPlan);
    
    if (!pkg) {
      showGlobalModal({ 
        title: "Store Unavailable", 
        description: "We're having trouble connecting to the App Store. Please ensure your internet is connected and try again.", 
        confirmText: "Retry",
        onConfirm: () => {
          hideGlobalModal();
          router.replace('/premium');
        }
      });
      return;
    }
    setLoading(true);
    try {
      const Purchases = require('react-native-purchases').default;
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      if (customerInfo.entitlements.active['pro']) { 
        setPro(true); 
        router.back(); 
      }
    } catch (e: any) {
      const Purchases = require('react-native-purchases').default;
      if (e.code !== Purchases.PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR) {
        console.log("Purchase Error:", e);
        showGlobalModal({
          title: "Purchase Incomplete",
          description: e.message || "Something went wrong while processing your request. Please try again.",
          confirmText: "OK"
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async () => {
    setLoading(true);
    try {
      const Purchases = require('react-native-purchases').default;
      const customerInfo = await Purchases.restorePurchases();
      if (customerInfo.entitlements.active['pro']) {
        setPro(true);
        showGlobalModal({ 
          title: "Success", 
          description: "Your pro access has been restored successfully!", 
          confirmText: "Great" 
        });
        router.back();
      } else {
        showGlobalModal({ 
          title: "Restore", 
          description: "We couldn't find any active pro subscriptions for your Apple ID.", 
          confirmText: "OK" 
        });
      }
    } catch (e) {
      console.log("Restore Error:", e);
    } finally {
      setLoading(false);
    }
  };

  const plans = [
    { id: 'monthlymm', title: 'Monthly', price: '$4.99', sub: 'Clinical Pro', badge: null },
    { id: 'yearlymm', title: 'Yearly Pro', price: '$19.99', sub: 'Most Popular', badge: 'SAVE 60%', best: true },
    { id: 'lifetimemm', title: 'Lifetime', price: '$29.99', sub: 'One-Time Payment', badge: 'BEST VALUE' }
  ].map(p => ({
    ...p,
    price: offerings?.availablePackages?.find((pkg: any) => pkg.product.identifier === p.id)?.product.priceString || p.price
  }));

  const comp = [
    { name: "Doctor PDF Reports", pro: true },
    { name: "Clinical Cloud Sync", pro: true },
    { name: "Medication Safety", pro: true },
  ];

  return (
    <View style={styles.root}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.promoBanner}>
          <Typography weight="800" color="#fff" style={{ fontSize: 9, letterSpacing: 1 }}>60% LAUNCH DISCOUNT ACTIVE</Typography>
        </View>

        <View style={styles.content}>
          <Animated.View entering={FadeInDown} style={styles.hero}>
            <Typography style={styles.title}>Unlock Clinical Pro</Typography>
            <Typography style={styles.subtitle}>Secure every tool for your baby's history.</Typography>
          </Animated.View>

          <View style={styles.compGrid}>
            {comp.map((item, i) => (
              <View key={i} style={styles.compRow}>
                <Typography weight="700" color="#455A64" style={{ flex: 1, fontSize: 11 }}>{item.name}</Typography>
                <View style={{ width: 40, alignItems: 'center' }}><X size={12} color="#CFD8DC" /></View>
                <View style={{ width: 40, alignItems: 'center' }}><Check size={14} color="#1B3C35" strokeWidth={3} /></View>
              </View>
            ))}
          </View>

          <View style={styles.plansStack}>
            {plans.map((plan) => (
              <TouchableOpacity
                key={plan.id}
                style={[styles.planCard, selectedPlan === plan.id && styles.selectedCard, plan.best && styles.bestPlan]}
                onPress={() => setSelectedPlan(plan.id)}
              >
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Typography weight="800" color="#1B3C35" style={{ fontSize: 16 }}>{plan.title}</Typography>
                    {plan.badge && <View style={[styles.miniBadge, plan.best && { backgroundColor: '#C69C82' }]}><Typography weight="800" color="#fff" style={{ fontSize: 8 }}>{plan.badge}</Typography></View>}
                  </View>
                  <Typography variant="label" weight="800" color="#90A4AE" style={{ fontSize: 10 }}>{plan.sub}</Typography>
                </View>
                <Typography variant="body" weight="800" color="#1B3C35" style={{ fontSize: 24 }}>{plan.price}</Typography>
                <View style={[styles.radio, selectedPlan === plan.id && styles.radioActive]}>
                  {selectedPlan === plan.id && <Check size={10} color="#fff" strokeWidth={4} />}
                </View>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.footer}>
            <TouchableOpacity style={[styles.cta, loading && { opacity: 0.7 }]} onPress={handlePurchase} disabled={loading}>
              {loading ? (
                <View style={{ alignItems: 'center' }}>
                  <Typography weight="800" style={{ color: '#fff', fontSize: 18 }}>PROCESSING...</Typography>
                </View>
              ) : (
                <View style={{ alignItems: 'center' }}>
                  <Typography weight="800" style={{ color: '#fff', fontSize: 18 }}>ACTIVATE PRO ACCESS</Typography>
                  <Typography weight="800" color="rgba(255,255,255,0.7)" style={{ fontSize: 9 }}>7-DAY SATISFACTION GUARANTEE</Typography>
                </View>
              )}
            </TouchableOpacity>
            <View style={{ alignItems: 'center', gap: 4 }}>
              <View style={styles.trustRow}><ShieldCheck size={12} color="#C69C82" /><Typography style={{ fontSize: 9, color: '#B0BEC5', fontWeight: '800' }}>SECURE APPLE CHECKOUT • CANCEL ANYTIME</Typography></View>

              <View style={{ alignItems: 'center' }}>
                <Typography weight="700" color="#B0BEC5" style={{ fontSize: 6.5, textAlign: 'center' }} numberOfLines={1}>
                  Subscription automatically renews unless canceled at least 24 hours before renewal.
                </Typography>

                <View style={{ flexDirection: 'row', gap: 12, marginTop: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
                  <TouchableOpacity onPress={handleRestore}>
                    <Typography weight="800" color="#B0BEC5" style={{ fontSize: 7, textDecorationLine: 'underline' }}>Restore Purchases</Typography>
                  </TouchableOpacity>

                  <TouchableOpacity onPress={() => Linking.openURL('https://www.apple.com/legal/internet-services/itunes/dev/stdeula/')}>
                    <Typography weight="800" color="#B0BEC5" style={{ fontSize: 7, textDecorationLine: 'underline' }}>Terms of Use</Typography>
                  </TouchableOpacity>

                  <TouchableOpacity onPress={() => Linking.openURL('https://ambrighttech.com/privacy-policy')}>
                    <Typography weight="800" color="#B0BEC5" style={{ fontSize: 7, textDecorationLine: 'underline' }}>Privacy Policy</Typography>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* ABSOLUTE CLOSE BUTTON - TOP LAYER */}
        <TouchableOpacity
          onPress={() => router.back()}
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
  promoBanner: { backgroundColor: '#C69C82', paddingVertical: 6, alignItems: 'center', marginTop: 0 },
  absoluteClose: {
    position: 'absolute',
    top: 80,
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
  content: { flex: 1, paddingHorizontal: 24, justifyContent: 'center', paddingBottom: 10, paddingTop: 10 },
  hero: { alignItems: 'center', marginBottom: 12, paddingTop: 60 },
  title: { fontSize: 34, fontWeight: '800', color: '#1B3C35', lineHeight: 42, paddingVertical: 4 },
  subtitle: { color: '#607D8B', fontSize: 14, marginTop: 2, textAlign: 'center' },
  compGrid: { backgroundColor: '#fff', borderRadius: 20, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#F1F5F9' },
  compRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F8FAFB' },
  plansStack: { gap: 10, marginBottom: 12 },
  planCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 18, borderRadius: 24, borderWidth: 1, borderColor: '#F1F5F9' },
  selectedCard: { borderColor: '#1B3C35', borderWidth: 2, backgroundColor: '#1B3C3503' },
  bestPlan: { borderColor: '#C69C82', borderWidth: 2 },
  miniBadge: { backgroundColor: '#1B3C35', paddingVertical: 3, paddingHorizontal: 8, borderRadius: 8 },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#ECEFF1', marginLeft: 12, alignItems: 'center', justifyContent: 'center' },
  radioActive: { backgroundColor: '#1B3C35', borderColor: '#1B3C35' },
  footer: { gap: 12 },
  cta: { height: 72, backgroundColor: '#1B3C35', borderRadius: 24, alignItems: 'center', justifyContent: 'center', shadowColor: '#1B3C35', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16 },
  trustRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }
});
