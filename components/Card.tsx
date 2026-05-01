import { View, ViewProps, StyleSheet } from 'react-native';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

interface CardProps extends ViewProps {
  elevation?: number;
  accentColor?: string;
}

export default function Card({ elevation = 1, accentColor, style, children, ...props }: CardProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const themeColors = Colors[colorScheme];

  return (
    <View 
      style={[
        styles.card, 
        { 
          backgroundColor: themeColors.surface,
          borderColor: themeColors.surfaceVariant,
          shadowColor: '#000',
        },
        accentColor ? { borderLeftWidth: 4, borderLeftColor: accentColor } : null,
        elevation === 1 ? styles.shadow1 : styles.shadow2,
        style
      ]} 
      {...props}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
  },
  shadow1: {
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 20,
    elevation: 2,
  },
  shadow2: {
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 4,
  },
});
