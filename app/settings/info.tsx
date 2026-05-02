import React from 'react';
import { 
  StyleSheet, 
  View, 
  TouchableOpacity, 
  ScrollView, 
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import Typography from '@/components/Typography';
import { ArrowLeft } from 'lucide-react-native';

const INFO_CONTENT: Record<string, { title: string; sections: { title: string; content: string }[] }> = {
  privacy: {
    title: 'Privacy Policy',
    sections: [
      {
        title: 'Data Collection & Health Records',
        content: 'Mummum collects only the data necessary to provide clinical tracking for your baby, including feeding times, sleep patterns, diaper changes, and immunization records. This data is stored locally on your device and synchronized securely.'
      },
      {
        title: 'Medical Data Privacy',
        content: 'Your baby\'s health data is highly sensitive. We do not sell, trade, or rent your clinical data to any third parties. All immunization and medical records are isolated to your account and managed with high-precision security protocols.'
      },
      {
        title: 'HIPAA Compliance & Standards',
        content: 'While Mummum is a personal tracking tool, we adhere to the principles of healthcare data protection. We use industry-standard encryption to ensure your clinical history remains private and accessible only to you.'
      },
      {
        title: 'Data Deletion',
        content: 'Under Apple\'s privacy regulations, you have the right to delete your data at any time. Using the "Delete Account" feature in Settings will mathematically clear all clinical records from our systems and your device.'
      }
    ]
  },
  terms: {
    title: 'Terms of Service',
    sections: [
      {
        title: 'Not a Medical Substitute',
        content: 'Mummum is a clinical tracking and information tool. It is NOT a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of your pediatrician or other qualified health provider with any questions regarding your baby\'s health.'
      },
      {
        title: 'World Health Organization (WHO) Data',
        content: 'Our vaccination schedules are based on WHO clinical standards. However, clinical requirements may vary by region. Users are responsible for verifying their specific immunization needs with a local healthcare provider.'
      },
      {
        title: 'User Responsibility',
        content: 'Users are responsible for the accuracy of the care records entered into the system. Mummum is not liable for clinical decisions made based on user-entered data.'
      },
      {
        title: 'App Usage',
        content: 'By using Mummum, you agree to use the platform for its intended purpose of baby care tracking. Any misuse of the clinical suite or attempt to compromise data integrity is strictly prohibited.'
      }
    ]
  },
  about: {
    title: 'About Mummum',
    sections: [
      {
        title: 'Our Mission',
        content: 'Mummum was built with a simple mission: to empower parents with professional-grade tools for tracking their baby\'s nurture and clinical health. We believe every child deserves a mathematically perfect care routine.'
      },
      {
        title: 'Clinical Authority',
        content: 'Our platform integrates international standards, including WHO clinical schedules, to provide parents with high-precision guidance through the critical first years of life.'
      },
      {
        title: 'Privacy First',
        content: 'Mummum is designed with a privacy-first architecture. Your baby\'s clinical history is a sacred record, and we treat it with the highest level of technical respect and security.'
      },
      {
        title: 'Version 1.0.0',
        content: 'This is the production launch of Mummum. We are committed to continuous clinical hardening and interaction polishing to support parents everywhere.'
      }
    ]
  },
  help: {
    title: 'Help Center',
    sections: [
      {
        title: 'Tracking Daily Nurture',
        content: 'Use the Daily Checklist to track routine tasks like Vitamin D drops and Tummy Time. Tap an item to mark it complete, or swipe left to delete custom tasks. Use the "+" button to add your own specialized care routines.'
      },
      {
        title: 'Clinical Medical Records',
        content: 'The Medical suite tracks both vaccinations and medications. The Vaccination tab follows WHO standards; tap any vaccine to record its administration date. The Medicine tab allows you to log dosages and reasons, keeping a chronological clinical history.'
      },
      {
        title: 'Managing Baby Profiles',
        content: 'Mummum supports high-precision tracking for multiple children. You can switch between baby profiles or update your baby\'s information (name, photo, birthdate) through the dashboard and settings.'
      },
      {
        title: 'Data & Privacy Control',
        content: 'Your clinical data is stored securely. If you need to clear your history or remove an account, use the "Danger Zone" options in Settings. These actions are mathematically exhaustive and permanent to protect your privacy.'
      }
    ]
  }
};

export default function InfoScreen() {
  const router = useRouter();
  const { type } = useLocalSearchParams<{ type: string }>();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? 'light';
  const themeColors = Colors[colorScheme];
  
  const content = INFO_CONTENT[type || 'privacy'];

  return (
    <View style={[styles.container, { backgroundColor: '#F8FAFB', paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={24} color="#1B3C35" />
        </TouchableOpacity>
        <Typography variant="headline" weight="700" style={{ color: '#1B3C35' }}>{content.title}</Typography>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {content.sections.map((section, index) => (
          <View key={index} style={styles.section}>
            <Typography variant="bodyLg" weight="700" color="#1B3C35" style={styles.sectionTitle}>
              {section.title}
            </Typography>
            <Typography variant="body" color="#607D8B" style={styles.sectionContent}>
              {section.content}
            </Typography>
          </View>
        ))}
        
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  content: {
    padding: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    marginBottom: 12,
  },
  sectionContent: {
    lineHeight: 22,
  }
});
