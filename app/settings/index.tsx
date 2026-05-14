import React from 'react';
import { 
  StyleSheet, 
  View, 
  TouchableOpacity, 
  ScrollView, 
  SafeAreaView,
  Dimensions,
  Linking
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
  LogOut,
  Star,
  ArrowLeft,
  ShieldCheck,
  Activity
} from 'lucide-react-native';
import { useBabyStore } from '@/store/useBabyStore';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { usePremium } from '@/hooks/usePremium';
import auth from '@react-native-firebase/auth';
import { NativeModules } from 'react-native';

const { width } = Dimensions.get('window');

// Safe Native Module Discovery
let GoogleSignin: any = null;
try {
  if (NativeModules.RNGoogleSignin || NativeModules.RNGoogleSigninModule) {
    GoogleSignin = require('@react-native-google-signin/google-signin').GoogleSignin;
  }
} catch (e) {
  console.log('[Settings]: GoogleSignin module not available');
}

export default function SettingsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const themeColors = (Colors as any)[colorScheme];
  const { babies, currentBabyId, resetStore, showGlobalModal, hideGlobalModal, syncToCloud } = useBabyStore();
  const { isPro } = usePremium();

  const user = auth().currentUser;
  const currentBaby = babies.find(b => b.id === currentBabyId);

  const handleReset = () => {
    showGlobalModal({
      title: "Reset All Data?",
      description: "This will permanently delete all clinical logs and your cloud history. This action cannot be undone.",
      confirmText: "Reset Everything",
      isDestructive: true,
      onConfirm: async () => {
        try {
          const user = auth().currentUser;
          if (user) {
            // @ts-ignore
            const firestore = require('@react-native-firebase/firestore').default;
            await firestore().collection('users').doc(user.uid).delete();
            await auth().signOut();
          }
          resetStore();
          hideGlobalModal();
          router.replace('/onboarding');
        } catch (e) {
          console.error('Reset failed:', e);
          hideGlobalModal();
        }
      },
      cancelText: "Cancel"
    });
  };

  const handleDeleteAccount = () => {
    showGlobalModal({
      title: "Delete Account Permanently?",
      description: "This will permanently delete your Mummum account and all clinical cloud history. This action is irreversible and cannot be undone.",
      confirmText: "Delete Account",
      isDestructive: true,
      onConfirm: async () => {
        try {
          const user = auth().currentUser;
          if (user) {
            // @ts-ignore
            const firestore = require('@react-native-firebase/firestore').default;
            const uid = user.uid;
            
            // 1. Delete Firestore Data
            await firestore().collection('users').doc(uid).delete();
            
            // 2. Delete Auth Account (Requires recent login)
            try {
              await user.delete();
            } catch (authErr: any) {
              if (authErr.code === 'auth/requires-recent-login') {
                hideGlobalModal();
                setTimeout(() => {
                  showGlobalModal({
                    title: "Security Verification",
                    description: "For your security, you must have recently signed in to delete your account. Please sign out, sign back in, and try again.",
                    confirmText: "Understood"
                  });
                }, 500);
                return;
              }
              throw authErr;
            }
          }
          
          resetStore();
          hideGlobalModal();
          router.replace('/onboarding/auth');
        } catch (e) {
          console.error('Delete account error:', e);
          hideGlobalModal();
        }
      },
      cancelText: "Cancel"
    });
  };

  const handleLogout = async () => {
    showGlobalModal({
      title: "Sign Out of Mummum?",
      description: "Signing out clears your local data for privacy. Your clinical records are safely backed up in the cloud and will be restored when you sign back in.",
      confirmText: "Sign Out",
      isDestructive: true,
      onConfirm: async () => {
        try {
          // 1. Force Cloud Sync before data removal
          try {
            await syncToCloud();
          } catch (syncErr) {
            console.log('[Logout]: Sync failed, proceeding anyway', syncErr);
          }

          // 2. Safe Social Cleanup (Google)
          if (GoogleSignin) {
            try {
              const isSigned = await GoogleSignin.hasPlayServices().then(() => true).catch(() => false);
              if (isSigned) await GoogleSignin.signOut().catch(() => {});
            } catch (socialErr) {
              console.log('[Logout]: Social cleanup skipped', socialErr);
            }
          }

          // 2. Primary Firebase Sign Out
          await auth().signOut();
          
          // 3. Clear Local State
          resetStore();
          hideGlobalModal();

          // 4. Temporal Buffer for Redirection
          // This prevents race-condition crashes on iOS during re-render
          setTimeout(() => {
            router.replace('/onboarding/auth');
          }, 100);
        } catch (e) {
          console.error('Logout error:', e);
          hideGlobalModal();
          // Fallback redirect even if cleanup partially fails
          router.replace('/onboarding/auth');
        }
      },
      cancelText: "Cancel"
    });
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
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
              style={[styles.luxuryCard, { backgroundColor: '#1B3C35', borderWidth: isPro ? 0 : 1, borderColor: '#C69C82' }]}
            >
              <View style={styles.cardContent}>
                <View style={[styles.iconCircle, { backgroundColor: isPro ? 'rgba(198, 156, 130, 0.15)' : '#C69C82' }]}>
                  {isPro ? <ShieldCheck size={22} color="#C69C82" /> : <Activity size={20} color="#fff" />}
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography variant="body" weight="800" color="#fff" style={{ letterSpacing: 0.5, fontSize: 14 }}>
                      {isPro ? "MUMMUM PRO ACTIVE" : "UNLOCK CLINICAL PRO"}
                    </Typography>
                    {!isPro && (
                      <View style={{ backgroundColor: '#C69C82', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                        <Typography variant="label" weight="800" color="#fff" style={{ fontSize: 7 }}>PREMIUM</Typography>
                      </View>
                    )}
                  </View>
                  <Typography variant="label" color="rgba(255,255,255,0.6)" weight="600" style={{ marginTop: 2, fontSize: 11 }}>
                    {isPro ? "Lifetime clinical assistant enabled" : "Unlimited logs, PDF reports & sync"}
                  </Typography>
                </View>
                <ChevronRight size={18} color={isPro ? 'rgba(255,255,255,0.2)' : '#C69C82'} />
              </View>
            </TouchableOpacity>
          </Animated.View>

          <View style={styles.section}>
            <Typography variant="label" weight="800" color="#B0BEC5" style={styles.sectionLabel}>ACCOUNT MANAGEMENT</Typography>
            <View style={styles.elegantGroup}>
              <ElegantMenuItem 
                icon={<Shield size={20} color="#1B3C35" />}
                title={user ? "Account Secured" : "Sync & Secure Account"}
                detail={user ? `Signed in as ${user.email || 'User'}` : "Enable cross-device restore"}
                onPress={() => user ? {} : router.push('/onboarding/auth')}
                hideChevron={!!user}
              />
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

          <View style={styles.section}>
            <Typography variant="label" weight="800" color="#B0BEC5" style={styles.sectionLabel}>SUPPORT & PREFERENCES</Typography>
            <View style={styles.elegantGroup}>
              <ElegantMenuItem 
                icon={<Shield size={20} color="#1B3C35" />}
                title="Privacy & Data"
                onPress={() => router.push('/settings/privacy')}
              />
              {user && (
                <ElegantMenuItem 
                  icon={<LogOut size={20} color="#1B3C35" />}
                  title="Sign Out"
                  onPress={handleLogout}
                  hideChevron
                />
              )}
                <ElegantMenuItem 
                  icon={<LogOut size={20} color="#f44336" />}
                  title="Reset All Clinical Data"
                  color="#f44336"
                  onPress={handleReset}
                  hideChevron
                />
                <ElegantMenuItem 
                  icon={<Shield size={20} color="#f44336" />}
                  title="Delete Account Permanently"
                  color="#f44336"
                  onPress={handleDeleteAccount}
                  hideChevron
                  isLast
                />
              </View>
          </View>

          <View style={styles.footer}>
            <Typography variant="label" color="#B0BEC5" weight="800" style={{ letterSpacing: 1 }}>MUMMUM HUB v1.0.5</Typography>
            <Typography variant="label" color="#CFD8DC" style={{ marginTop: 4 }}>Secured Clinical Cloud Sync Active</Typography>
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
  container: { flex: 1, backgroundColor: '#FDFCFB' },
  header: { paddingHorizontal: 24, paddingVertical: 12 },
  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', shadowColor: '#1B3C35', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  content: { padding: 24, paddingTop: 8 },
  mainTitle: { fontSize: 40, color: '#1B3C35' },
  subtitle: { marginTop: 4, marginBottom: 32 },
  luxuryCard: { padding: 14, paddingVertical: 18, borderRadius: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 8, marginBottom: 20, position: 'relative', overflow: 'hidden' },
  cardContent: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  section: { marginBottom: 32 },
  sectionLabel: { letterSpacing: 1.5, marginBottom: 12, marginLeft: 4, fontSize: 11 },
  elegantGroup: { backgroundColor: '#fff', borderRadius: 28, borderWidth: 1, borderColor: '#F1F5F9', overflow: 'hidden', shadowColor: '#1B3C35', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.03, shadowRadius: 16, elevation: 4 },
  menuItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
  menuBorder: { borderBottomWidth: 1, borderBottomColor: '#F8FAFB' },
  menuLeft: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  menuIconContainer: { width: 42, height: 42, borderRadius: 14, backgroundColor: '#FDFCFB', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#F1F5F9' },
  footer: { alignItems: 'center', marginTop: 8, marginBottom: 40 }
});
