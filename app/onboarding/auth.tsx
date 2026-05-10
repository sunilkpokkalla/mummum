import ElegantModal from '@/components/ElegantModal';
import Typography from '@/components/Typography';
import { useBabyStore } from '@/store/useBabyStore';
import auth from '@react-native-firebase/auth';
import * as AppleAuthentication from 'expo-apple-authentication';
import { useRouter } from 'expo-router';
import { Apple, ChevronRight, Cloud, Mail, Shield, X } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  NativeModules,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { sha256 } from 'js-sha256';
import * as Crypto from 'expo-crypto';

// Safe Native Module Discovery
let GoogleSignin: any = null;
try {
  // We only require the module if it's actually registered in the native binary
  if (NativeModules.RNGoogleSignin || NativeModules.RNGoogleSigninModule) {
    GoogleSignin = require('@react-native-google-signin/google-signin').GoogleSignin;
  }
} catch (e) {
  // Safe Fallback: RNGoogleSignin native module not found
}

// Note: Replace with your actual Web Client ID from Firebase Console
const GOOGLE_WEB_CLIENT_ID = '944867470720-h7d30nai7d1ktod685pk3jk0fl1qm8cv.apps.googleusercontent.com';

export default function OnboardingAuthScreen() {
  const router = useRouter();
  const { tempBaby, addBaby, setCurrentBaby, resetStore, babies, completeOnboarding, pullFromCloud } = useBabyStore();
  const [loading, setLoading] = useState(false);
  const [showEmailInput, setShowEmailInput] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    visible: false,
    title: '',
    desc: '',
    confirmText: 'OK',
    onConfirm: () => setModalConfig(prev => ({ ...prev, visible: false }))
  });

  const handleEmailAuth = async () => {
    if (!email || !password) {
      setModalConfig({
        visible: true,
        title: "Missing Information",
        desc: "Please enter both your email and password to continue.",
        confirmText: "OK",
        onConfirm: () => setModalConfig(prev => ({ ...prev, visible: false }))
      });
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        await auth().createUserWithEmailAndPassword(email, password);
      } else {
        await auth().signInWithEmailAndPassword(email, password);
      }
      await handlePostLoginSync();
    } catch (e: any) {
      setLoading(false);
      let title = "Authentication Issue";
      let desc = e.message || "We encountered a problem. Please try again.";

      if (e.code === 'auth/email-already-in-use') {
        title = "Account Exists";
        desc = "This email is already registered. Please try logging in instead.";
      } else if (e.code === 'auth/wrong-password' || e.code === 'auth/invalid-credential') {
        title = "Incorrect Details";
        desc = "The password you entered is incorrect. Please try again or reset your password.";
      } else if (e.code === 'auth/user-not-found') {
        title = "User Not Found";
        desc = "No account found with this email. Would you like to sign up?";
      } else if (e.code === 'auth/invalid-email') {
        title = "Invalid Email";
        desc = "Please enter a valid email address.";
      } else if (e.code === 'auth/network-request-failed') {
        title = "Connection Problem";
        desc = "Please check your internet connection and try again.";
      } else if (e.code === 'auth/too-many-requests') {
        title = "Too Many Attempts";
        desc = "Too many failed login attempts. Please try again later.";
      }
 
      setModalConfig({
        visible: true,
        title,
        desc,
        confirmText: "OK",
        onConfirm: () => setModalConfig(prev => ({ ...prev, visible: false }))
      });
    }
  };

  const handlePostLoginSync = async () => {
    try {
      await pullFromCloud(); // DOWNLOAD CLOUD DATA
      
      // REUNION SYNC LOGIC
      const cloudBabies = useBabyStore.getState().babies;
      const hasNewInfo = !!tempBaby.name;

      if (cloudBabies.length > 0 && hasNewInfo) {
        // CONFLICT DETECTED: Show Choice Modal
        setModalConfig({
          visible: true,
          title: "Existing Records Found",
          desc: `We found clinical records for ${cloudBabies[0].name} in your account. \n\nDo you want to restore these records, or clear them and start fresh with ${tempBaby.name}?`,
          confirmText: "Restore Legacy",
          onConfirm: () => {
            // OPTION A: Keep Cloud Data
            setModalConfig(prev => ({ ...prev, visible: false }));
            const targetId = cloudBabies[0]?.id;
            if (targetId) {
              setCurrentBaby(targetId);
              completeOnboarding();
              setLoading(false);
              
              // Temporal Buffer to prevent dashboard race-condition crash
              setTimeout(() => {
                router.replace('/(tabs)');
              }, 100);
            } else {
              setLoading(false);
              router.replace('/(tabs)');
            }
          },
          secondaryText: "Start Fresh",
          onSecondary: () => {
            // OPTION B: Use New Info, Clear Cloud locally
            setModalConfig(prev => ({ ...prev, visible: false }));
            resetStore(); // Clear pulled cloud data
            
            const id = Math.random().toString(36).substring(7);
            const newBaby = {
              id,
              name: tempBaby.name || 'My Baby',
              birthDate: tempBaby.birthDate || new Date(),
            };
            addBaby(newBaby);
            setCurrentBaby(id);
            completeOnboarding();
            setLoading(false);
            
            // Temporal Buffer
            setTimeout(() => {
              router.replace('/(tabs)');
            }, 100);
          }
        });
        return; // Wait for user choice
      }

      // NO CONFLICT: Normal Flow
      let targetBabyId = cloudBabies[0]?.id;

      if (!targetBabyId) {
        const id = Math.random().toString(36).substring(7);
        const newBaby = {
          id,
          name: tempBaby.name || 'My Baby',
          birthDate: tempBaby.birthDate || new Date(),
        };
        addBaby(newBaby);
        targetBabyId = id;
      }

      setCurrentBaby(targetBabyId);
      completeOnboarding();
      setLoading(false);
      
      // Temporal Buffer for state propagation
      setTimeout(() => {
        router.replace('/(tabs)');
      }, 100);
    } catch (e) {
      console.error('[Sync]: Post-login sync failed', e);
      setLoading(false);
      router.replace('/(tabs)'); // Fallback
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setModalConfig({
        visible: true,
        title: "Email Required",
        desc: "Please enter your email address to receive a password reset link.",
        confirmText: "OK",
        onConfirm: () => setModalConfig(prev => ({ ...prev, visible: false }))
      });
      return;
    }

    try {
      await auth().sendPasswordResetEmail(email);
      setModalConfig({
        visible: true,
        title: "Reset Link Sent",
        desc: `A password reset link has been sent to ${email}. Please check your inbox and follow the instructions.`,
        confirmText: "Got it",
        onConfirm: () => setModalConfig(prev => ({ ...prev, visible: false }))
      });
    } catch (e: any) {
      setModalConfig({
        visible: true,
        title: "Reset Failed",
        desc: e.message || "We couldn't send the reset link. Please verify your email and try again.",
        confirmText: "OK",
        onConfirm: () => setModalConfig(prev => ({ ...prev, visible: false }))
      });
    }
  };

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
    setModalConfig({
      visible: true,
      title: "Continue as Guest?",
      desc: "Without an account, your data is stored only on this device. Create an account later to enable Cloud Sync and ensure your records are never lost.",
      confirmText: "Continue as Guest",
      onConfirm: () => {
        setModalConfig(prev => ({ ...prev, visible: false }));
        const id = Math.random().toString(36).substring(7);
        addBaby({
          id,
          name: tempBaby.name || 'Baby',
          birthDate: tempBaby.birthDate || new Date(),
        });
        setCurrentBaby(id);
        router.push('/onboarding/welcome');
      }
    });
  };

  const handleSocialLogin = async (provider: 'google' | 'apple') => {
    setLoading(true);
    try {
      let firebaseUser = null;

      if (provider === 'google') {
        if (!GoogleSignin) {
          setModalConfig({
            visible: true,
            title: "Coming Soon",
            desc: "Google Sign-In is being optimized for this version. Please use Apple Sign-In or Continue as Guest for now.",
            confirmText: "OK",
            onConfirm: () => setModalConfig(prev => ({ ...prev, visible: false }))
          });
          setLoading(false);
          return;
        }

        if (Platform.OS === 'android') {
          await GoogleSignin.hasPlayServices();
        }

        const userInfo = await GoogleSignin.signIn();
        const { idToken } = await GoogleSignin.getTokens();

        if (!idToken) {
          throw new Error('Google Sign-In failed: No ID token');
        }

        const googleCredential = auth.GoogleAuthProvider.credential(idToken);
        const userCredential = await auth().signInWithCredential(googleCredential);
        firebaseUser = userCredential.user;
      } else if (provider === 'apple') {
        const isAppleAvailable = await AppleAuthentication.isAvailableAsync();
        if (!isAppleAvailable) {
          throw new Error('Apple Authentication not project-wide available on this device.');
        }

        const rawNonce = Math.random().toString(36).substring(2) + Date.now().toString();
        const hashedNonce = sha256(rawNonce);

        const appleCredentialResult = await AppleAuthentication.signInAsync({
          requestedScopes: [
            AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
            AppleAuthentication.AppleAuthenticationScope.EMAIL,
          ],
          nonce: hashedNonce,
        });

        const { identityToken } = appleCredentialResult;
        if (!identityToken) {
          throw new Error('Apple Sign-In failed: No Identity Token returned.');
        }

        const credential = auth.AppleAuthProvider.credential(identityToken, rawNonce);
        const userCredential = await auth().signInWithCredential(credential);
        firebaseUser = userCredential.user;
      }

      if (firebaseUser) {
        await handlePostLoginSync();
      }
    } catch (e: any) {
      setLoading(false);

      // DIAGNOSTIC LOGGING
      console.log('--- SOCIAL AUTH ERROR ---');
      console.log('Provider:', provider);
      console.log('Code:', e.code);
      console.log('Message:', e.message);
      console.log('-------------------------');

      const isCancel =
        e.code === 'auth/user-cancelled' ||
        e.code === 'auth/cancelled' ||
        e.code === '1001' ||
        e.code === 'SIGN_IN_CANCELLED' ||
        e.code === 'ERR_REQUEST_CANCELED';

      if (isCancel) return;

      setModalConfig({
        visible: true,
        title: "Authentication Issue",
        desc: `We couldn't connect your ${provider} account. (Error: ${e.code || 'Internal'})\n\nPlease check your internet and try again.`,
        confirmText: "Try Again",
        onConfirm: () => setModalConfig(prev => ({ ...prev, visible: false }))
      });
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Background Decor */}
      <View style={styles.decorCircle} />

      {/* Close Button for Guest Users escaping to Dashboard */}
      <TouchableOpacity 
        style={styles.closeButton} 
        onPress={() => router.back()}
      >
        <X size={24} color="#4A5D4C" />
      </TouchableOpacity>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
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

              {showEmailInput ? (
                <Animated.View entering={FadeInDown} style={styles.emailInputContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your email"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                  />
                  <TouchableOpacity
                    style={[styles.authButton, styles.emailSubmitButton]}
                    onPress={handleEmailAuth}
                  >
                    <Typography variant="body" weight="700" color="#fff">
                      {isSignUp ? 'Create Clinical Account' : 'Login to My Records'}
                    </Typography>
                  </TouchableOpacity>

                  <View style={styles.emailFooter}>
                    <TouchableOpacity onPress={() => setIsSignUp(!isSignUp)}>
                      <Typography variant="label" weight="700" color="#4A5D4C">
                        {isSignUp ? 'Already have an account? Login' : "Don't have an account? Sign Up"}
                      </Typography>
                    </TouchableOpacity>

                    {!isSignUp && (
                      <TouchableOpacity onPress={handleForgotPassword}>
                        <Typography variant="label" weight="600" color="#90A4AE">Forgot Password?</Typography>
                      </TouchableOpacity>
                    )}
                  </View>

                  <TouchableOpacity
                    onPress={() => setShowEmailInput(false)}
                    style={styles.cancelButton}
                  >
                    <Typography variant="label" color="#B0BEC5">Back to Options</Typography>
                  </TouchableOpacity>
                </Animated.View>
              ) : (
                <TouchableOpacity
                  style={[styles.authButton, styles.emailButton]}
                  onPress={() => setShowEmailInput(true)}
                >
                  <Mail size={22} color="#4A5D4C" />
                  <Typography variant="body" weight="700" color="#4A5D4C">Continue with Email</Typography>
                </TouchableOpacity>
              )}
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

        <ElegantModal
          visible={modalConfig.visible}
          onClose={() => setModalConfig(prev => ({ ...prev, visible: false }))}
          onConfirm={modalConfig.onConfirm}
          title={modalConfig.title}
          description={modalConfig.desc}
          confirmText={modalConfig.confirmText}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  closeButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    zIndex: 100,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
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
  scrollContent: {
    flexGrow: 1,
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
  emailFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
    marginTop: 8,
    marginBottom: 16,
  },
  emailInputContainer: {
    gap: 12,
  },
  input: {
    height: 60,
    backgroundColor: '#F5F7F8',
    borderRadius: 16,
    paddingHorizontal: 20,
    fontSize: 16,
    color: '#1B3C35',
  },
  emailSubmitButton: {
    backgroundColor: '#4A5D4C',
    borderColor: '#4A5D4C',
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: 8,
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
