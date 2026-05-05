import React from 'react';
import { 
  StyleSheet, 
  View, 
  TouchableOpacity, 
  Switch,
  ScrollView, 
  SafeAreaView
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import Typography from '@/components/Typography';
import { 
  ArrowLeft,
  Bell,
  Pill,
  Baby,
  Clock,
  Shield
} from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

export default function NotificationsSettingsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const themeColors = (Colors as any)[colorScheme];

  const [settings, setSettings] = React.useState({
    feedingReminders: true,
    medicationAlerts: true,
    sleepRoutine: true,
    clinicalNews: false,
    systemAlerts: true
  });

  const toggleSwitch = (key: keyof typeof settings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
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
          <Typography variant="body" weight="800" color="#1B3C35">Clinical Alerts</Typography>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <Animated.View entering={FadeInDown.duration(600)} style={styles.hero}>
            <View style={styles.iconCircle}>
              <Bell size={40} color="#fff" fill="#fff" />
            </View>
            <Typography variant="display" style={styles.title}>Notifications</Typography>
            <Typography variant="bodyMd" color="#607D8B" style={styles.subtitle}>
              Manage your baby's pediatric reminders
            </Typography>
          </Animated.View>

          <View style={styles.section}>
            <Typography variant="label" weight="800" color="#B0BEC5" style={styles.sectionLabel}>CARE REMINDERS</Typography>
            
            <View style={styles.elegantGroup}>
              <SwitchItem 
                icon={<Baby size={20} color="#1B3C35" />}
                title="Feeding Reminders"
                detail="Alert when next feeding is due"
                value={settings.feedingReminders}
                onToggle={() => toggleSwitch('feedingReminders')}
              />
              <SwitchItem 
                icon={<Pill size={20} color="#1B3C35" />}
                title="Medication Alerts"
                detail="Pediatric dosing reminders"
                value={settings.medicationAlerts}
                onToggle={() => toggleSwitch('medicationAlerts')}
              />
              <SwitchItem 
                icon={<Clock size={20} color="#1B3C35" />}
                title="Sleep Routine"
                detail="Bedtime and wake-up notifications"
                value={settings.sleepRoutine}
                onToggle={() => toggleSwitch('sleepRoutine')}
                isLast
              />
            </View>
          </View>

          <View style={styles.section}>
            <Typography variant="label" weight="800" color="#B0BEC5" style={styles.sectionLabel}>SYSTEM & SECURITY</Typography>
            
            <View style={styles.elegantGroup}>
              <SwitchItem 
                icon={<Shield size={20} color="#1B3C35" />}
                title="System Alerts"
                detail="Critical app updates"
                value={settings.systemAlerts}
                onToggle={() => toggleSwitch('systemAlerts')}
                isLast
              />
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function SwitchItem({ icon, title, detail, value, onToggle, isLast }: any) {
  return (
    <View style={[styles.menuItem, !isLast && styles.menuBorder]}>
      <View style={styles.menuLeft}>
        <View style={styles.menuIconContainer}>{icon}</View>
        <View style={{ flex: 1 }}>
          <Typography variant="body" weight="700" color="#1B3C35">{title}</Typography>
          <Typography variant="label" color="#90A4AE" weight="600">{detail}</Typography>
        </View>
      </View>
      <Switch 
        value={value} 
        onValueChange={onToggle}
        trackColor={{ false: '#CFD8DC', true: '#1B3C35' }}
        thumbColor="#fff"
      />
    </View>
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
  }
});
