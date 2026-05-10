import React from 'react';
import { 
  StyleSheet, 
  View, 
  Modal, 
  TouchableOpacity, 
  Dimensions,
  Platform,
  Pressable
} from 'react-native';
import { BlurView } from 'expo-blur';
import Typography from './Typography';
import { Star, X, Zap } from 'lucide-react-native';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';

// Safety check for native module
const SafeBlurView = ({ children, ...props }: any) => {
  try {
    return <BlurView {...props}>{children}</BlurView>;
  } catch (e) {
    return <View style={[props.style, { backgroundColor: 'rgba(0,0,0,0.8)' }]}>{children}</View>;
  }
};

const { width, height } = Dimensions.get('window');

interface ProModalProps {
  visible: boolean;
  onClose: () => void;
  onUpgrade: () => void;
  title?: string;
  description?: string;
}

export default function ProModal({ 
  visible, 
  onClose, 
  onUpgrade, 
  title = "Unlock Clinical Pro", 
  description = "Get lifetime access to professional clinical reports, medical history tracking, and cloud sync." 
}: ProModalProps) {
  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose}>
          <SafeBlurView intensity={20} style={StyleSheet.absoluteFill} tint="dark" />
        </Pressable>

        <Animated.View 
          entering={ZoomIn.duration(400)} 
          style={styles.modalContainer}
        >
          {/* Header Icon */}
          <View style={styles.iconCircle}>
            <Star size={32} color="#fff" fill="#fff" />
          </View>

          {/* Close Button */}
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <X size={20} color="#CFD8DC" />
          </TouchableOpacity>

          {/* Content */}
          <View style={styles.content}>
            <View style={styles.badge}>
              <Zap size={12} color="#1B3C35" />
              <Typography variant="label" weight="900" color="#1B3C35" style={{ fontSize: 9, letterSpacing: 1 }}>
                PREMIUM CLINICAL FEATURE
              </Typography>
            </View>

            <Typography variant="headline" weight="800" color="#1B3C35" style={styles.title}>
              {title}
            </Typography>
            
            <Typography variant="body" color="#607D8B" align="center" style={styles.description}>
              {description}
            </Typography>

            {/* Benefits List (Mini) */}
            <View style={styles.benefitRow}>
              <View style={styles.dot} />
              <Typography variant="label" weight="700" color="#4A5D4C">Clinical PDF Reports</Typography>
            </View>
            <View style={styles.benefitRow}>
              <View style={styles.dot} />
              <Typography variant="label" weight="700" color="#4A5D4C">Secure Medical History</Typography>
            </View>
            <View style={styles.benefitRow}>
              <View style={styles.dot} />
              <Typography variant="label" weight="700" color="#4A5D4C">Unlimited Cloud Sync</Typography>
            </View>

            {/* Action Buttons */}
            <TouchableOpacity style={styles.upgradeBtn} onPress={onUpgrade}>
              <Typography variant="body" weight="800" color="#fff">Upgrade to Pro</Typography>
            </TouchableOpacity>

            <TouchableOpacity style={styles.laterBtn} onPress={onClose}>
              <Typography variant="label" weight="700" color="#B0BEC5">MAYBE LATER</Typography>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContainer: {
    width: width * 0.85,
    backgroundColor: '#fff',
    borderRadius: 32,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.2,
    shadowRadius: 30,
    elevation: 10,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#1B3C35',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -56,
    borderWidth: 4,
    borderColor: '#fff',
    shadowColor: '#1B3C35',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 8,
  },
  content: {
    alignItems: 'center',
    marginTop: 12,
    width: '100%',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F8E9',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    gap: 4,
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
    alignSelf: 'flex-start',
    marginLeft: 20,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#C69C82',
  },
  upgradeBtn: {
    width: '100%',
    height: 56,
    backgroundColor: '#1B3C35',
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    shadowColor: '#1B3C35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  laterBtn: {
    paddingVertical: 16,
    marginTop: 4,
  }
});
