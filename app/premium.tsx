import React from 'react';
import { 
  StyleSheet, 
  View, 
  TouchableOpacity, 
  ScrollView,
  Platform,
  Dimensions,
  SafeAreaView,
  Alert,
  NativeModules,
  Linking
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import Typography from '@/components/Typography';
import { 
  Check, 
  Star, 
  ShieldCheck, 
  Zap, 
  FileText, 
  Pill, 
  Cloud, 
  X 
} from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp, ZoomIn } from 'react-native-reanimated';
import { useBabyStore } from '@/store/useBabyStore';

const { width } = Dimensions.get('window');



export default function PremiumPaywallScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const themeColors = Colors[colorScheme];
  const { setPro, currentBabyId, babies, tempBaby } = useBabyStore();
  const currentBaby = babies.find(b => b.id === currentBabyId);
  const [selectedPlan, setSelectedPlan] = React.useState('mmlifetime');
  const [offerings, setOfferings] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    const fetchOfferings = async () => {
      if (!NativeModules.RNPurchases || Platform.OS !== 'ios') return;
      try {
        const { default: Purchases } = await import('react-native-purchases');
        const currentOfferings = await Purchases.getOfferings();
        if (currentOfferings.current) setOfferings(currentOfferings.current);
      } catch (e) {
        console.log('Offerings fetch failed', e);
      }
    };
    fetchOfferings();
  }, []);

  const handlePurchase = async () => {
    if (!NativeModules.RNPurchases || Platform.OS !== 'ios') {
      Alert.alert(
        "Simulator Mode", 
        "In-App Purchases are not available in the iOS Simulator. To test the payment flow, please use a physical device with a Sandbox Apple ID.",
        [{ text: "OK" }]
      );
      return;
    }
    const pkg = offerings?.availablePackages?.find((p: any) => p.product.identifier === selectedPlan);
    if (!pkg) { 
      Alert.alert("Store Error", "Could not fetch product details from the App Store. Please check your internet connection.");
      return; 
    }
    setLoading(true);
    try {
      const { default: Purchases } = await import('react-native-purchases');
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      if (customerInfo.entitlements.active['pro']) { setPro(true); router.back(); }
    } catch (e: any) {
      if (!e.userCancelled) console.error('Purchase Error', e);
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async () => {
    if (!NativeModules.RNPurchases || Platform.OS !== 'ios') {
      Alert.alert("Simulator Mode", "Restore functionality requires a physical device and a real Apple ID.");
      return;
    }
    setLoading(true);
    try {
      const { default: Purchases } = await import('react-native-purchases');
      const customerInfo = await Purchases.restorePurchases();
      if (customerInfo.entitlements.active['pro']) { setPro(true); router.back(); }
    } catch (e) {
      console.error('Restore Error', e);
    } finally {
      setLoading(false);
    }
  };

  const getPrice = (id: string, defaultPrice: string) => {
    const pkg = offerings?.availablePackages?.find((p: any) => p.product.identifier === id);
    return pkg?.product?.priceString || defaultPrice;
  };

  const plans = [
    { id: 'monthly', title: 'Monthly', price: getPrice('monthly', '$4.99'), desc: 'Full Access', sub: 'GoPro' },
    { id: 'yearly', title: 'Yearly', price: getPrice('yearly', '$19.99'), desc: 'Best Experience', sub: 'GoPro • 60% OFF' },
    { id: 'mmlifetime', title: 'Lifetime', price: getPrice('mmlifetime', '$29.99'), oldPrice: '$69.99', desc: 'One-time Payment', sub: 'Clinical Pro • Best Value' }
  ];

  const features = [
    { 
      icon: <FileText size={20} color="#1B3C35" />, 
      title: "Clinical PDF", 
    },
    { 
      icon: <Pill size={20} color="#9C27B0" />, 
      title: "Meds Hub", 
    },
    { 
      icon: <Star size={20} color="#FFB300" />, 
      title: "Snapshots", 
    },
    { 
      icon: <Cloud size={20} color="#1565C0" />, 
      title: "Cloud Sync", 
    }
  ];

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
            <X size={24} color={themeColors.icon} />
          </TouchableOpacity>
        </View>

        <View style={styles.mainContent}>
          <Animated.View entering={FadeInDown.delay(200).duration(800)} style={styles.hero}>
            <Animated.View entering={ZoomIn.delay(400).duration(800)} style={styles.iconCircle}>
              <Star size={40} color="#fff" fill="#fff" />
            </Animated.View>
            <Typography variant="display" style={styles.title}>Unlock Clinical Pro</Typography>
            <Typography variant="body" color={themeColors.icon} style={styles.subtitle}>
              Professional clinical tools for {currentBaby?.name || tempBaby.name || 'your baby'}'s care.
            </Typography>
          </Animated.View>

          <View style={styles.featuresGrid}>
            {features.map((feature, index) => (
              <View key={index} style={styles.featureGridItem}>
                <View style={styles.featureIconContainer}>{feature.icon}</View>
                <Typography variant="label" weight="800" color={themeColors.text} style={{ textAlign: 'center', marginTop: 4, fontSize: 10 }}>{feature.title}</Typography>
              </View>
            ))}
          </View>

          <View style={styles.plansContainer}>
            {plans.map((plan) => (
              <TouchableOpacity 
                key={plan.id}
                style={[
                  styles.planCard, 
                  selectedPlan === plan.id && { borderColor: '#1B3C35', backgroundColor: '#F1F8E9' }
                ]}
                onPress={() => setSelectedPlan(plan.id)}
              >
                <View style={styles.planInfo}>
                  <Typography variant="body" weight="800">{plan.title}</Typography>
                  <Typography variant="label" color="#607D8B">{plan.sub}</Typography>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    {plan.oldPrice && (
                      <Typography variant="label" color="#B0BEC5" style={{ textDecorationLine: 'line-through', marginRight: 4 }}>
                        {plan.oldPrice}
                      </Typography>
                    )}
                    <Typography variant="bodyLg" weight="800" color="#1B3C35">{plan.price}</Typography>
                  </View>
                  <Typography variant="label" color="#90A4AE" style={{ fontSize: 9 }}>{plan.desc}</Typography>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          <Animated.View entering={FadeInUp.delay(1000).duration(800)} style={styles.footer}>
            <TouchableOpacity style={styles.purchaseBtn} onPress={handlePurchase}>
              <Typography variant="bodyLg" weight="800" style={{ color: '#fff' }}>
                {selectedPlan === 'lifetime' ? 'Unlock Lifetime' : 'Start 7-Day Trial'}
              </Typography>
            </TouchableOpacity>

            <View style={styles.legalLinks}>
              <TouchableOpacity onPress={() => Linking.openURL('https://mummum-app.com/terms')}><Typography variant="label" color={themeColors.icon} style={{ fontSize: 10 }}>Terms</Typography></TouchableOpacity>
              <View style={styles.dot} />
              <TouchableOpacity onPress={() => Linking.openURL('https://mummum-app.com/privacy')}><Typography variant="label" color={themeColors.icon} style={{ fontSize: 10 }}>Privacy</Typography></TouchableOpacity>
              <View style={styles.dot} />
              <TouchableOpacity onPress={handleRestore}><Typography variant="label" color={themeColors.icon} style={{ fontSize: 10 }}>Restore</Typography></TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  closeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F8FAFB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 32,
    paddingBottom: 60,
  },
  mainContent: {
    flex: 1,
    paddingHorizontal: 32,
    paddingBottom: 40,
    justifyContent: 'space-between',
  },
  hero: {
    alignItems: 'center',
    marginTop: 10,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1B3C35',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#1B3C35',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  featureGridItem: {
    width: (Dimensions.get('window').width - 64 - 12) / 2,
    alignItems: 'center',
    backgroundColor: '#F8FAFB',
    padding: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  plansContainer: {
    gap: 10,
    marginVertical: 4,
  },
  planCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#F1F5F9',
  },
  planInfo: {
    gap: 2,
  },
  featureIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  footer: {
    gap: 16,
  },
  pricingSummary: {
    alignItems: 'center',
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 4,
  },
  purchaseBtn: {
    height: 64,
    backgroundColor: '#1B3C35',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1B3C35',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 6,
  },
  legalLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 8,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#CFD8DC',
  }
});
