import { TouchableOpacity, TouchableOpacityProps, StyleSheet, ActivityIndicator } from 'react-native';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import Typography from './Typography';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'tertiary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export function Button({ 
  title, 
  variant = 'primary', 
  size = 'md', 
  loading, 
  style, 
  disabled, 
  ...props 
}: ButtonProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const themeColors = (Colors as any)[colorScheme];

  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return { 
          container: { backgroundColor: themeColors.primary },
          text: { color: '#ffffff' }
        };
      case 'secondary':
        return { 
          container: { backgroundColor: themeColors.secondary },
          text: { color: '#ffffff' }
        };
      case 'tertiary':
        return { 
          container: { backgroundColor: themeColors.tertiary },
          text: { color: '#ffffff' }
        };
      case 'ghost':
        return { 
          container: { backgroundColor: 'transparent' },
          text: { color: themeColors.primary }
        };
      default:
        return { 
          container: { backgroundColor: themeColors.primary },
          text: { color: '#ffffff' }
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20 };
      case 'md':
        return { paddingVertical: 12, paddingHorizontal: 24, borderRadius: 28 };
      case 'lg':
        return { paddingVertical: 16, paddingHorizontal: 32, borderRadius: 32 };
    }
  };

  const { container, text } = getVariantStyles();
  const sizeStyle = getSizeStyles();

  return (
    <TouchableOpacity 
      style={[
        styles.base, 
        container, 
        sizeStyle, 
        disabled && { opacity: 0.5 },
        style
      ]} 
      disabled={disabled || loading}
      activeOpacity={0.8}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={text.color} size="small" />
      ) : (
        <Typography 
          variant="label" 
          style={[styles.text, text]}
        >
          {title}
        </Typography>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  text: {
    fontWeight: '600',
  },
});
