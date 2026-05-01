import { Text, TextProps, StyleSheet } from 'react-native';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

interface TypographyProps extends TextProps {
  variant?: 'display' | 'headline' | 'bodyLg' | 'bodyMd' | 'label';
  color?: string;
  weight?: '400' | '500' | '600' | '700' | '800';
  align?: 'left' | 'center' | 'right';
}

export default function Typography({ 
  variant = 'bodyMd', 
  color, 
  weight, 
  align,
  style, 
  ...props 
}: TypographyProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const themeColors = Colors[colorScheme];

  const variantStyle = styles[variant];
  const textColor = color || themeColors.text;

  return (
    <Text 
      style={[
        variantStyle, 
        { color: textColor }, 
        weight ? { fontWeight: weight } : null,
        align ? { textAlign: align } : null,
        style
      ]} 
      {...props} 
    />
  );
}

const styles = StyleSheet.create({
  display: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: '700',
    letterSpacing: -0.64,
  },
  headline: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '600',
    letterSpacing: -0.24,
  },
  bodyLg: {
    fontSize: 18,
    lineHeight: 28,
    fontWeight: '400',
  },
  bodyMd: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400',
  },
  label: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    letterSpacing: 0.26,
  },
});
