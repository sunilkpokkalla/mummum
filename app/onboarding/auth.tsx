import Typography from '@/components/Typography';
import { useBabyStore } from '@/store/useBabyStore';
import auth from '@react-native-firebase/auth';
import * as AppleAuthentication from 'expo-apple-authentication';
import { useRouter } from 'expo-router';
import { Apple, ChevronRight, Cloud, Mail, Shield } from 'lucide-react-native';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, NativeModules, StyleSheet, TouchableOpacity, View } from 'react-native';

// Safe Native Module Discovery
let GoogleSignin: any = null;
try {
  // We only require the module if it's actually registered in the native binary
  if (NativeModules.RNGoogleSignin || NativeModules.RNGoogleSigninModule) {
    GoogleSignin = require('@react-native-google-signin/google-signin').GoogleSignin;
  }
} catch (e) {
  console.warn('RNGoogleSignin native module not found. Google login will be project-wide disabled.');
}

// Note: Replace with your actual Web Client ID from Firebase Console
const GOOGLE_WEB_CLIENT_ID = '944867470720-h7d30nai7d1ktod685pk3jk0fl1qm8cv.apps.googleusercontent.com';

export default function OnboardingAuthScreen() {
  const router = useRouter();
  const { tempBaby, addBaby, setCurrentBaby, resetStore, babies, completeOnboarding } = useBabyStore();
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (GoogleSignin) {
      try {
        GoogleSignin.configure({
          webClientId: GOOGLE_WEB_CLIENT_ID,
          offlineAccess: true,
        });
      } catch (e) {
        console.error('GoogleSignin configuration failed:', e);
      }
    }
  }, []);

  const handleGuestAccess = () => {
    Alert.alert(
      "Guest Access",
      "You can skip registration for now, but creating an account later is recommended to ensure your clinical data and Pro purchases can be restored if you change devices.",
      [
        {
          text: "Continue as Guest",
          onPress: () => {
            const id = Math.random().toString(36).substring(7);
            addBaby({
              id,
              name: tempBaby.name || 'Baby',
              birthDate: tempBaby.birthDate || new Date(),
            });
            setCurrentBaby(id);
            router.push('/onboarding/welcome');
          }
        }
      ]
    );
  };

  const handleSocialLogin = async (provider: 'google' | 'apple') => {
    setLoading(true);
    try {
      let firebaseUser = null;

      if (provider === 'google') {
        if (!GoogleSignin) {
          Alert.alert(
            "Configuration Notice",
            "Google Sign-In is not currently available in this version. Please use Apple Sign-In or Continue as Guest.",
            [{ text: "OK" }]
          );
          setLoading(false);
          return;
        }
        await GoogleSignin.hasPlayServices();
        const { idToken } = await GoogleSignin.signIn();
        const googleCredential = auth.GoogleAuthProvider.credential(idToken);
        const userCredential = await auth().signInWithCredential(googleCredential);
        firebaseUser = userCredential.user;
      } else if (provider === 'apple') {
        const isAppleAvailable = await AppleAuthentication.isAvailableAsync();
        if (!isAppleAvailable) {
          throw new Error('Apple Authentication not project-wide available on this device.');
        }
        const appleCredential = await AppleAuthentication.signInAsync({
          requestedScopes: [
            AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
            AppleAuthentication.AppleAuthenticationScope.EMAIL,
          ],
        });
        const { identityToken } = appleCredential;
        if (identityToken) {
          const provider = new auth.AppleAuthProvider();
          const credential = provider.credential(identityToken);
          const userCredential = await auth().signInWithCredential(credential);
          firebaseUser = userCredential.user;
        }
      }

      // Sync with Baby Store
      const babyId = firebaseUser?.uid || Math.random().toString(36).substring(7);
      addBaby({
        id: babyId,
        name: tempBaby.name || 'Baby',
        birthDate: tempBaby.birthDate || new Date(),
      });
      setCurrentBaby(babyId);

      setLoading(false);

      // If they are a returning user with babies, mark as onboarded immediately
      if (babies.length > 0) {
        completeOnboarding();
        router.replace('/(tabs)');
      } else {
        router.push('/onboarding/welcome');
      }
    } catch (e: any) {
      setLoading(false);

      // SILENTLY ignore user cancellations
      const isCancel = e.code === 'auth/user-cancelled' ||
        e.code === 'auth/cancelled' ||
        e.code === '1001' ||
        e.code === 'SIGN_IN_CANCELLED' ||
        e.message?.includes('authorization attempt failed');

      if (isCancel) {
        console.log('[Auth Silent]: User cancelled sign-in flow.');
        return;
      }

      // TECHNICAL DIAGNOSTIC
      console.log('--- AUTH ERROR ---');
      console.log('Code:', e.code);
      console.log('Message:', e.message);
      console.log('Stack:', e.stack);
      console.log('------------------');

      Alert.alert(
        "Authentication Issue",
        `Technical Error: ${e.code}\n\nMessage: ${e.message}\n\nPlease check your Firebase project settings.`,
        [
          { text: "Try Again", onPress: () => { } },
          { text: "Continue Locally", onPress: handleGuestAccess, style: 'cancel' }
        ]
      );
    }
  };

  return (
    <View style={styles.container}>
      {/* Background Decor */}
      <View style={styles.decorCircle} />

      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Shield size={32} color="#4A5D4C" />
          </View>
          <Typography variant="display" style={styles.title}>Secure {tempBaby.name || 'Baby'}'s History</Typography>
          <Typography variant="bodyLg" color="#607D8B" style={styles.subtitle}>
            Create an account to sync clinical records across devices and ensure your data is never lost.
          </Typography>
        </View>

        <View style={styles.featureList}>
          <View style={styles.featureItem}>
            <Cloud size={20} color="#89A08B" />
            <Typography variant="body" color="#455A64">Encrypted Cloud Backup</Typography>
          </View>
          <View style={styles.featureItem}>
            <Shield size={20} color="#89A08B" />
            <Typography variant="body" color="#455A64">Cross-Device Syncing</Typography>
          </View>
        </View>

        <View style={styles.authContainer}>
          {loading ? (
            <ActivityIndicator size="large" color="#4A5D4C" style={{ marginVertical: 40 }} />
          ) : (
            <>
              <TouchableOpacity
                style={[styles.authButton, styles.appleButton]}
                onPress={() => handleSocialLogin('apple')}
              >
                <Apple size={22} color="#fff" fill="#fff" />
                <Typography variant="body" weight="700" color="#fff">Continue with Apple</Typography>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.authButton, styles.googleButton]}
                onPress={() => handleSocialLogin('google')}
              >
                <View style={styles.googleIcon}>
                  <Typography variant="label" weight="800" color="#4285F4">G</Typography>
                </View>
                <Typography variant="body" weight="700" color="#455A64">Continue with Google</Typography>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.authButton, styles.emailButton]}
                onPress={() => { }}
              >
                <Mail size={22} color="#4A5D4C" />
                <Typography variant="body" weight="700" color="#4A5D4C">Continue with Email</Typography>
              </TouchableOpacity>
            </>
          )}
        </View>

        <View style={styles.footer}>
          {babies.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                resetStore();
                router.push('/onboarding/name');
              }}
              style={styles.switchButton}
            >
              <Typography variant="body" weight="600" color="#E57373">Not {tempBaby.name || 'Your'} Baby? Switch Account</Typography>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={handleGuestAccess} style={styles.guestButton}>
            <Typography variant="body" weight="600" color="#90A4AE">Continue as Guest</Typography>
            <ChevronRight size={18} color="#90A4AE" />
          </TouchableOpacity>
          <Typography variant="label" color="#B0BEC5" style={styles.termsText}>
            By continuing, you agree to Mummum's Terms and Clinical Data Privacy Policy.
          </Typography>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  decorCircle: {
    position: 'absolute',
    top: -100,
    right: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: '#E8F1E9',
    opacity: 0.5,
  },
  content: {
    flex: 1,
    padding: 32,
    paddingTop: 100,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    gap: 16,
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#E8F1E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 32,
    textAlign: 'center',
    color: '#1B3C35',
  },
  subtitle: {
    textAlign: 'center',
    lineHeight: 24,
  },
  featureList: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12,
    marginVertical: 24,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  authContainer: {
    gap: 16,
  },
  authButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    height: 64,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  appleButton: {
    backgroundColor: '#000',
    borderColor: '#000',
  },
  googleButton: {
    backgroundColor: '#fff',
  },
  googleIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emailButton: {
    backgroundColor: '#F8FAFB',
    borderStyle: 'dashed',
  },
  footer: {
    alignItems: 'center',
    gap: 20,
  },
  guestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 12,
  },
  switchButton: {
    paddingVertical: 12,
    marginBottom: 8,
  },
  termsText: {
    textAlign: 'center',
    fontSize: 12,
    paddingHorizontal: 20,
  }
});
