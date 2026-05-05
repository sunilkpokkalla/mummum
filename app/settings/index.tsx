import React from 'react';
import { 
  StyleSheet, 
  View, 
  TouchableOpacity, 
  ScrollView, 
  SafeAreaView,
  Dimensions,
  Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import Typography from '@/components/Typography';
import { 
  ChevronRight, 
  Baby, 
  CreditCard, 
  Bell, 
  Shield, 
  HelpCircle,
  LogOut,
  Star,
  Clock,
  ArrowLeft,
  Settings as SettingsIcon
} from 'lucide-react-native';
import { useBabyStore } from '@/store/useBabyStore';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { usePremium } from '@/hooks/usePremium';

const { width } = Dimensions.get('window');

export default function SettingsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const themeColors = (Colors as any)[colorScheme];
  const { babies, currentBabyId, resetStore } = useBabyStore();
  const { isPro, trialStatus } = usePremium();

  const currentBaby = babies.find(b => b.id === currentBabyId);

  const getTrialStatus = () => {
    if (isPro) return "Pro Lifetime Active";
    if (trialStatus.expired) return "Trial Expired";
    if (trialStatus.active) return `${trialStatus.remainingDays} Days Left in Trial`;
    return "Trial Not Started";
  };

  const handleReset = () => {
    Alert.alert(
      "Reset All Data",
      "This will permanently delete all logs for your baby. This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Reset", style: "destructive", onPress: () => {
          resetStore();
          router.replace('/onboarding/welcome');
        }}
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: '#FDFCFB' }]}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backBtn} 
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color="#1B3C35" />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Animated.View entering={FadeInDown.duration(600)}>
            <Typography variant="display" weight="800" style={styles.mainTitle}>Settings</Typography>
            <Typography variant="bodyMd" color="#607D8B" style={styles.subtitle}>
              Configure your baby's clinical experience
            </Typography>
          </Animated.View>

          {/* Luxury Subscription Card */}
          <Animated.View entering={FadeInDown.delay(200).duration(800)}>
            <TouchableOpacity 
              activeOpacity={0.9}
              onPress={() => router.push('/premium')}
              style={[styles.luxuryCard, { backgroundColor: isPro ? '#1B3C35' : '#C69C82' }]}
            >
              <View style={styles.cardContent}>
                <View style={styles.iconCircle}>
                  <Star size={24} color={isPro ? '#C69C82' : '#fff'} fill={isPro ? '#C69C82' : '#fff'} />
                </View>
                <View style={{ flex: 1 }}>
                  <Typography variant="bodyLg" weight="800" color="#fff">
                    {isPro ? "Mummum Clinical Pro" : (trialStatus.active ? "Trial Mode Active" : "Unlock Clinical Pro")}
                  </Typography>
                  <View style={styles.statusRow}>
                    <Clock size={12} color="rgba(255,255,255,0.7)" />
                    <Typography variant="label" weight="700" color="rgba(255,255,255,0.7)" style={{ marginLeft: 4 }}>
                      {getTrialStatus()}
                    </Typography>
                  </View>
                </View>
                <ChevronRight size={20} color="rgba(255,255,255,0.5)" />
              </View>
            </TouchableOpacity>
          </Animated.View>

          {/* Account Section */}
          <View style={styles.section}>
            <Typography variant="label" weight="800" color="#B0BEC5" style={styles.sectionLabel}>ACCOUNT MANAGEMENT</Typography>
            <View style={styles.elegantGroup}>
              <ElegantMenuItem 
                icon={<Baby size={20} color="#1B3C35" />}
                title="Baby Profile"
                detail={currentBaby?.name || "Configure Profile"}
                onPress={() => router.push('/settings/profile')}
              />
              <ElegantMenuItem 
                icon={<Bell size={20} color="#1B3C35" />}
                title="Notifications"
                detail="Custom clinical alerts"
                onPress={() => router.push('/settings/notifications')}
              />
              <ElegantMenuItem 
                icon={<CreditCard size={20} color="#1B3C35" />}
                title="Subscription"
                detail={isPro ? "Lifetime Access Active" : "Manage billing"}
                onPress={() => router.push('/premium')}
                isLast
              />
            </View>
          </View>

          {/* Support Section */}
          <View style={styles.section}>
            <Typography variant="label" weight="800" color="#B0BEC5" style={styles.sectionLabel}>SUPPORT & PREFERENCES</Typography>
            <View style={styles.elegantGroup}>
              <ElegantMenuItem 
                icon={<Shield size={20} color="#1B3C35" />}
                title="Privacy & Data"
                onPress={() => router.push('/settings/privacy')}
              />
              <ElegantMenuItem 
                icon={<HelpCircle size={20} color="#1B3C35" />}
                title="Clinical Help Center"
                onPress={() => {}}
              />
              <ElegantMenuItem 
                icon={<LogOut size={20} color="#f44336" />}
                title="Reset All Clinical Data"
                color="#f44336"
                onPress={handleReset}
                hideChevron
                isLast
              />
            </View>
          </View>

          <View style={styles.footer}>
            <Typography variant="label" color="#B0BEC5" weight="800" style={{ letterSpacing: 1 }}>MUMMUM HUB v1.0.0</Typography>
            <Typography variant="label" color="#CFD8DC" style={{ marginTop: 4 }}>High-Fidelity Pediatric Tracking</Typography>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function ElegantMenuItem({ icon, title, detail, onPress, color, hideChevron, isLast }: any) {
  return (
    <TouchableOpacity 
      style={[styles.menuItem, !isLast && styles.menuBorder]}
      onPress={onPress}
      activeOpacity={0.6}
    >
      <View style={styles.menuLeft}>
        <View style={styles.menuIconContainer}>{icon}</View>
        <View>
          <Typography variant="body" weight="700" color={color || "#1B3C35"}>{title}</Typography>
          {detail && <Typography variant="label" color="#90A4AE" weight="600">{detail}</Typography>}
        </View>
      </View>
      {!hideChevron && <ChevronRight size={18} color="#CFD8DC" />}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1B3C35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  content: {
    padding: 24,
    paddingTop: 8,
  },
  mainTitle: {
    fontSize: 40,
    color: '#1B3C35',
  },
  subtitle: {
    marginTop: 4,
    marginBottom: 32,
  },
  luxuryCard: {
    padding: 24,
    borderRadius: 32,
    shadowColor: '#1B3C35',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
    marginBottom: 40,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  section: {
    marginBottom: 32,
  },
  sectionLabel: {
    letterSpacing: 1.5,
    marginBottom: 12,
    marginLeft: 4,
    fontSize: 11,
  },
  elegantGroup: {
    backgroundColor: '#fff',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    overflow: 'hidden',
    shadowColor: '#1B3C35',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.03,
    shadowRadius: 16,
    elevation: 4,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  menuBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFB',
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  menuIconContainer: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#FDFCFB',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  footer: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 40,
  }
});
