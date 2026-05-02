import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  TouchableOpacity, 
  ScrollView, 
  Switch,
  TextInput,
  Alert
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import Typography from '@/components/Typography';
import Card from '@/components/Card';
import { ArrowLeft, Save, CheckCircle } from 'lucide-react-native';
import { useBabyStore } from '@/store/useBabyStore';

export default function ControlsScreen() {
  const router = useRouter();
  const { type } = useLocalSearchParams<{ type: string }>();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? 'light';
  const themeColors = Colors[colorScheme];
  const { currentBabyId, babies, updateBaby, userPhotoUri, userName, updateUserName } = useBabyStore();
  const currentBaby = babies.find(b => b.id === currentBabyId);

  const [isSuccess, setIsSuccess] = useState(false);

  // Profile State (Baby)
  const [babyName, setBabyName] = useState(currentBaby?.name || '');
  const [birthDate, setBirthDate] = useState(currentBaby?.birthDate ? new Date(currentBaby.birthDate) : new Date());
  const [gender, setGender] = useState(currentBaby?.gender || 'Boy');
  
  // Profile State (Parent)
  const [parentName, setParentName] = useState(userName);

  // Privacy State
  const [biometricLock, setBiometricLock] = useState(false);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true);
  const [cloudBackup, setCloudBackup] = useState(true);

  // Notification State
  const [checklistReminders, setChecklistReminders] = useState(true);
  const [vaccineAlerts, setVaccineAlerts] = useState(true);
  const [medicineAlerts, setMedicineAlerts] = useState(true);

  const handleSave = () => {
    if (currentBabyId) {
      updateBaby(currentBabyId, {
        name: babyName,
        birthDate: birthDate,
        gender: gender
      });
    }
    
    updateUserName(parentName);
    
    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      Alert.alert("Profile Updated", "Clinical information has been saved.");
      router.back();
    }, 1000);
  };

  const renderProfile = () => (
    <View style={styles.form}>
      <Typography variant="label" weight="800" color="#90A4AE" style={styles.sectionTitle}>BABY INFORMATION</Typography>
      <Card style={styles.card}>
        <View style={styles.inputGroup}>
          <Typography variant="label" weight="700" color="#90A4AE" style={styles.label}>BABY'S NAME</Typography>
          <TextInput 
            style={styles.input}
            value={babyName}
            onChangeText={setBabyName}
            placeholder="Enter baby's name"
          />
        </View>
        <View style={styles.inputGroup}>
          <Typography variant="label" weight="700" color="#90A4AE" style={styles.label}>BIRTH DATE</Typography>
          <TouchableOpacity style={styles.dateDisplay} onPress={() => {}}>
            <Typography variant="body" color="#1B3C35">{birthDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</Typography>
          </TouchableOpacity>
        </View>
        <View style={styles.inputGroup}>
          <Typography variant="label" weight="700" color="#90A4AE" style={styles.label}>GENDER</Typography>
          <View style={styles.genderContainer}>
            {['Boy', 'Girl', 'Other'].map((g) => (
              <TouchableOpacity 
                key={g} 
                style={[styles.genderBtn, gender === g && styles.genderBtnActive]}
                onPress={() => setGender(g as any)}
              >
                <Typography variant="label" weight="700" color={gender === g ? '#fff' : '#607D8B'}>{g}</Typography>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Card>

      <Typography variant="label" weight="800" color="#90A4AE" style={[styles.sectionTitle, { marginTop: 12 }]}>PARENT INFORMATION</Typography>
      <Card style={styles.card}>
        <View style={styles.inputGroup}>
          <Typography variant="label" weight="700" color="#90A4AE" style={styles.label}>PARENT NAME</Typography>
          <TextInput 
            style={styles.input}
            value={parentName}
            onChangeText={setParentName}
          />
        </View>
      </Card>
    </View>
  );

  const renderPrivacy = () => (
    <View style={styles.form}>
      <Card style={styles.card}>
        <View style={styles.switchItem}>
          <View style={{ flex: 1 }}>
            <Typography variant="body" weight="700" color="#1B3C35">Biometric App Lock</Typography>
            <Typography variant="label" color="#607D8B">Require FaceID/TouchID on start</Typography>
          </View>
          <Switch value={biometricLock} onValueChange={setBiometricLock} trackColor={{ true: '#4A5D4C' }} />
        </View>
        <View style={styles.divider} />
        <View style={styles.switchItem}>
          <View style={{ flex: 1 }}>
            <Typography variant="body" weight="700" color="#1B3C35">Anonymous Analytics</Typography>
            <Typography variant="label" color="#607D8B">Help us improve the clinical hub</Typography>
          </View>
          <Switch value={analyticsEnabled} onValueChange={setAnalyticsEnabled} trackColor={{ true: '#4A5D4C' }} />
        </View>
        <View style={styles.divider} />
        <View style={styles.switchItem}>
          <View style={{ flex: 1 }}>
            <Typography variant="body" weight="700" color="#1B3C35">Secure Cloud Backup</Typography>
            <Typography variant="label" color="#607D8B">Sync records across your devices</Typography>
          </View>
          <Switch value={cloudBackup} onValueChange={setCloudBackup} trackColor={{ true: '#4A5D4C' }} />
        </View>
      </Card>
    </View>
  );

  const renderNotifications = () => (
    <View style={styles.form}>
      <Card style={styles.card}>
        <View style={styles.switchItem}>
          <View style={{ flex: 1 }}>
            <Typography variant="body" weight="700" color="#1B3C35">Daily Checklist Alerts</Typography>
            <Typography variant="label" color="#607D8B">Reminders for care tasks</Typography>
          </View>
          <Switch value={checklistReminders} onValueChange={setChecklistReminders} trackColor={{ true: '#4A5D4C' }} />
        </View>
        <View style={styles.divider} />
        <View style={styles.switchItem}>
          <View style={{ flex: 1 }}>
            <Typography variant="body" weight="700" color="#1B3C35">Clinical Vaccine Alerts</Typography>
            <Typography variant="label" color="#607D8B">Follow the WHO schedule</Typography>
          </View>
          <Switch value={vaccineAlerts} onValueChange={setVaccineAlerts} trackColor={{ true: '#4A5D4C' }} />
        </View>
        <View style={styles.divider} />
        <View style={styles.switchItem}>
          <View style={{ flex: 1 }}>
            <Typography variant="body" weight="700" color="#1B3C35">Medicine Dosing Alerts</Typography>
            <Typography variant="label" color="#607D8B">Don't miss a required dose</Typography>
          </View>
          <Switch value={medicineAlerts} onValueChange={setMedicineAlerts} trackColor={{ true: '#4A5D4C' }} />
        </View>
      </Card>
    </View>
  );

  const titles: Record<string, string> = {
    profile: 'Profile Info',
    privacy: 'Privacy Settings',
    notifications: 'Notifications'
  };

  return (
    <View style={[styles.container, { backgroundColor: '#F8FAFB', paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={24} color="#1B3C35" />
        </TouchableOpacity>
        <Typography variant="headline" weight="700" style={{ color: '#1B3C35' }}>{titles[type || 'profile']}</Typography>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {type === 'profile' && renderProfile()}
        {type === 'privacy' && renderPrivacy()}
        {type === 'notifications' && renderNotifications()}

        <TouchableOpacity 
          style={[styles.saveBtn, isSuccess && { backgroundColor: '#4CAF50' }]} 
          onPress={handleSave}
          disabled={isSuccess}
        >
          {isSuccess ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <CheckCircle size={20} color="#fff" />
              <Typography weight="700" color="#fff">Updated</Typography>
            </View>
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Save size={20} color="#fff" />
              <Typography weight="700" color="#fff">Save Preferences</Typography>
            </View>
          )}
        </TouchableOpacity>
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
  form: {
    gap: 16,
  },
  card: {
    padding: 20,
    borderRadius: 24,
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    letterSpacing: 1,
  },
  input: {
    backgroundColor: '#F8FAFB',
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    color: '#1B3C35',
    borderWidth: 1,
    borderColor: '#ECEFF1',
  },
  switchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  divider: {
    height: 1,
    backgroundColor: '#ECEFF1',
  },
  saveBtn: {
    height: 60,
    backgroundColor: '#4A5D4C',
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  sectionTitle: {
    letterSpacing: 1.5,
    marginLeft: 4,
    marginBottom: 8,
  },
  dateDisplay: {
    backgroundColor: '#F8FAFB',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#ECEFF1',
  },
  genderContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  genderBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F8FAFB',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ECEFF1',
  },
  genderBtnActive: {
    backgroundColor: '#4A5D4C',
    borderColor: '#4A5D4C',
  },
});
