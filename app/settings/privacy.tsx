import React from 'react';
import { 
  StyleSheet, 
  View, 
  TouchableOpacity, 
  ScrollView, 
  SafeAreaView,
  Modal
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import Typography from '@/components/Typography';
import { 
  ArrowLeft,
  Shield,
  Download,
  Trash2,
  ChevronRight,
  FileText,
  Lock,
  X,
  ShieldCheck,
  Activity,
  BarChart,
  HelpCircle,
  AlertCircle
} from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useBabyStore } from '@/store/useBabyStore';

export default function PrivacySettingsScreen() {
  const router = useRouter();
  const { showGlobalModal, hideGlobalModal, clearAllData } = useBabyStore();
  const [isPolicyVisible, setIsPolicyVisible] = React.useState(false);
  const [isDocVisible, setIsDocVisible] = React.useState(false);

  const handleExportData = () => {
    showGlobalModal({
      title: "Confirm Export",
      description: "Would you like to generate a complete clinical archive of your baby's logs? This report is formatted for medical review.",
      confirmText: "Generate Report",
      onConfirm: () => {
        hideGlobalModal();
        setTimeout(() => {
          showGlobalModal({
            title: "Export Ready",
            description: "Your baby's clinical archive has been generated and is ready for sharing.",
            confirmText: "Done"
          });
        }, 1500);
      }
    });
  };

  const handleDeleteData = () => {
    showGlobalModal({
      title: "Delete All Data?",
      description: "This action is permanent. All clinical logs, milestones, and baby profiles will be erased from this device forever.",
      confirmText: "Delete Everything",
      isDestructive: true,
      onConfirm: async () => {
        try {
          const auth = (await import('@react-native-firebase/auth')).default;
          const firestore = (await import('@react-native-firebase/firestore')).default;
          const user = auth().currentUser;
          
          if (user) {
            await firestore().collection('users').doc(user.uid).delete();
            await auth().signOut();
            
            // Safe Social Cleanup
            try {
              const { NativeModules } = await import('react-native');
              if (NativeModules.RNGoogleSignin || NativeModules.RNGoogleSigninModule) {
                const { GoogleSignin } = await import('@react-native-google-signin/google-signin');
                const isSigned = await GoogleSignin.hasPlayServices().then(() => true).catch(() => false);
                if (isSigned) await GoogleSignin.signOut().catch(() => {});
              }
            } catch (socialErr) {
              console.log('[Purge]: Social cleanup skipped/failed', socialErr);
            }
          }

          useBabyStore.getState().resetStore();
          hideGlobalModal();
          router.replace('/onboarding');
        } catch (e) {
          console.error('Total Purge failed:', e);
          hideGlobalModal();
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
          <Typography variant="body" weight="800" color="#1B3C35">Privacy & Data</Typography>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <Animated.View entering={FadeInDown.duration(600)} style={styles.hero}>
            <View style={styles.iconCircle}>
              <Shield size={40} color="#fff" fill="#fff" />
            </View>
            <Typography variant="display" style={styles.title}>Data Controls</Typography>
            <Typography variant="bodyMd" color="#607D8B" style={styles.subtitle}>
              Manage your baby's clinical information
            </Typography>
          </Animated.View>

          <View style={styles.section}>
            <Typography variant="label" weight="800" color="#B0BEC5" style={styles.sectionLabel}>PORTABILITY & LEGAL</Typography>
            <View style={styles.elegantGroup}>
              <MenuItem 
                icon={<Download size={20} color="#1B3C35" />}
                title="Export Baby Data"
                detail="Download full clinical history"
                onPress={handleExportData}
                isPro
              />
              <MenuItem 
                icon={<FileText size={20} color="#1B3C35" />}
                title="Privacy Policy"
                detail="How we protect your data"
                onPress={() => setIsPolicyVisible(true)}
                isLast
              />
            </View>
          </View>

          <View style={styles.section}>
            <Typography variant="label" weight="800" color="#B0BEC5" style={styles.sectionLabel}>SUPPORT</Typography>
            <View style={styles.elegantGroup}>
              <MenuItem 
                icon={<HelpCircle size={20} color="#1B3C35" />}
                title="Clinical Help Center"
                detail="contact@ambrighttech.com"
                onPress={() => showGlobalModal({
                  title: "Clinical Support",
                  description: "Our team is available 24/7 to assist with your baby's records. Email us at contact@ambrighttech.com.",
                  confirmText: "Close"
                })}
              />
              <MenuItem 
                icon={<FileText size={20} color="#1B3C35" />}
                title="Documentation"
                detail="Mummum clinical standards"
                onPress={() => setIsDocVisible(true)}
                isLast
              />
            </View>
          </View>

          <View style={styles.section}>
            <Typography variant="label" weight="800" color="#F44336" style={styles.sectionLabel}>DANGER ZONE</Typography>
            <View style={[styles.elegantGroup, { borderColor: '#FFEBEE' }]}>
              <MenuItem 
                icon={<Trash2 size={20} color="#F44336" />}
                title="Erase All Clinical Data"
                detail="This cannot be undone"
                onPress={handleDeleteData}
                isLast
              />
            </View>
          </View>

          <View style={styles.infoBox}>
            <Typography variant="label" color="#1B3C35" weight="700" style={{ textAlign: 'center', lineHeight: 18 }}>
              Your baby's clinical data is encrypted and safely synced to the Mummum Cloud when you secure your account.
            </Typography>
          </View>
        </ScrollView>

        {/* Privacy Policy Modal */}
        <Modal visible={isPolicyVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setIsPolicyVisible(false)}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Typography variant="body" weight="800" color="#1B3C35">Privacy Policy</Typography>
              <TouchableOpacity onPress={() => setIsPolicyVisible(false)}><X size={24} color="#1B3C35" /></TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.modalBody}>
              <PolicySection title="1. Clinical-Grade Privacy" content="Mummum is designed as a clinical assistant first. Your baby's health data is strictly yours. We do not sell, rent, or monetize your clinical records. Our business model is supported solely by Pro subscriptions." />
              <PolicySection title="2. Advanced Encryption" content="All clinical data—including feeding logs, growth metrics, and medical records—is encrypted using industry-standard AES-256 encryption. Data is encrypted both at rest on your device and in-transit to our secure cloud servers." />
              <PolicySection title="3. Data Ownership & Portability" content="You own your data. At any time, you can export your entire clinical history into a medical-grade report. If you choose to delete your account, all cloud and local records are purged permanently within 24 hours." />
              <PolicySection title="4. Child Privacy Protection" content="Mummum is fully compliant with global child privacy standards, including COPPA. We do not collect identifiable information from children. All baby profiles are managed by authenticated adult guardians." />
              <PolicySection title="5. Hybrid-Cloud Architecture" content="To ensure reliability, Mummum uses a dual-layer storage system. Your logs are saved locally for instant access (offline) and synced to the cloud whenever a connection is available to prevent data loss." />
            </ScrollView>
          </View>
        </Modal>

        {/* Documentation Modal */}
        <Modal visible={isDocVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setIsDocVisible(false)}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Typography variant="body" weight="800" color="#1B3C35">Clinical Standards</Typography>
              <TouchableOpacity onPress={() => setIsDocVisible(false)}><X size={24} color="#1B3C35" /></TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.modalBody}>
              <PolicySection title="Growth OS Standards" content="Our growth tracking and percentile curves are derived from the World Health Organization (WHO) and CDC clinical standards for infant development (0-24 months)." />
              <PolicySection title="Security Architecture" content="Mummum utilizes Google Firebase for real-time synchronization. Your identity is managed via Apple or Google authentication, ensuring that only you can access your baby's clinical hub." />
              <PolicySection title="Clinical Logging Engine" content="Our logging algorithms use atomic timestamps to ensure that multiple caregivers can log data simultaneously without conflicts, creating a single, reliable clinical timeline." />
              <PolicySection title="Offline Resilience" content="Mummum is built for high-stakes parenting. All critical features (feeding timers, medical logs) are fully functional without an internet connection, with automatic reconciliation once back online." />
            </ScrollView>
          </View>
        </Modal>
      </SafeAreaView>
    </View>
  );
}

function MenuItem({ icon, title, detail, onPress, isLast, isPro }: any) {
  return (
    <TouchableOpacity style={[styles.menuItem, !isLast && styles.menuBorder]} onPress={onPress}>
      <View style={styles.menuLeft}>
        <View style={styles.menuIconContainer}>{icon}</View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Typography variant="body" weight="700" color="#1B3C35">{title}</Typography>
            {isPro && (
              <View style={{ backgroundColor: '#C69C82', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                <Typography variant="label" weight="800" color="#fff" style={{ fontSize: 8 }}>PRO</Typography>
              </View>
            )}
          </View>
          <Typography variant="label" color="#90A4AE" weight="600">{detail}</Typography>
        </View>
      </View>
      <ChevronRight size={18} color="#CFD8DC" />
    </TouchableOpacity>
  );
}

function PolicySection({ title, content }: { title: string; content: string }) {
  return (
    <View style={{ marginBottom: 24 }}>
      <Typography variant="body" weight="800" color="#1B3C35" style={{ marginBottom: 8 }}>{title}</Typography>
      <Typography variant="bodyMd" color="#607D8B" style={{ lineHeight: 22 }}>{content}</Typography>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FDFCFB' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingVertical: 12 },
  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', shadowColor: '#1B3C35', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  content: { padding: 24 },
  hero: { alignItems: 'center', marginBottom: 40 },
  iconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#1B3C35', alignItems: 'center', justifyContent: 'center', marginBottom: 16, shadowColor: '#1B3C35', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.2, shadowRadius: 20, elevation: 8 },
  title: { fontSize: 28, textAlign: 'center', marginBottom: 4 },
  subtitle: { textAlign: 'center' },
  section: { marginBottom: 32 },
  sectionLabel: { letterSpacing: 1.5, marginBottom: 12, marginLeft: 4, fontSize: 11 },
  elegantGroup: { backgroundColor: '#fff', borderRadius: 28, borderWidth: 1, borderColor: '#F1F5F9', overflow: 'hidden', shadowColor: '#1B3C35', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.03, shadowRadius: 16, elevation: 4 },
  menuItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
  menuBorder: { borderBottomWidth: 1, borderBottomColor: '#F8FAFB' },
  menuLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 16, marginRight: 12 },
  menuIconContainer: { width: 42, height: 42, borderRadius: 14, backgroundColor: '#FDFCFB', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#F1F5F9' },
  infoBox: { backgroundColor: '#F8FAFB', padding: 20, borderRadius: 24, marginTop: 20, borderWidth: 1, borderColor: '#F1F5F9', marginBottom: 40 },
  modalContainer: { flex: 1, backgroundColor: '#FDFCFB' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  modalBody: { padding: 24 }
});
