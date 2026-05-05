import React from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  TextInput,
  ScrollView,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import Typography from '@/components/Typography';
import { ArrowLeft, Baby, Calendar } from 'lucide-react-native';
import { useBabyStore } from '@/store/useBabyStore';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { format } from 'date-fns';
import DateTimePicker from '@/components/DateTimePicker';

export default function BabyProfileScreen() {
  const router = useRouter();
  const { babies, currentBabyId, updateBaby } = useBabyStore();
  const currentBaby = babies.find(b => b.id === currentBabyId);

  const [name, setName] = React.useState(currentBaby?.name || '');
  const [selectedDate, setSelectedDate] = React.useState(currentBaby?.birthDate ? new Date(currentBaby.birthDate) : new Date());
  const [showPicker, setShowPicker] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert('Required', "Please enter the baby's name.");
      return;
    }
    setIsSaving(true);
    updateBaby(currentBabyId, { name: name.trim(), birthDate: selectedDate.toISOString() });
    setTimeout(() => {
      setIsSaving(false);
      router.back();
    }, 500);
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <ArrowLeft size={24} color="#1B3C35" />
          </TouchableOpacity>
          <Typography variant="body" weight="800" color="#1B3C35">Baby Profile</Typography>
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={isSaving}>
            <Typography variant="body" weight="800" color={isSaving ? '#B0BEC5' : '#1B3C35'}>Save</Typography>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          {/* Avatar */}
          <Animated.View entering={FadeInDown.duration(600)} style={styles.avatarSection}>
            <View style={styles.avatarCircle}>
              <Baby size={48} color="#fff" />
            </View>
            <Typography variant="bodyLg" weight="800" style={{ marginTop: 16 }}>{name || 'Baby'}</Typography>
            <Typography variant="label" color="#607D8B">Clinical Identity</Typography>
          </Animated.View>

          {/* Fields */}
          <View style={styles.section}>
            <Typography variant="label" weight="800" color="#B0BEC5" style={styles.sectionLabel}>CORE DETAILS</Typography>
            <View style={styles.inputGroup}>
              {/* Name */}
              <View style={styles.inputContainer}>
                <Typography variant="label" weight="800" color="#90A4AE" style={{ marginBottom: 8 }}>NAME</Typography>
                <TextInput
                  style={styles.textInput}
                  value={name}
                  onChangeText={setName}
                  placeholder="Enter name"
                  placeholderTextColor="#CFD8DC"
                />
              </View>
              {/* Birth Date */}
              <TouchableOpacity
                style={[styles.inputContainer, { borderBottomWidth: 0 }]}
                onPress={() => setShowPicker(true)}
              >
                <Typography variant="label" weight="800" color="#90A4AE" style={{ marginBottom: 8 }}>DATE OF BIRTH</Typography>
                <View style={styles.dateRow}>
                  <Typography variant="body" weight="700" color="#1B3C35">{format(selectedDate, 'MMMM d, yyyy')}</Typography>
                  <Calendar size={18} color="#CFD8DC" />
                </View>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.infoBox}>
            <Typography variant="label" color="#1B3C35" weight="700" style={{ textAlign: 'center', lineHeight: 18 }}>
              Updating these details will recalculate the baby's age and all pediatric milestones across the hub.
            </Typography>
          </View>
        </ScrollView>
      </SafeAreaView>

      <DateTimePicker 
        visible={showPicker}
        mode="date"
        initialDate={selectedDate}
        onClose={() => setShowPicker(false)}
        onSelect={(date) => {
          setSelectedDate(date);
          setShowPicker(false);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FDFCFB' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  backBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
    shadowColor: '#1B3C35', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05, shadowRadius: 10, elevation: 2,
  },
  saveBtn: { paddingHorizontal: 16, paddingVertical: 8 },
  content: { padding: 24 },
  avatarSection: { alignItems: 'center', marginBottom: 40 },
  avatarCircle: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: '#1B3C35', alignItems: 'center', justifyContent: 'center',
    shadowColor: '#1B3C35', shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2, shadowRadius: 20, elevation: 8,
  },
  section: { marginBottom: 32 },
  sectionLabel: { letterSpacing: 1.5, marginBottom: 12, marginLeft: 4, fontSize: 11 },
  inputGroup: {
    backgroundColor: '#fff', borderRadius: 28,
    borderWidth: 1, borderColor: '#F1F5F9', overflow: 'hidden',
    padding: 20,
    shadowColor: '#1B3C35', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.03, shadowRadius: 16, elevation: 4,
  },
  inputContainer: {
    marginBottom: 20, borderBottomWidth: 1,
    borderBottomColor: '#F8FAFB', paddingBottom: 16,
  },
  textInput: { fontSize: 18, fontWeight: '700', color: '#1B3C35', padding: 0 },
  dateRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  infoBox: {
    backgroundColor: '#F1F8E9', padding: 20, borderRadius: 24,
    marginTop: 20, borderWidth: 1, borderColor: '#E8F5E9',
  },
});
