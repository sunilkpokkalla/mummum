import React, { useState, useEffect } from 'react';
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
  Linking,
  ActivityIndicator
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
  const [selectedPlan, setSelectedPlan] = useState('mmlifetime');
  const [offerings, setOfferings] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loading, setLoading] = React.useState(false);

  const fetchOfferings = async () => {
    setIsRefreshing(true);
    setError(null);
    try {
      const { default: Purchases } = await import('react-native-purchases');
      const fetchedOfferings = await Purchases.getOfferings();
      if (fetchedOfferings.current !== null) {
        setOfferings(fetchedOfferings.current);
      } else {
        setError("No active offerings found in RevenueCat.");
      }
    } catch (e: any) {
      console.log('Error fetching offerings:', e);
      setError(e.message || "Could not connect to App Store.");
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
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
      
      // Check for 'pro' OR any active entitlement to be safe
      const hasPro = !!customerInfo.entitlements.active['pro'] || Object.keys(customerInfo.entitlements.active).length > 0;
      
      if (hasPro) { 
        setPro(true); 
        Alert.alert("Welcome to Pro", "Your Mummum Clinical Pro access is now active!");
        router.back(); 
      }
    } catch (e: any) {
      if (!e.userCancelled) {
        Alert.alert("Purchase Error", e.message || "An error occurred during purchase.");
        console.error('Purchase Error', e);
      }
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
      const hasPro = !!customerInfo.entitlements.active['pro'] || Object.keys(customerInfo.entitlements.active).length > 0;
      
      if (hasPro) { 
        setPro(true); 
        Alert.alert("Restored", "Your previous purchases have been successfully restored.");
        router.back(); 
      } else {
        Alert.alert("No Purchase Found", "We couldn't find any active Pro subscriptions for this Apple ID.");
      }
    } catch (e: any) {
      Alert.alert("Restore Error", e.message || "An error occurred while restoring purchases.");
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
            {error ? (
              <View style={styles.loadingStore}>
                <Typography variant="label" color="#f44336" style={{ marginBottom: 12, textAlign: 'center', paddingHorizontal: 20 }}>
                  {error}
                </Typography>
                <TouchableOpacity 
                  style={[styles.planCard, { borderColor: '#C69C82', backgroundColor: '#FFF9F6' }]}
                  onPress={fetchOfferings}
                >
                  <Typography variant="body" weight="800" color="#C69C82">Retry Connection</Typography>
                </TouchableOpacity>
              </View>
            ) : !offerings ? (
              <View style={styles.loadingStore}>
                <ActivityIndicator size="large" color="#C69C82" />
                <Typography variant="label" color="#90A4AE" style={{ marginTop: 12 }}>Connecting to App Store...</Typography>
                {isRefreshing && <Typography variant="label" color="#CFD8DC" style={{ fontSize: 9, marginTop: 4 }}>Checking clinical offers...</Typography>}
              </View>
            ) : (
              plans.map((plan) => (
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
              ))
            )}
          </View>

          <Animated.View entering={FadeInUp.delay(1000).duration(800)} style={styles.footer}>
            <TouchableOpacity 
              style={[styles.purchaseBtn, loading && { opacity: 0.7 }]} 
              onPress={handlePurchase}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Typography variant="bodyLg" weight="800" style={{ color: '#fff' }}>
                  {selectedPlan === 'mmlifetime' ? 'Unlock Lifetime Access' : 'Start 7-Day Trial'}
                </Typography>
              )}
            </TouchableOpacity>

            <View style={styles.legalInfoBlock}>
              <Typography variant="label" color="#B0BEC5" style={styles.disclosureText}>
                Payment will be charged to your iTunes Account at confirmation of purchase. Subscription automatically renews unless auto-renew is turned off at least 24-hours before the end of the current period. Account will be charged for renewal within 24-hours prior to the end of the current period.
              </Typography>
              <View style={styles.legalLinks}>
                <TouchableOpacity onPress={() => Linking.openURL('https://www.apple.com/legal/internet-services/itunes/dev/stdeula/')}>
                  <Typography variant="label" weight="700" color="#90A4AE" style={{ fontSize: 9 }}>Terms</Typography>
                </TouchableOpacity>
                <View style={styles.dot} />
                <TouchableOpacity onPress={() => Linking.openURL('https://mummum.app/privacy')}>
                  <Typography variant="label" weight="700" color="#90A4AE" style={{ fontSize: 9 }}>Privacy</Typography>
                </TouchableOpacity>
                <View style={styles.dot} />
                <TouchableOpacity onPress={handleRestore}>
                  <Typography variant="label" weight="700" color="#90A4AE" style={{ fontSize: 9 }}>Restore</Typography>
                </TouchableOpacity>
              </View>
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
  loadingStore: {
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 10,
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
  legalInfoBlock: {
    marginTop: 14,
    gap: 8,
  },
  disclosureText: {
    fontSize: 8,
    textAlign: 'center',
    lineHeight: 12,
    color: '#B0BEC5',
    paddingHorizontal: 10,
  },
  legalLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 4,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#CFD8DC',
  }
});
