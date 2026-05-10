import React from 'react';
import { 
  StyleSheet, 
  View, 
  Modal, 
  TouchableOpacity, 
  Dimensions,
  Pressable
} from 'react-native';
import { BlurView } from 'expo-blur';
import Typography from './Typography';
import { X, AlertCircle } from 'lucide-react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';

const SafeBlurView = ({ children, ...props }: any) => {
  try {
    return <BlurView {...props}>{children}</BlurView>;
  } catch (e) {
    return <View style={[props.style, { backgroundColor: 'rgba(0,0,0,0.8)' }]}>{children}</View>;
  }
};

const { width } = Dimensions.get('window');

interface ElegantModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onSecondary?: () => void;
  title: string;
  description: string;
  confirmText?: string;
  secondaryText?: string;
  cancelText?: string;
  isDestructive?: boolean;
}

export default function ElegantModal({ 
  visible, 
  onClose, 
  onConfirm,
  onSecondary,
  title, 
  description,
  confirmText = "Confirm",
  secondaryText,
  cancelText = "Cancel",
  isDestructive = false
}: ElegantModalProps) {
  if (!visible) return null;

  const hasSecondary = !!secondaryText && !!onSecondary;

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
          entering={ZoomIn.duration(300)} 
          style={styles.modalContainer}
        >
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <X size={20} color="#CFD8DC" />
          </TouchableOpacity>

          <View style={styles.content}>
            <View style={[styles.iconCircle, isDestructive && { backgroundColor: '#FFEBEE' }]}>
              <AlertCircle size={32} color={isDestructive ? '#F44336' : '#1B3C35'} />
            </View>

            <Typography variant="headline" weight="800" color="#1B3C35" style={styles.title}>
              {title}
            </Typography>
            
            <Typography variant="body" color="#607D8B" align="center" style={styles.description}>
              {description}
            </Typography>

            <View style={[styles.footer, hasSecondary && { flexDirection: 'column' }]}>
              <TouchableOpacity 
                style={[styles.confirmBtn, isDestructive && { backgroundColor: '#F44336' }, hasSecondary && { width: '100%', marginBottom: 12 }]} 
                onPress={onConfirm}
              >
                <Typography variant="body" weight="800" color="#fff">{confirmText}</Typography>
              </TouchableOpacity>

              {hasSecondary && (
                <TouchableOpacity 
                  style={[styles.secondaryBtn, { width: '100%', marginBottom: 12 }]} 
                  onPress={onSecondary}
                >
                  <Typography variant="body" weight="800" color="#1B3C35">{secondaryText}</Typography>
                </TouchableOpacity>
              )}

              <TouchableOpacity 
                style={[styles.cancelBtn, hasSecondary && { width: '100%', backgroundColor: 'transparent' }]} 
                onPress={onClose}
              >
                <Typography variant="body" weight="700" color="#B0BEC5">{cancelText}</Typography>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContainer: { width: width * 0.85, backgroundColor: '#fff', borderRadius: 32, padding: 24, alignItems: 'center' },
  closeBtn: { position: 'absolute', top: 16, right: 16, padding: 8 },
  content: { alignItems: 'center', width: '100%' },
  iconCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#F1F8E9', alignItems: 'center', justifyContent: 'center', marginBottom: 20, marginTop: 8 },
  title: { fontSize: 22, marginBottom: 12, textAlign: 'center' },
  description: { fontSize: 14, lineHeight: 20, marginBottom: 32, paddingHorizontal: 10 },
  footer: { flexDirection: 'row', width: '100%', gap: 12 },
  cancelBtn: { flex: 1, height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFB' },
  confirmBtn: { flex: 2, height: 56, backgroundColor: '#1B3C35', borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  secondaryBtn: { height: 56, backgroundColor: '#F1F8E9', borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
});
