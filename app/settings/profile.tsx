import React from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  TextInput,
  ScrollView,
  SafeAreaView,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import Typography from '@/components/Typography';
import { ArrowLeft, Baby, Calendar, Camera } from 'lucide-react-native';
import { useBabyStore } from '@/store/useBabyStore';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { format } from 'date-fns';
import DateTimePicker from '@/components/DateTimePicker';
import * as ImagePicker from 'expo-image-picker';
import { saveImagePermanently } from '@/utils/imagePersistor';

export default function BabyProfileScreen() {
  const router = useRouter();
  const { babies, currentBabyId, updateBaby, showGlobalModal } = useBabyStore();
  const currentBaby = babies.find(b => b.id === currentBabyId);

  const [name, setName] = React.useState(currentBaby?.name || '');
  const [photoUri, setPhotoUri] = React.useState(currentBaby?.photoUri || '');
  const [selectedDate, setSelectedDate] = React.useState(currentBaby?.birthDate ? new Date(currentBaby.birthDate) : new Date());
  const [showPicker, setShowPicker] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [isUploading, setIsUploading] = React.useState(false);

  const handlePickImage = async () => {
    showGlobalModal({
      title: "Baby Profile Photo",
      description: "Choose a source for your baby's clinical profile photo.",
      confirmText: "Camera",
      onConfirm: () => processImage(true),
      secondaryText: "Gallery",
      onSecondary: () => processImage(false),
      cancelText: "Cancel"
    });
  };

  const processImage = async (useCamera: boolean) => {
    try {
      const { status } = useCamera 
        ? await ImagePicker.requestCameraPermissionsAsync() 
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== 'granted') {
        showGlobalModal({
          title: "Permission Required",
          description: "We need access to your photos to personalize the clinical hub."
        });
        return;
      }

      setIsUploading(true);
      const result = useCamera 
        ? await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.7 })
        : await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.7 });

      if (!result.canceled && result.assets[0].uri) {
        const permanentUri = await saveImagePermanently(result.assets[0].uri);
        setPhotoUri(permanentUri);
      }
    } catch (e) {
      console.log('Image selection failed', e);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      showGlobalModal({
        title: "Name Required",
        description: "Please enter your baby's name to complete their clinical profile."
      });
      return;
    }

    if (!currentBabyId) {
      showGlobalModal({
        title: "Error",
        description: "Clinical profile ID not found. Please restart the app."
      });
      return;
    }

    setIsSaving(true);
    
    try {
      // Update local store
      updateBaby(currentBabyId, { 
        name: name.trim(), 
        birthDate: selectedDate.toISOString(),
        photoUri: photoUri 
      });

      // Explicit Cloud Sync for persistence
      const { syncToCloud } = useBabyStore.getState();
      await syncToCloud();

      // Notification cleanup (if name changed)
      const { cancelAllScheduledNotificationsAsync } = await import('expo-notifications');
      await cancelAllScheduledNotificationsAsync();
    } catch (e) {
      console.log('Save failed', e);
    } finally {
      setIsSaving(false);
      router.back();
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <ArrowLeft size={24} color="#1B3C35" />
          </TouchableOpacity>
          <Typography variant="body" weight="800" color="#1B3C35">Clinical Profile</Typography>
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={isSaving}>
            <Typography variant="body" weight="800" color={isSaving ? '#B0BEC5' : '#1B3C35'}>Save</Typography>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          {/* Avatar Section */}
          <Animated.View entering={FadeInDown.duration(600)} style={styles.avatarSection}>
            <TouchableOpacity style={styles.avatarWrapper} onPress={handlePickImage} disabled={isUploading}>
              <View style={styles.avatarCircle}>
                {photoUri ? (
                  <Image source={{ uri: photoUri }} style={styles.avatarImg} />
                ) : (
                  <Baby size={48} color="#fff" />
                )}
                <View style={styles.cameraBadge}>
                  {isUploading ? <ActivityIndicator size="small" color="#fff" /> : <Camera size={14} color="#fff" />}
                </View>
              </View>
            </TouchableOpacity>
            <Typography variant="bodyLg" weight="800" style={{ marginTop: 16 }}>{name || 'Baby'}</Typography>
            <Typography variant="label" color="#607D8B">Clinical Identity</Typography>
          </Animated.View>

          {/* Fields */}
          <View style={styles.section}>
            <Typography variant="label" weight="800" color="#B0BEC5" style={styles.sectionLabel}>IDENTITY DETAILS</Typography>
            <View style={styles.inputGroup}>
              <View style={styles.inputContainer}>
                <Typography variant="label" weight="800" color="#90A4AE" style={{ marginBottom: 8 }}>NAME</Typography>
                <TextInput
                  style={styles.textInput}
                  value={name}
                  onChangeText={setName}
                  placeholder="Baby's Name"
                  placeholderTextColor="#CFD8DC"
                />
              </View>
              <TouchableOpacity
                style={[styles.inputContainer, { borderBottomWidth: 0, paddingBottom: 0, marginBottom: 0 }]}
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
              Profile updates instantly recalculate clinical milestones and growth projections across the hub.
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
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 24, paddingVertical: 12,
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
  avatarWrapper: { position: 'relative' },
  avatarCircle: {
    width: 110, height: 110, borderRadius: 55,
    backgroundColor: '#1B3C35', alignItems: 'center', justifyContent: 'center',
    shadowColor: '#1B3C35', shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2, shadowRadius: 20, elevation: 8,
    overflow: 'visible',
  },
  avatarImg: { width: 110, height: 110, borderRadius: 55 },
  cameraBadge: {
    position: 'absolute', bottom: 0, right: 0,
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#C69C82', alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: '#fff',
  },
  section: { marginBottom: 32 },
  sectionLabel: { letterSpacing: 1.5, marginBottom: 12, marginLeft: 4, fontSize: 11 },
  inputGroup: {
    backgroundColor: '#fff', borderRadius: 28,
    borderWidth: 1, borderColor: '#F1F5F9', overflow: 'hidden',
    padding: 22,
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
    backgroundColor: '#F1F8E9', padding: 22, borderRadius: 24,
    marginTop: 20, borderWidth: 1, borderColor: '#E8F5E9',
  },
});
