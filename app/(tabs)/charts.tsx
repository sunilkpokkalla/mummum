import React, { useState } from 'react';
import { StyleSheet, ScrollView, View, TouchableOpacity, Image, Modal, TextInput, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import Typography from '@/components/Typography';
import Card from '@/components/Card';
import { TrendingUp, Bell, ChevronRight, Plus, X, Trash2, Lock, Unlock } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useBabyStore } from '@/store/useBabyStore';
import { differenceInMonths, differenceInDays, format } from 'date-fns';
import { Swipeable, RectButton } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

export default function ChartsScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? 'light';
  const themeColors = Colors[colorScheme];
  const { babies, currentBabyId, activities, addActivity, updateBaby, deleteActivity, updateActivity } = useBabyStore();
  const [activeTab, setActiveTab] = useState('Weight');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [newValue, setNewValue] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const currentBaby = babies.find(b => b.id === currentBabyId);
  const birthDate = currentBaby?.birthDate ? new Date(currentBaby.birthDate) : new Date();
  const monthsOld = differenceInMonths(new Date(), birthDate);
  const daysOld = differenceInDays(new Date(), birthDate);

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && currentBabyId) {
      updateBaby(currentBabyId, { photoUri: result.assets[0].uri });
    }
  };

  const getAgeDisplay = () => {
    if (monthsOld >= 1) return `${monthsOld} months old`;
    return `${daysOld} days old`;
  };

  const handleAddMeasurement = () => {
    if (!newValue) return;
    
    // Validate number
    const numValue = parseFloat(newValue);
    if (isNaN(numValue)) {
      setNewValue('');
      return;
    }

    if (editingId) {
      updateActivity(editingId, {
        details: {
          ...activities.find(a => a.id === editingId)?.details,
          value: numValue.toString()
        }
      });
    } else {
      addActivity({
        type: 'growth',
        timestamp: new Date(),
        details: {
          metric: activeTab,
          value: numValue.toString(),
          unit: activeTab === 'Weight' ? 'lbs' : 'cm'
        }
      });
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setNewValue('');
    setEditingId(null);
    setIsModalVisible(false);
  };

  const handleEdit = (id: string, value: string) => {
    setEditingId(id);
    setNewValue(value);
    setIsModalVisible(true);
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      "Delete Record",
      "Are you sure you want to remove this measurement?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => deleteActivity(id) }
      ]
    );
  };

  const growthHistory = activities.filter(a => 
    a.babyId === currentBabyId && 
    a.type === 'growth' && 
    a.details?.metric === activeTab
  );
  const latestValue = growthHistory[0]?.details?.value ? parseFloat(growthHistory[0].details.value) : null;
  const previousValue = growthHistory[1]?.details?.value ? parseFloat(growthHistory[1].details.value) : null;

  const getDynamicInsight = () => {
    if (!latestValue) return { title: 'No Data yet', description: 'Add your first measurement to see insights!' };

    let percentile = '50th';
    let status = 'on track';
    
    if (activeTab === 'Weight') {
      const expected = 7.5 + (monthsOld * 1.7);
      if (latestValue > expected * 1.2) { percentile = '90th'; status = 'growing fast'; }
      else if (latestValue < expected * 0.8) { percentile = '10th'; status = 'below average'; }
      else if (latestValue > expected * 1.05) { percentile = '75th'; status = 'healthy'; }
    } else if (activeTab === 'Height') {
      const expected = 50 + (monthsOld * 2.5);
      if (latestValue > expected * 1.1) { percentile = '95th'; status = 'tall'; }
      else if (latestValue < expected * 0.9) { percentile = '5th'; status = 'shorter'; }
    }

    const diff = previousValue ? (latestValue - previousValue).toFixed(1) : null;
    const isGain = previousValue ? latestValue >= previousValue : true;
    const trendText = diff ? ` (${isGain ? 'Gained' : 'Lost'} ${Math.abs(Number(diff))} ${activeTab === 'Weight' ? 'lbs' : 'cm'} since last check)` : '';

    return {
      title: `Current ${activeTab} Insight`,
      description: `${currentBaby?.name || 'your baby'} is in the ${percentile} percentile. This is considered ${status}${trendText}.`,
      diff,
      isGain
    };
  };

  const insight = getDynamicInsight();

  const getDataForMonth = (monthOffset: number) => {
    const targetDate = new Date();
    targetDate.setMonth(targetDate.getMonth() - monthOffset);
    
    // Find measurement closest to that month
    const monthData = growthHistory.find(h => {
      const hDate = new Date(h.timestamp);
      return hDate.getMonth() === targetDate.getMonth() && hDate.getFullYear() === targetDate.getFullYear();
    });

    return monthData?.details?.value ? parseFloat(monthData.details.value) : null;
  };

  const maxVal = Math.max(...growthHistory.map(h => parseFloat(h.details?.value || '0')), 1);

  return (
    <View style={[styles.container, { backgroundColor: '#F8FAFB', paddingTop: insets.top }]}>
      <ScrollView 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <Typography variant="display" weight="800" style={{ color: '#1B3C35', fontSize: 34 }}>Growth Tracking</Typography>
            <Typography variant="bodyMd" weight="600" color="#607D8B">Monitoring {currentBaby?.name || 'your baby'}'s healthy development ({getAgeDisplay()})</Typography>
          </View>
        </View>

        {/* Insight Card */}
        <Card style={[styles.insightCard, { backgroundColor: colorScheme === 'light' ? '#E8F1E9' : '#1B2E1D' }]}>
          <View style={[styles.insightIcon, { backgroundColor: '#89A08B' }]}>
            <TrendingUp size={20} color="#fff" />
          </View>
          <View style={styles.insightText}>
            <Typography variant="label" weight="600" color="#4A5D4C">{insight.title}</Typography>
            <Typography variant="bodyLg" color="#1A1A1A">
              {insight.description}
            </Typography>
          </View>
        </Card>

        {/* Segmented Tabs */}
        <View style={styles.tabContainer}>
          {['Weight', 'Height', 'Head Circ'].map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[
                styles.tab,
                activeTab === tab ? [styles.activeTab, { backgroundColor: '#4A5D4C' }] : { backgroundColor: themeColors.surfaceVariant + '40' }
              ]}
              onPress={() => setActiveTab(tab)}
            >
              <Typography 
                variant="label" 
                weight="600" 
                style={{ color: activeTab === tab ? '#fff' : themeColors.icon }}
              >
                {tab}
              </Typography>
            </TouchableOpacity>
          ))}
        </View>

        {/* Growth Chart Card */}
        <Card style={styles.chartCard}>
          <View style={styles.chartCardHeader}>
            <View>
              <Typography variant="label" weight="700" color={themeColors.icon} style={styles.chartLabel}>
                {activeTab.toUpperCase()} LOG
              </Typography>
              <Typography variant="display" style={styles.mainValue}>
                {growthHistory[0]?.details?.value || (activeTab === 'Weight' ? '-' : '-')}
              </Typography>
            </View>
            <View style={styles.trendInfo}>
              <Typography variant="bodyLg" weight="700" color={insight.isGain ? "#2E7D32" : "#E57373"}>
                {insight.diff ? `${insight.isGain ? '+' : ''}${insight.diff} ${activeTab === 'Weight' ? 'lbs' : 'cm'}` : 'New'}
              </Typography>
              <Typography variant="label" color={themeColors.icon}>since last entry</Typography>
            </View>
          </View>

          {/* Dynamic Bar Chart based on baby's age */}
          <View style={styles.chartArea}>
            {[...Array(6)].map((_, i) => {
              const offset = 5 - i;
              const displayMonth = Math.max(0, monthsOld - offset);
              const isCurrentMonth = offset === 0;
              
              const monthValue = getDataForMonth(offset);
              // Scale bar height based on max value in history, min 20% height
              const barHeight = monthValue ? (monthValue / maxVal) * 80 + 10 : 0;

              return (
                <View key={i} style={styles.barWrapper}>
                  <View 
                    style={[
                      styles.bar, 
                      { 
                        height: monthValue ? `${barHeight}%` : 4, 
                        backgroundColor: isCurrentMonth ? '#BCC6BC' : (monthValue ? '#F5F5F5' : '#ECEFF1'),
                        borderTopLeftRadius: 16,
                        borderTopRightRadius: 16,
                        borderRadius: monthValue ? 0 : 2,
                      }
                    ]} 
                  >
                    {monthValue && isCurrentMonth && (
                      <View style={styles.barValueBubble}>
                        <Typography variant="label" weight="700" style={{ color: '#fff', fontSize: 10 }}>
                          {monthValue}
                        </Typography>
                      </View>
                    )}
                  </View>
                  <Typography variant="label" style={styles.barLabel} color={themeColors.icon}>
                    {displayMonth}M
                  </Typography>
                </View>
              );
            })}
            {/* Future Projection */}
            {[monthsOld + 1, monthsOld + 2].map((m, i) => (
              <View key={`proj-${i}`} style={styles.barWrapper}>
                <View 
                  style={[
                    styles.bar, 
                    styles.predictionBar,
                    { 
                      height: `${60 + (i * 5)}%`, 
                      borderColor: '#BCC6BC',
                    }
                  ]} 
                />
                <Typography variant="label" style={styles.barLabel} color={themeColors.icon}>
                  {m}M
                </Typography>
              </View>
            ))}
          </View>
        </Card>

        {/* Recent History */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Typography variant="headline" weight="700">Recent History</Typography>
            <TouchableOpacity>
              <Typography variant="label" weight="600" color={themeColors.primary}>View All</Typography>
            </TouchableOpacity>
          </View>

          <View style={styles.historyList}>
            {growthHistory.length > 0 ? (
              growthHistory.map((item, idx) => (
                <HistoryItem 
                  key={item.id}
                  date={new Date(item.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  value={`${item.details?.value} ${item.details?.unit}`}
                  accent="#4A5D4C"
                  onDelete={() => handleDelete(item.id)}
                  onEdit={() => handleEdit(item.id, item.details?.value)}
                />
              ))
            ) : (
              <View style={{ padding: 40, alignItems: 'center' }}>
                <Typography color={themeColors.icon}>No measurements logged yet.</Typography>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Floating Action Button (Brown) */}
      <TouchableOpacity 
        style={styles.fab} 
        onPress={() => setIsModalVisible(true)}
        activeOpacity={0.8}
      >
        <Plus size={32} color="#fff" />
      </TouchableOpacity>

      <Modal visible={isModalVisible} transparent animationType="fade">
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'position' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Typography variant="headline" weight="700">{editingId ? 'Edit' : 'Add'} {activeTab}</Typography>
                <Typography variant="label" color={themeColors.icon}>Recording for {currentBaby?.name || 'Baby'}</Typography>
              </View>
              <TouchableOpacity 
                style={[styles.closeBtn, { backgroundColor: themeColors.surfaceVariant + '40' }]} 
                onPress={() => {
                  setIsModalVisible(false);
                  setEditingId(null);
                  setNewValue('');
                }}
              >
                <X size={20} color={themeColors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.heroInput}
                  value={newValue}
                  onChangeText={setNewValue}
                  placeholder="0.0"
                  placeholderTextColor={themeColors.icon + '40'}
                  keyboardType="decimal-pad"
                  autoFocus
                  selectionColor="#4A5D4C"
                />
                <Typography variant="display" weight="700" color="#4A5D4C" style={styles.unitLabel}>
                  {activeTab === 'Weight' ? 'lbs' : 'cm'}
                </Typography>
              </View>

              <View style={styles.inputHint}>
                <Typography variant="label" color={themeColors.icon} style={{ textAlign: 'center' }}>
                  {newValue ? `Entering ${newValue} ${activeTab === 'Weight' ? 'pounds' : 'centimeters'}` : 'Enter the latest measurement'}
                </Typography>
              </View>

              <TouchableOpacity 
                style={[styles.saveBtn, { opacity: newValue ? 1 : 0.6 }]} 
                onPress={handleAddMeasurement}
                disabled={!newValue}
              >
                <Typography variant="bodyLg" weight="700" color="#fff">Save to Growth Record</Typography>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

function HistoryItem({ date, value, accent, onDelete, onEdit }: any) {
  const [isLocked, setIsLocked] = useState(true);
  const colorScheme = useColorScheme() ?? 'light';
  const themeColors = Colors[colorScheme];

  const renderRightActions = () => (
    <RectButton style={styles.deleteAction} onPress={onDelete}>
      <Trash2 size={16} color="#fff" />
    </RectButton>
  );

  return (
    <Swipeable renderRightActions={renderRightActions} enabled={!isLocked}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <TouchableOpacity 
          onPress={() => setIsLocked(!isLocked)} 
          style={{ paddingRight: 10, paddingLeft: 4 }}
        >
          {isLocked ? (
            <Lock size={16} color="#90A4AE" />
          ) : (
            <Unlock size={16} color={accent} />
          )}
        </TouchableOpacity>
        
        <TouchableOpacity 
          activeOpacity={0.7} 
          onPress={onEdit} 
          disabled={isLocked}
          style={{ flex: 1 }}
        >
          <Card style={[styles.historyCard, { borderLeftColor: accent, borderLeftWidth: 3, flex: 1 }]}>
            <View style={{ flex: 1 }}>
              <Typography variant="label" weight="600" color={themeColors.icon} style={{ fontSize: 10 }}>{date}</Typography>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <TrendingUp size={14} color={accent} />
              <Typography variant="bodyLg" weight="700" style={{ color: isLocked ? '#90A4AE' : '#1B3C35' }}>{value}</Typography>
              {!isLocked && <ChevronRight size={16} color={themeColors.icon} />}
            </View>
          </Card>
        </TouchableOpacity>
      </View>
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 100, // Extra space for FAB
    gap: 32,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  brandName: {
    fontSize: 20,
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleSection: {
    gap: 8,
  },
  title: {
    fontSize: 32,
  },
  insightCard: {
    flexDirection: 'row',
    padding: 20,
    borderRadius: 24,
    alignItems: 'center',
    gap: 16,
    borderWidth: 0,
  },
  insightIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  insightText: {
    flex: 1,
    gap: 2,
  },
  tabContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  tab: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  activeTab: {
    backgroundColor: '#4A5D4C',
  },
  chartCard: {
    padding: 24,
    borderRadius: 32,
    gap: 40,
  },
  chartCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  chartLabel: {
    letterSpacing: 1,
    marginBottom: 4,
  },
  mainValue: {
    fontSize: 32,
    lineHeight: 40,
  },
  trendInfo: {
    alignItems: 'flex-end',
  },
  chartArea: {
    flexDirection: 'row',
    height: 180,
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingBottom: 20,
  },
  barWrapper: {
    flex: 1,
    alignItems: 'center',
    gap: 12,
  },
  bar: {
    width: '70%',
    maxWidth: 40,
    backgroundColor: '#F5F5F5',
  },
  predictionBar: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderStyle: 'dashed',
    opacity: 0.5,
    borderBottomWidth: 0,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  barValueBubble: {
    position: 'absolute',
    top: -30,
    alignSelf: 'center',
    backgroundColor: '#4A5D4C',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  barLabel: {
    fontSize: 10,
    fontWeight: '700',
  },
  section: {
    gap: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyList: {
    gap: 8,
  },
  historyCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#C69C82', // Brown color from image
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    paddingBottom: 48,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBody: {
    gap: 32,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 20,
  },
  heroInput: {
    fontSize: 64,
    fontWeight: '800',
    color: '#1A1A1A',
    minWidth: 100,
    textAlign: 'right',
  },
  unitLabel: {
    fontSize: 24,
    color: '#4A5D4C',
    marginBottom: 8,
  },
  inputHint: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#F8FAFB',
    borderRadius: 16,
  },
  saveBtn: {
    backgroundColor: '#4A5D4C',
    padding: 20,
    borderRadius: 24,
    alignItems: 'center',
    shadowColor: '#4A5D4C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  deleteAction: {
    backgroundColor: '#E57373',
    justifyContent: 'center',
    alignItems: 'center',
    width: 60,
    height: '100%',
    borderRadius: 16,
    marginBottom: 8,
  },
});
