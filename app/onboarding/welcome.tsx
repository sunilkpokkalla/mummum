import React from 'react';
import { StyleSheet, View, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import Typography from '@/components/Typography';
import { useBabyStore } from '@/store/useBabyStore';
import { Milk, Moon, Droplet, Check } from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

export default function WelcomeScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const themeColors = Colors[colorScheme];
  const { tempBaby, addBaby, completeOnboarding } = useBabyStore();

  const handleFinish = () => {
    router.push('/premium');
  };

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.delay(200).duration(800)}>
          <Typography variant="display" style={styles.title}>Welcome to Mummum</Typography>
          <Typography variant="bodyLg" color={themeColors.icon} style={styles.subtitle}>
            Ready to track {tempBaby.name}'s journey? Here's what you can do:
          </Typography>
        </Animated.View>

        <View style={styles.features}>
          <FeatureItem 
            icon={<Milk size={24} color={themeColors.primary} />}
            title="Log Feedings"
            description="Track breastfeeding, bottle sessions, and solids."
            delay={400}
          />
          <FeatureItem 
            icon={<Moon size={24} color={themeColors.secondary} />}
            title="Track Sleep"
            description="Monitor nap times and overnight sleep patterns."
            delay={600}
          />
          <FeatureItem 
            icon={<Droplet size={24} color={themeColors.tertiary} />}
            title="Diaper Log"
            description="Stay on top of changes and hydration."
            delay={800}
          />
        </View>

        <Animated.View entering={FadeInUp.delay(1000).duration(800)} style={styles.footer}>
          <TouchableOpacity 
            style={[styles.button, { backgroundColor: themeColors.primary }]}
            onPress={handleFinish}
          >
            <Typography weight="600" style={{ color: '#fff' }}>Get Started</Typography>
            <Check size={20} color="#fff" />
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

function FeatureItem({ icon, title, description, delay }: any) {
  const colorScheme = useColorScheme() ?? 'light';
  const themeColors = Colors[colorScheme];

  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(800)} style={[styles.featureItem, { backgroundColor: themeColors.surface }]}>
      <View style={styles.featureIcon}>{icon}</View>
      <View style={styles.featureText}>
        <Typography variant="bodyLg" weight="700">{title}</Typography>
        <Typography variant="label" color={themeColors.icon}>{description}</Typography>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 32,
    paddingTop: 80,
  },
  title: {
    fontSize: 36,
    lineHeight: 44,
    marginBottom: 12,
  },
  subtitle: {
    marginBottom: 48,
  },
  features: {
    gap: 20,
    marginBottom: 48,
  },
  featureItem: {
    flexDirection: 'row',
    padding: 20,
    borderRadius: 24,
    alignItems: 'center',
    gap: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  featureIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  featureText: {
    flex: 1,
    gap: 4,
  },
  footer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 48,
    borderRadius: 40,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
});
