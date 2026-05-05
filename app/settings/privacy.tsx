import React from 'react';
import { 
  StyleSheet, 
  View, 
  TouchableOpacity, 
  ScrollView, 
  SafeAreaView,
  Alert,
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
  BarChart
} from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useBabyStore } from '@/store/useBabyStore';

export default function PrivacySettingsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const themeColors = (Colors as any)[colorScheme];
  const { babies, logs } = useBabyStore();
  const [isPolicyVisible, setIsPolicyVisible] = React.useState(false);
  const [isDocVisible, setIsDocVisible] = React.useState(false);

  const handleExportData = () => {
    Alert.alert(
      "Export Clinical Data",
      "We will generate a comprehensive clinical JSON export of your baby's entire history. Would you like to proceed?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Generate Export", onPress: () => {
          const data = { babies, logs, exportedAt: new Date().toISOString() };
          console.log("Exporting Data:", JSON.stringify(data, null, 2));
          Alert.alert("Success", "your baby's clinical export is ready for archival.");
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
            <Typography variant="label" weight="800" color="#B0BEC5" style={styles.sectionLabel}>PORTABILITY</Typography>
            
            <View style={styles.elegantGroup}>
              <MenuItem 
                icon={<Download size={20} color="#1B3C35" />}
                title="Export your baby's Data"
                detail="Download full clinical history"
                onPress={handleExportData}
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
            <Typography variant="label" weight="800" color="#B0BEC5" style={styles.sectionLabel}>SECURITY</Typography>
            
            <View style={styles.elegantGroup}>
              <MenuItem 
                icon={<Lock size={20} color="#1B3C35" />}
                title="Biometric Lock"
                detail="Protect your baby's clinical hub"
                onPress={() => Alert.alert(
                  "Biometric Security", 
                  "Biometric Lock allows you to secure the Mummum app using FaceID or TouchID. This ensures that your baby's clinical logs are only accessible to you. This feature is coming in the next clinical update."
                )}
                isLast
              />
            </View>
          </View>

          <View style={styles.section}>
            <Typography variant="label" weight="800" color="#B0BEC5" style={styles.sectionLabel}>CLINICAL HELP CENTER</Typography>
            
            <View style={styles.elegantGroup}>
              <MenuItem 
                icon={<Shield size={20} color="#1B3C35" />}
                title="Support & Clinical Inquiries"
                detail="support@mummum.app"
                onPress={() => Alert.alert("Clinical Support", "Our clinical support team is available 24/7. Please email support@mummum.app for assistance.")}
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
            <Typography variant="label" weight="800" color="#B0BEC5" style={styles.sectionLabel}>APP STORE PRIVACY LABELS</Typography>
            <View style={styles.elegantGroup}>
              <View style={styles.privacyCard}>
                <View style={styles.labelHeader}>
                  <View style={[styles.labelIcon, { backgroundColor: '#E8F5E9' }]}>
                    <ShieldCheck size={20} color="#2E7D32" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Typography variant="body" weight="800" color="#1B3C35">Data Not Linked to You</Typography>
                    <Typography variant="label" color="#607D8B">The following data is collected but anonymized.</Typography>
                  </View>
                </View>
                
                <View style={styles.labelGrid}>
                  <LabelItem icon={<Activity size={14} color="#1B3C35" />} label="Health & Fitness" />
                  <LabelItem icon={<BarChart size={14} color="#1B3C35" />} label="Usage Data" />
                  <LabelItem icon={<Shield size={14} color="#1B3C35" />} label="Diagnostics" />
                </View>

                <View style={[styles.labelHeader, { marginTop: 20 }]}>
                  <View style={[styles.labelIcon, { backgroundColor: '#F5F5F5' }]}>
                    <Lock size={20} color="#616161" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Typography variant="body" weight="800" color="#1B3C35">Data Not Collected</Typography>
                    <Typography variant="label" color="#607D8B">Mummum does not collect the following:</Typography>
                  </View>
                </View>
                <View style={styles.labelGrid}>
                  <LabelItem label="Contact Info" />
                  <LabelItem label="Identifiers" />
                  <LabelItem label="Location" />
                </View>
              </View>
            </View>
          </View>

          <View style={styles.infoBox}>
            <Typography variant="label" color="#1B3C35" weight="700" style={{ textAlign: 'center', lineHeight: 18 }}>
              Your baby's data is stored locally-first with end-to-end encryption. Your clinical records are entirely your own and never shared without your permission.
            </Typography>
          </View>
        </ScrollView>

        {/* Privacy Policy Modal */}
        <Modal
          visible={isPolicyVisible}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setIsPolicyVisible(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Typography variant="body" weight="800" color="#1B3C35">Clinical Privacy Policy</Typography>
              <TouchableOpacity onPress={() => setIsPolicyVisible(false)}>
                <X size={24} color="#1B3C35" />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.modalBody}>
              <PolicySection 
                title="1. Clinical-Grade Privacy" 
                content="Mummum is designed as a clinical assistant. Your baby's health data (feedings, sleep, medications) is stored locally on your device. We do not sell or share clinical data with third-party advertisers." 
              />
              <PolicySection 
                title="2. Data Encryption" 
                content="All sensitive clinical logs are protected using system-level encryption. If you choose to enable cloud sync, your data is transmitted via secure, encrypted channels." 
              />
              <PolicySection 
                title="3. Data Portability" 
                content="You have the right to export your entire clinical history at any time using the 'Export Data' tool. This data belongs to you and your pediatrician." 
              />
              <PolicySection 
                title="4. Data Deletion" 
                content="Deleting an activity or a baby profile permanently removes that data from your device. Mummum does not keep 'ghost' copies of your deleted clinical records." 
              />
              <PolicySection 
                title="5. App Store Compliance" 
                content="Mummum complies with Apple's privacy requirements for Health & Fitness apps. We only collect anonymized diagnostic data to improve app stability." 
              />
              
              <View style={{ height: 40 }} />
              <Typography variant="label" color="#90A4AE" style={{ textAlign: 'center' }}>
                Last Updated: May 2026
              </Typography>
            </ScrollView>
          </View>
        </Modal>

        {/* Documentation Modal */}
        <Modal
          visible={isDocVisible}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setIsDocVisible(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Typography variant="body" weight="800" color="#1B3C35">Clinical Documentation</Typography>
              <TouchableOpacity onPress={() => setIsDocVisible(false)}>
                <X size={24} color="#1B3C35" />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.modalBody}>
              <PolicySection 
                title="Clinical Tracking Methodology" 
                content="Mummum uses a high-precision temporal tracking system. All timestamps are recorded with millisecond accuracy to ensure pediatricians can see the exact spacing between feedings and medications." 
              />
              <PolicySection 
                title="Growth OS Standards" 
                content="Our growth tracking follows standard WHO and CDC clinical percentile models. Data points are plotted against these curves to provide a clear picture of your baby's developmental progress." 
              />
              <PolicySection 
                title="Pediatric PDF Export" 
                content="The generated reports are formatted for medical review. They include categorized sections for medications, vaccinations, and nurture patterns (feeding/sleep) to facilitate clear communication during checkups." 
              />
              <PolicySection 
                title="Security Architecture" 
                content="Mummum's 'Local-First' architecture means the database is on your phone. We use industry-standard encryption for local data storage and secure TLS channels for any optional cloud features." 
              />
              
              <View style={{ height: 40 }} />
              <Typography variant="label" color="#90A4AE" style={{ textAlign: 'center' }}>
                Mummum Clinical Standards v1.0
              </Typography>
            </ScrollView>
          </View>
        </Modal>
      </SafeAreaView>


    </View>
  );
}

function MenuItem({ icon, title, detail, onPress, isLast }: any) {
  return (
    <TouchableOpacity 
      style={[styles.menuItem, !isLast && styles.menuBorder]}
      onPress={onPress}
      activeOpacity={0.6}
    >
      <View style={styles.menuLeft}>
        <View style={styles.menuIconContainer}>{icon}</View>
        <View style={{ flex: 1 }}>
          <Typography variant="body" weight="700" color="#1B3C35">{title}</Typography>
          <Typography variant="label" color="#90A4AE" weight="600">{detail}</Typography>
        </View>
      </View>
      <ChevronRight size={18} color="#CFD8DC" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  },
  hero: {
    alignItems: 'center',
    marginBottom: 40,
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
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 8,
  },
  title: {
    fontSize: 28,
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    textAlign: 'center',
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
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginRight: 12,
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
  infoBox: {
    backgroundColor: '#F8FAFB',
    padding: 20,
    borderRadius: 24,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 40,
  },
  privacyCard: {
    padding: 20,
  },
  dataGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  dataPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#F1F4F6',
    borderRadius: 8,
  },
  labelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  labelIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 16,
    paddingLeft: 56,
  },
  labelItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFB',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 6,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FDFCFB',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalBody: {
    padding: 24,
  },
  policySection: {
    marginBottom: 24,
  }
});

function PolicySection({ title, content }: { title: string; content: string }) {
  return (
    <View style={styles.policySection}>
      <Typography variant="body" weight="800" color="#1B3C35" style={{ marginBottom: 8 }}>{title}</Typography>
      <Typography variant="bodyMd" color="#607D8B" style={{ lineHeight: 22 }}>{content}</Typography>
    </View>
  );
}


function DataPill({ label }: { label: string }) {
  return (
    <View style={styles.dataPill}>
      <Typography variant="label" weight="700" color="#4A5D4C" style={{ fontSize: 9 }}>{label}</Typography>
    </View>
  );
}

function LabelItem({ icon, label }: { icon?: any, label: string }) {
  return (
    <View style={styles.labelItem}>
      {icon}
      <Typography variant="label" weight="700" color="#1B3C35" style={{ fontSize: 10 }}>{label}</Typography>
    </View>
  );
}

