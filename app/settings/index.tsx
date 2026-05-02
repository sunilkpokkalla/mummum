import { 
  StyleSheet, 
  View, 
  TouchableOpacity, 
  ScrollView, 
  Alert,
  Platform,
  Linking,
  Image
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import Typography from '@/components/Typography';
import Card from '@/components/Card';
import { 
  ArrowLeft, 
  User, 
  Shield, 
  FileText, 
  LogOut, 
  Trash2, 
  ChevronRight,
  Info,
  LifeBuoy,
  Bell,
  Camera
} from 'lucide-react-native';
import { useBabyStore } from '@/store/useBabyStore';
import { saveImagePermanently } from '@/utils/imagePersistor';

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? 'light';
  const themeColors = Colors[colorScheme];
  const { currentBabyId, babies, resetStore, updateUserPhoto, userPhotoUri, userName } = useBabyStore();
  const currentBaby = babies.find(b => b.id === currentBabyId);

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to log out?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Logout", 
          style: "destructive", 
          onPress: () => {
            router.replace('/onboarding/auth');
          }
        }
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "This action is permanent and will delete all baby data, clinical records, and settings. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete My Data", 
          style: "destructive", 
          onPress: () => {
            resetStore();
            router.replace('/onboarding');
          }
        }
      ]
    );
  };

  const openInfo = (type: string) => {
    router.push({ pathname: '/settings/info', params: { type } });
  };

  const openControl = (type: string) => {
    router.push({ pathname: '/settings/controls', params: { type } });
  };

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      const permanentUri = await saveImagePermanently(result.assets[0].uri);
      updateUserPhoto(permanentUri);
    }
  };

  const SettingItem = ({ icon: Icon, label, onPress, color = themeColors.text, showChevron = true }: any) => (
    <TouchableOpacity 
      style={styles.settingItem} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.itemLeft}>
        <View style={[styles.iconContainer, { backgroundColor: colorScheme === 'light' ? '#F8FAFB' : '#1A2327' }]}>
          <Icon size={20} color={color} />
        </View>
        <Typography variant="body" weight="600" color={color}>{label}</Typography>
      </View>
      {showChevron && <ChevronRight size={20} color="#CFD8DC" />}
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: '#F8FAFB', paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={24} color="#1B3C35" />
        </TouchableOpacity>
        <Typography variant="headline" weight="700" style={{ color: '#1B3C35' }}>Settings</Typography>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <Card style={styles.profileCard}>
          <TouchableOpacity 
            style={styles.profileInfo} 
            onPress={handlePickImage}
            activeOpacity={0.8}
          >
            <View style={styles.avatarContainer}>
              {userPhotoUri ? (
                <Image source={{ uri: userPhotoUri }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <User size={32} color="#4A5D4C" />
                </View>
              )}
              <View style={styles.cameraIconBadge}>
                <Camera size={12} color="#fff" />
              </View>
            </View>
            <View>
              <Typography variant="bodyLg" weight="700" color="#1B3C35">{userName}</Typography>
              <Typography variant="label" color="#607D8B">Managing {currentBaby?.name || 'Baby'}'s Hub</Typography>
            </View>
          </TouchableOpacity>
        </Card>

        {/* Account Section */}
        <View style={styles.section}>
          <Typography variant="label" weight="800" color="#90A4AE" style={styles.sectionTitle}>ACCOUNT & SECURITY</Typography>
          <Card style={styles.sectionCard}>
            <SettingItem icon={User} label="Profile Information" onPress={() => openControl('profile')} />
            <SettingItem icon={Bell} label="Notifications" onPress={() => openControl('notifications')} />
            <SettingItem icon={Shield} label="Privacy Settings" onPress={() => openControl('privacy')} />
          </Card>
        </View>

        {/* Info Section */}
        <View style={styles.section}>
          <Typography variant="label" weight="800" color="#90A4AE" style={styles.sectionTitle}>INFORMATION</Typography>
          <Card style={styles.sectionCard}>
            <SettingItem icon={FileText} label="Privacy Policy" onPress={() => openInfo('privacy')} />
            <SettingItem icon={FileText} label="Terms of Service" onPress={() => openInfo('terms')} />
            <SettingItem icon={Info} label="About Mummum" onPress={() => openInfo('about')} />
          </Card>
        </View>

        {/* Support Section */}
        <View style={styles.section}>
          <Typography variant="label" weight="800" color="#90A4AE" style={styles.sectionTitle}>SUPPORT</Typography>
          <Card style={styles.sectionCard}>
            <SettingItem icon={LifeBuoy} label="Help Center" onPress={() => openInfo('help')} />
            <SettingItem icon={Info} label="App Version 1.0.0" onPress={() => {}} showChevron={false} />
          </Card>
        </View>

        {/* Danger Zone */}
        <View style={styles.section}>
          <Typography variant="label" weight="800" color="#E57373" style={styles.sectionTitle}>DANGER ZONE</Typography>
          <Card style={styles.sectionCard}>
            <SettingItem icon={LogOut} label="Log Out" onPress={handleLogout} color="#E57373" />
            <SettingItem icon={Trash2} label="Delete Account" onPress={handleDeleteAccount} color="#E57373" />
          </Card>
        </View>

        <View style={styles.footer}>
          <Typography variant="label" color="#B0BEC5" style={{ textAlign: 'center' }}>
            Made with ❤️ for babies and parents everywhere
          </Typography>
          <Typography variant="label" color="#CFD8DC" style={{ marginTop: 4 }}>
            Version 1.0.0 (Production Build)
          </Typography>
        </View>
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
    padding: 20,
  },
  profileCard: {
    padding: 20,
    borderRadius: 24,
    marginBottom: 24,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatarContainer: {
    width: 60,
    height: 60,
    position: 'relative',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E8F1E9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraIconBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#4A5D4C',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    letterSpacing: 1.5,
    marginLeft: 8,
    marginBottom: 12,
  },
  sectionCard: {
    borderRadius: 24,
    overflow: 'hidden',
    padding: 8,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerText: {
    textAlign: 'center',
    marginTop: 20,
  }
});
