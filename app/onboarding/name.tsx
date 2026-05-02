import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  TextInput, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform,
  TouchableWithoutFeedback,
  Keyboard
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import Typography from '@/components/Typography';
import { useBabyStore } from '@/store/useBabyStore';
import { ArrowRight, Baby as BabyIcon } from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

export default function BabyNameScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const themeColors = Colors[colorScheme];
  const { updateTempBaby, tempBaby } = useBabyStore();
  const [name, setName] = useState(tempBaby.name || '');

  const handleNext = () => {
    if (name.trim()) {
      updateTempBaby({ name: name.trim() });
      router.push('/onboarding/birthdate');
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: themeColors.background }]}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.content}>
          <Animated.View entering={FadeInDown.delay(200).duration(800)} style={styles.iconContainer}>
            <View style={[styles.iconCircle, { backgroundColor: themeColors.primary + '20' }]}>
              <BabyIcon size={40} color={themeColors.primary} />
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(400).duration(800)}>
            <Typography variant="display" style={styles.title}>What's your baby's name?</Typography>
            <Typography variant="bodyLg" color={themeColors.icon} style={styles.subtitle}>
              Let's personalize your experience.
            </Typography>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(600).duration(800)} style={styles.inputContainer}>
            <TextInput
              style={[
                styles.input, 
                { 
                  color: themeColors.text,
                  borderColor: themeColors.surfaceVariant,
                  backgroundColor: themeColors.surface
                }
              ]}
              placeholder="Baby's Name"
              placeholderTextColor={themeColors.icon}
              value={name}
              onChangeText={setName}
              autoFocus
              autoCapitalize="words"
            />
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(800).duration(800)} style={styles.footer}>
            <TouchableOpacity 
              style={[
                styles.button, 
                { 
                  backgroundColor: name.trim() ? themeColors.primary : themeColors.surfaceVariant,
                  opacity: name.trim() ? 1 : 0.6
                }
              ]}
              onPress={handleNext}
              disabled={!name.trim()}
            >
              <Typography weight="600" style={{ color: '#fff' }}>Next</Typography>
              <ArrowRight size={20} color="#fff" />
            </TouchableOpacity>
          </Animated.View>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 32,
    justifyContent: 'center',
  },
  iconContainer: {
    marginBottom: 32,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    lineHeight: 40,
    marginBottom: 12,
  },
  subtitle: {
    marginBottom: 40,
  },
  inputContainer: {
    marginBottom: 40,
  },
  input: {
    height: 64,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 20,
    fontSize: 20,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'flex-end',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 32,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
});
