import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  TouchableOpacity, 
  ScrollView, 
  Image, 
  TextInput, 
  KeyboardAvoidingView, 
  Platform, 
  TouchableWithoutFeedback, 
  Keyboard 
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import Typography from '@/components/Typography';
import Card from '@/components/Card';
import { Bell, Droplet, AlertCircle, FileText } from 'lucide-react-native';
import { useBabyStore } from '@/store/useBabyStore';

export default function DiaperLogScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const themeColors = Colors[colorScheme];
  const { addActivity, stopSession, babies, currentBabyId } = useBabyStore();
  const currentBaby = babies.find(b => b.id === currentBabyId);

  const [type, setType] = useState('Wet');
  const [rash, setRash] = useState(false);
  const [notes, setNotes] = useState('');

  const getBabyAge = (birthDate: Date | string | undefined) => {
    if (!birthDate) return '';
    const birth = new Date(birthDate);
    const now = new Date();
    const diffMonths = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
    return `${diffMonths} months old`;
  };

  const handleSave = () => {
    addActivity({
      type: 'diaper',
      timestamp: new Date(),
      details: {
        diaperType: type,
        hasRash: rash,
        notes: notes
      },
    });
    stopSession('diaper');
    router.replace('/(tabs)');
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView 
          style={[styles.container, { backgroundColor: '#F8FAFB' }]}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtnHeader}>
              <ArrowLeft size={24} color="#1B3C35" />
            </TouchableOpacity>
            <View style={styles.headerCenter}>
              <Typography variant="headline" weight="700" style={{ color: '#1B3C35' }}>Diaper Log</Typography>
              <Typography variant="label" color="#607D8B">{currentBaby?.name || 'Baby'} • {getBabyAge(currentBaby?.birthDate)}</Typography>
            </View>
            <View style={{ width: 40 }} />
          </View>

          {/* Title */}
          <View style={styles.titleSection}>
            <Typography variant="bodyLg" color={themeColors.icon} align="center">
              Monitoring {currentBaby?.name || 'Baby'}'s comfort
            </Typography>
          </View>

          {/* Type Selection Grid */}
          <View style={styles.gridContainer}>
            {['Wet', 'Dirty', 'Both'].map((t) => (
              <TouchableOpacity 
                key={t}
                style={[
                  styles.typeCard, 
                  type === t ? [styles.activeTypeCard, { backgroundColor: '#FBE9E7', borderColor: '#C69C82' }] : { backgroundColor: '#fff', borderColor: '#F5F5F5' }
                ]}
                onPress={() => setType(t)}
              >
                <View style={[styles.iconCircle, { backgroundColor: type === t ? '#C69C82' : '#F5F5F5' }]}>
                  <Droplet size={24} color={type === t ? '#fff' : '#C69C82'} />
                </View>
                <Typography weight="700" color={type === t ? '#8D6E63' : '#A0A0A0'}>{t}</Typography>
              </TouchableOpacity>
            ))}
          </View>

          {/* Rash Warning */}
          <TouchableOpacity 
            style={[styles.rashCard, rash && { backgroundColor: '#FFEBEE', borderColor: '#F44336' }]}
            onPress={() => setRash(!rash)}
          >
            <View style={[styles.rashIcon, { backgroundColor: rash ? '#F44336' : '#F5F5F5' }]}>
              <AlertCircle size={20} color={rash ? '#fff' : '#F44336'} />
            </View>
            <View style={{ flex: 1 }}>
              <Typography weight="700" color={rash ? '#C62828' : '#1A1A1A'}>Diaper Rash?</Typography>
              <Typography variant="label" color={rash ? '#E57373' : themeColors.icon}>Toggle if you notice any irritation</Typography>
            </View>
            <View style={[styles.checkbox, rash && { backgroundColor: '#F44336', borderColor: '#F44336' }]}>
              {rash && <AlertCircle size={14} color="#fff" />}
            </View>
          </TouchableOpacity>

          {/* Notes Section */}
          <Card style={styles.notesCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <FileText size={18} color="#8D6E63" />
              <Typography variant="bodyLg" weight="600" color="#8D6E63">Clinical Notes</Typography>
            </View>
            <TextInput
              style={styles.notesInput}
              placeholder="Record any observations..."
              multiline
              value={notes}
              onChangeText={setNotes}
              placeholderTextColor="#B0BEC5"
            />
          </Card>

          {/* Save Button */}
          <TouchableOpacity 
            style={[styles.saveButton, { backgroundColor: '#C69C82' }]}
            onPress={handleSave}
          >
            <Typography variant="bodyLg" weight="700" style={{ color: '#fff' }}>Save Diaper Log</Typography>
          </TouchableOpacity>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 24,
    paddingBottom: 40,
    gap: 32,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
  },
  backBtnHeader: {
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
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  titleSection: {
    gap: 4,
  },
  title: {
    fontSize: 32,
  },
  gridContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  typeCard: {
    flex: 1,
    padding: 20,
    borderRadius: 24,
    borderWidth: 2,
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  activeTypeCard: {
    elevation: 4,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rashCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#F5F5F5',
    backgroundColor: '#fff',
    gap: 16,
  },
  rashIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButton: {
    marginTop: 16,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  notesCard: {
    padding: 24,
    borderRadius: 32,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#FBE9E7',
    gap: 4,
  },
  notesInput: {
    backgroundColor: '#F8FAFB',
    borderRadius: 16,
    padding: 16,
    height: 100,
    textAlignVertical: 'top',
    fontSize: 16,
    color: '#37474F',
  }
});
