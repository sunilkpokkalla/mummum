import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Pressable, TouchableOpacity, ScrollView, Image, TextInput, Dimensions, PanResponder, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import Typography from '@/components/Typography';
import Card from '@/components/Card';
import { ArrowLeft, ChevronRight, Minus, Plus, Calendar } from 'lucide-react-native';
import { useBabyStore } from '@/store/useBabyStore';
import { format } from 'date-fns';
import DateTimePicker from '@/components/DateTimePicker';

const { width } = Dimensions.get('window');
const SLIDER_WIDTH = width - 80;

export default function FeedLogScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? 'light';
  const themeColors = Colors[colorScheme];
  const { addActivity, activeSessions, startSession, stopSession, babies, currentBabyId } = useBabyStore();
  const currentBaby = babies.find(b => b.id === currentBabyId);

  const [mode, setMode] = useState<'Breast' | 'Bottle' | 'Pump'>('Breast');
  const [unit, setUnit] = useState<'oz' | 'ml'>('oz');
  const [amount, setAmount] = useState(4.5);
  const [content, setContent] = useState('Breast Milk');
  const [notes, setNotes] = useState('');

  const getBabyAge = (birthDate: Date | string | undefined) => {
    if (!birthDate) return '';
    const birth = new Date(birthDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - birth.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const diffMonths = Math.floor(diffDays / 30);
    
    if (diffMonths > 0) return `${diffMonths} months old`;
    return `${diffDays} days old`;
  };

  // Interactive Slider logic
  const maxAmount = unit === 'oz' ? 10 : 300;
  const step = unit === 'oz' ? 0.5 : 5;

  const panResponder = React.useMemo(
    () => PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (evt, gestureState) => {
        const x = Math.max(0, Math.min(gestureState.moveX - 44, SLIDER_WIDTH));
        const percentage = x / SLIDER_WIDTH;
        const rawValue = percentage * maxAmount;
        const steppedValue = Math.round(rawValue / step) * step;
        setAmount(Number(steppedValue.toFixed(1)));
      },
    }),
    [unit, maxAmount, step]
  );

  const sliderFillWidth = (amount / maxAmount) * 100;

  // Timers for Left and Right
  const activeFeed = activeSessions.find(s => s.type === 'feed' && s.babyId === currentBabyId);
  const [leftTimer, setLeftTimer] = useState((activeFeed?.details as any)?.accumulatedLeft || 0);
  const [rightTimer, setRightTimer] = useState((activeFeed?.details as any)?.accumulatedRight || 0);
  const [activeSide, setActiveSide] = useState<'L' | 'R' | null>((activeFeed as any)?.side || null);

  useEffect(() => {
    let interval: any = null;
    if (activeSide && activeFeed) {
      interval = setInterval(() => {
        const start = new Date(activeFeed.startTime).getTime();
        const now = Date.now();
        const currentElapsed = Math.floor((now - start) / 1000);
        
        if (activeSide === 'L') {
          setLeftTimer(((activeFeed.details as any)?.accumulatedLeft || 0) + currentElapsed);
          setRightTimer((activeFeed.details as any)?.accumulatedRight || 0);
        } else {
          setRightTimer(((activeFeed.details as any)?.accumulatedRight || 0) + currentElapsed);
          setLeftTimer((activeFeed.details as any)?.accumulatedLeft || 0);
        }
      }, 1000);
    } else {
      // Sync local state when paused
      setLeftTimer((activeFeed?.details as any)?.accumulatedLeft || 0);
      setRightTimer((activeFeed?.details as any)?.accumulatedRight || 0);
    }
    return () => clearInterval(interval);
  }, [activeSide, activeFeed]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSave = () => {
    addActivity({
      type: 'feed',
      timestamp: new Date(),
      details: {
        feedMode: mode,
        amount: mode !== 'Breast' ? amount : undefined,
        unit: mode !== 'Breast' ? unit : undefined,
        content: mode !== 'Breast' ? content : undefined,
        leftDuration: leftTimer,
        rightDuration: rightTimer,
        notes: notes
      },
    });
    stopSession('feed');
    router.replace('/(tabs)');
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <View style={[styles.container, { backgroundColor: '#F8FAFB' }]}>
        {/* Header */}
        <View style={[styles.header, { justifyContent: 'center' }]}>
          <View style={{ alignItems: 'center' }}>
            <Typography variant="headline" weight="700" style={{ color: '#4A5D4C' }}>Log Feed</Typography>
            <Typography variant="label" color="#607D8B">{currentBaby?.name || 'Baby'} • {getBabyAge(currentBaby?.birthDate)}</Typography>
          </View>
          <Image 
            source={currentBaby?.photoUri ? { uri: currentBaby.photoUri } : require('@/assets/images/baby_avatar.png')} 
            style={[styles.avatar, { position: 'absolute', right: 20 }]} 
          />
        </View>

          <ScrollView 
            contentContainerStyle={styles.content} 
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Top Tabs */}
            <View style={styles.tabContainer}>
              {['Breast', 'Bottle', 'Pump'].map((t) => (
                <TouchableOpacity 
                  key={t}
                  style={[styles.tab, mode === t ? { backgroundColor: '#C69C82' } : { backgroundColor: '#F2F5F6' }]}
                  onPress={() => {
                    setMode(t as any);
                    if (t === 'Pump') setAmount(unit === 'oz' ? 4.0 : 120);
                  }}
                >
                  <Typography weight="600" style={{ color: mode === t ? '#fff' : '#607D8B' }}>{t}</Typography>
                </TouchableOpacity>
              ))}
            </View>

            {/* Breastfeeding Section */}
            {mode === 'Breast' && (
              <Card style={styles.sectionCard}>
                <View style={styles.sectionHeader}>
                  <Typography variant="bodyLg" weight="600" color="#607D8B">Breastfeeding</Typography>
                </View>

                <View style={styles.sideBySide}>
                  {/* Left Side */}
                  <View style={styles.sideCard}>
                    <Typography variant="label" weight="700" color="#8D6E63" style={{ marginBottom: 12 }}>LEFT</Typography>
                    <View style={styles.timerCircle}>
                      <View style={[styles.progressRingBase, { borderColor: '#FFE0B2' }]} />
                      <View style={[styles.progressRing, { 
                        borderTopColor: activeSide === 'L' ? '#C69C82' : '#FFE0B2',
                        borderRightColor: activeSide === 'L' ? '#C69C82' : '#FFE0B2',
                        transform: [{ rotate: `${(leftTimer % 60) * 6}deg` }] 
                      }]} />
                      <View style={styles.nipple} />
                      <Typography weight="800" style={styles.timerText}>{formatTime(leftTimer)}</Typography>
                    </View>
                    <TouchableOpacity 
                      style={[styles.timerButton, activeSide === 'L' ? { backgroundColor: '#C69C82' } : { backgroundColor: '#FBE9E7' }]}
                      onPress={() => {
                        const newSide = activeSide === 'L' ? null : 'L';
                        setActiveSide(newSide);
                        
                        // Production Hardening: Stop existing session first to prevent duplicates
                        stopSession('feed');
                        
                        if (newSide) {
                          startSession({ 
                            babyId: currentBabyId || '', 
                            type: 'feed', 
                            startTime: new Date(), 
                            side: newSide as any,
                            details: {
                              accumulatedLeft: leftTimer,
                              accumulatedRight: rightTimer
                            }
                          });
                        }
                      }}
                    >
                      <Typography weight="700" style={{ color: activeSide === 'L' ? '#fff' : '#8D6E63' }}>
                        {activeSide === 'L' ? 'Pause' : 'Start'}
                      </Typography>
                    </TouchableOpacity>
                  </View>
 
                  {/* Right Side */}
                  <View style={styles.sideCard}>
                    <Typography variant="label" weight="700" color="#8D6E63" style={{ marginBottom: 12 }}>RIGHT</Typography>
                    <View style={styles.timerCircle}>
                      <View style={[styles.progressRingBase, { borderColor: '#FFE0B2' }]} />
                      <View style={[styles.progressRing, { 
                        borderTopColor: activeSide === 'R' ? '#C69C82' : '#FFE0B2',
                        borderRightColor: activeSide === 'R' ? '#C69C82' : '#FFE0B2',
                        transform: [{ rotate: `${(rightTimer % 60) * 6}deg` }] 
                      }]} />
                      <View style={styles.nipple} />
                      <Typography weight="800" style={styles.timerText}>{formatTime(rightTimer)}</Typography>
                    </View>
                    <TouchableOpacity 
                      style={[styles.timerButton, activeSide === 'R' ? { backgroundColor: '#C69C82' } : { backgroundColor: '#FBE9E7' }]}
                      onPress={() => {
                        const newSide = activeSide === 'R' ? null : 'R';
                        setActiveSide(newSide);
                        
                        // Production Hardening: Stop existing session first to prevent duplicates
                        stopSession('feed');
                        
                        if (newSide) {
                          startSession({ 
                            babyId: currentBabyId || '', 
                            type: 'feed', 
                            startTime: new Date(), 
                            side: newSide as any,
                            details: {
                              accumulatedLeft: leftTimer,
                              accumulatedRight: rightTimer
                            }
                          });
                        }
                      }}
                    >
                      <Typography weight="700" style={{ color: activeSide === 'R' ? '#fff' : '#8D6E63' }}>
                        {activeSide === 'R' ? 'Pause' : 'Start'}
                      </Typography>
                    </TouchableOpacity>
                  </View>
                </View>
              </Card>
            )}

            {/* Bottle/Pump Details Section */}
            {mode !== 'Breast' && (
              <Card style={styles.sectionCard}>
                <View style={styles.sectionHeader}>
                  <Typography variant="bodyLg" weight="600" color="#455A64">
                    {mode === 'Bottle' ? 'Bottle Details' : 'Pump Details'}
                  </Typography>
                  <View style={styles.unitToggle}>
                    <TouchableOpacity 
                      style={[styles.unitBtn, unit === 'oz' && styles.unitBtnActive]} 
                      onPress={() => {
                        setUnit('oz');
                        setAmount(Math.round(amount / 30 * 2) / 2);
                      }}
                    >
                      <Typography variant="label" weight="600" color={unit === 'oz' ? '#1A1A1A' : '#607D8B'}>oz</Typography>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.unitBtn, unit === 'ml' && styles.unitBtnActive]} 
                      onPress={() => {
                        setUnit('ml');
                        setAmount(Math.round(amount * 30));
                      }}
                    >
                      <Typography variant="label" weight="600" color={unit === 'ml' ? '#1A1A1A' : '#607D8B'}>ml</Typography>
                    </TouchableOpacity>
                  </View>
                </View>

                <Typography variant="label" weight="600" color="#607D8B" style={{ marginTop: 16 }}>Amount</Typography>
                <View style={styles.sliderContainer} {...panResponder.panHandlers}>
                  <View style={styles.sliderTrack} />
                  <View style={[styles.sliderFill, { width: `${sliderFillWidth}%` }]} />
                  <View style={[styles.sliderThumb, { left: `${sliderFillWidth}%` }]} />
                </View>

                <View style={styles.amountDisplay}>
                  <View style={styles.amountLeft}>
                    <Typography variant="display" weight="700" color="#37474F">{amount}</Typography>
                    <Typography variant="bodyLg" weight="600" color="#607D8B" style={{ marginLeft: 8 }}>{unit}</Typography>
                  </View>
                  <View style={styles.amountControls}>
                    <TouchableOpacity style={styles.controlBtn} onPress={() => setAmount(Math.max(0, amount - step))}>
                      <Minus size={20} color="#607D8B" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.controlBtn} onPress={() => setAmount(Math.min(maxAmount, amount + step))}>
                      <Plus size={20} color="#607D8B" />
                    </TouchableOpacity>
                  </View>
                </View>

                <Typography variant="label" weight="600" color="#607D8B" style={{ marginTop: 16, marginBottom: 12 }}>Content</Typography>
                <View style={styles.pillContainer}>
                  {['Breast Milk', 'Formula'].map((c) => (
                    <TouchableOpacity 
                      key={c}
                      style={[styles.contentPill, content === c ? styles.contentPillActive : null]}
                      onPress={() => setContent(c)}
                    >
                      <Typography weight="600" color={content === c ? '#2196F3' : '#607D8B'}>{c}</Typography>
                    </TouchableOpacity>
                  ))}
                </View>
              </Card>
            )}

            {/* Notes Section */}
            <Card style={styles.notesCard}>
              <Typography variant="bodyLg" weight="600" color="#8D6E63">Notes</Typography>
              <TextInput
                style={styles.notesInput}
                placeholder="Any symptoms or mood changes?"
                multiline
                value={notes}
                onChangeText={setNotes}
                placeholderTextColor="#B0BEC5"
              />
            </Card>
          </ScrollView>

          {/* Save Button */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Typography variant="bodyLg" weight="700" color="#fff">Save Feeding</Typography>
            </TouchableOpacity>
          </View>
        </View>
    </KeyboardAvoidingView>
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
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#fff',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  content: {
    padding: 20,
    gap: 20,
  },
  tabContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 24,
    alignItems: 'center',
  },
  manualEntryRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  manualEntryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  sectionCard: {
    padding: 24,
    borderRadius: 32,
    backgroundColor: '#fff',
    borderWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  manualEntry: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sideBySide: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 20,
  },
  sideCard: {
    flex: 1,
    backgroundColor: '#F2F5F6',
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
  },
  timerCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFF5F0', // Soft skin-tone base
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    position: 'relative',
    shadowColor: '#8D6E63',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  nipple: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFCCBC', // Nipple tone
    opacity: 0.5,
  },
  progressRingBase: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 6,
  },
  progressRing: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 6,
    borderColor: 'transparent',
  },
  timerText: {
    fontSize: 20,
    color: '#1A1A1A',
  },
  timerButton: {
    width: '100%',
    paddingVertical: 12,
    borderRadius: 20,
    alignItems: 'center',
  },
  unitToggle: {
    flexDirection: 'row',
    backgroundColor: '#F2F5F6',
    borderRadius: 16,
    padding: 4,
  },
  unitBtn: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  unitBtnActive: {
    backgroundColor: '#fff',
  },
  sliderContainer: {
    height: 40,
    justifyContent: 'center',
    marginTop: 12,
  },
  sliderTrack: {
    height: 6,
    backgroundColor: '#E3F2FD',
    borderRadius: 3,
  },
  sliderFill: {
    position: 'absolute',
    height: 6,
    backgroundColor: '#BBDEFB',
    borderRadius: 3,
  },
  sliderThumb: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#455A64',
    borderWidth: 3,
    borderColor: '#fff',
    transform: [{ translateX: -10 }],
  },
  amountDisplay: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  amountLeft: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  amountControls: {
    flexDirection: 'row',
    gap: 12,
  },
  controlBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  contentPill: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: '#F2F5F6',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  contentPillActive: {
    backgroundColor: '#E3F2FD',
    borderColor: '#2196F3',
  },
  notesCard: {
    padding: 24,
    borderRadius: 32,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#FBE9E7',
    gap: 12,
  },
  notesInput: {
    backgroundColor: '#F2F5F6',
    borderRadius: 16,
    padding: 16,
    height: 100,
    textAlignVertical: 'top',
    fontSize: 16,
    color: '#37474F',
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 12,
    backgroundColor: '#F8FAFB',
  },
  saveBtn: {
    height: 64,
    borderRadius: 32,
    backgroundColor: '#C69C82', // Brownish color from image
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
});
