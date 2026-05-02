import Card from '@/components/Card';
import Typography from '@/components/Typography';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useRouter } from 'expo-router';
import { Activity, ArrowLeft, CheckCircle, Circle, Clock, Plus, Bell, X, Trash2, Syringe, ChevronRight } from 'lucide-react-native';
import React, { useState, useEffect } from 'react';
import { 
  Pressable, 
  ScrollView, 
  StyleSheet, 
  TouchableOpacity, 
  View, 
  Switch, 
  Modal, 
  TextInput,
  Platform,
  Animated,
  Alert,
  KeyboardAvoidingView 
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import * as Notifications from 'expo-notifications';
import { useBabyStore } from '@/store/useBabyStore';

const DEFAULT_DAILY_TASKS = [
  { id: 'd1', title: 'Vitamin D Drops', time: 'Morning', type: 'Med' },
  { id: 'd2', title: 'Tummy Time (15 mins)', time: 'Morning', type: 'Daily' },
  { id: 'd3', title: 'Bath / Skin Care', time: 'Evening', type: 'Daily' },
  { id: 'd4', title: 'Gum Cleaning', time: 'Morning', type: 'Daily' },
];

export default function ChecklistsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const themeColors = Colors[colorScheme];
  const { 
    completedChecklistItems, 
    toggleChecklistItem, 
    customReminders,
    addReminder,
    deleteReminder,
    toggleReminder,
    standardTaskSettings,
    updateStandardTaskSetting,
    userStandardTasks,
    addUserStandardTask,
    deleteUserStandardTask,
    currentBabyId,
    babies
  } = useBabyStore();
  
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isStandardModalVisible, setIsStandardModalVisible] = useState(false);
  const [isAddStandardModalVisible, setIsAddStandardModalVisible] = useState(false);
  
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newTime, setNewTime] = useState('09:00 AM');

  const currentBaby = babies.find(b => b.id === currentBabyId);
  const dateKey = format(new Date(), 'yyyy-MM-dd');
  const babyChecklists = (completedChecklistItems as any)[currentBabyId || ''] || {};
  const items = babyChecklists[dateKey] || [];

  const renderRightActions = (id: string, isDefault: boolean) => {
    if (isDefault) return null;
    return (
      <TouchableOpacity 
        style={styles.deleteAction} 
        onPress={() => deleteUserStandardTask(id)}
      >
        <Trash2 size={24} color="#fff" />
      </TouchableOpacity>
    );
  };

  useEffect(() => {
    (async () => {
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== 'granted') {
        await Notifications.requestPermissionsAsync();
      }
    })();
  }, []);

  const scheduleNotification = async (title: string, timeStr: string) => {
    try {
      const [time, modifier] = timeStr.split(' ');
      let [hours, minutes] = time.split(':').map(Number);
      if (modifier === 'PM' && hours < 12) hours += 12;
      if (modifier === 'AM' && hours === 12) hours = 0;

      return await Notifications.scheduleNotificationAsync({
        content: {
          title: `Mummum: ${title}`,
          body: `It's time for ${currentBaby?.name || 'baby'}'s ${title.toLowerCase()}!`,
          sound: true,
        },
        trigger: {
          hour: hours,
          minute: minutes,
          repeats: true,
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
        } as any,
      });
    } catch (e) {
      console.log('Notification Error', e);
      return undefined;
    }
  };

  const handleUpdateStandardTask = async () => {
    if (!selectedTask) return;

    try {
      let notificationId;
      if (newTime) {
        // Cancel old if exists
        const existing = standardTaskSettings[selectedTask.id];
        if (existing?.notificationId) {
          await Notifications.cancelScheduledNotificationAsync(existing.notificationId);
        }
        notificationId = await scheduleNotification(selectedTask.title, newTime);
      }

      updateStandardTaskSetting(selectedTask.id, {
        time: newTime,
        enabled: true,
        notificationId
      });

      setIsStandardModalVisible(false);
      setSelectedTask(null);
    } catch (e) {
      Alert.alert("Error", "Could not schedule task alert.");
    }
  };

  const handleAddUserStandardTask = async () => {
    if (!newTitle) return;

    const id = Math.random().toString(36).substring(7);
    addUserStandardTask({
      id,
      title: newTitle,
      time: newTime,
      type: 'Custom'
    });

    // Automatically enable notification if time set
    const notificationId = await scheduleNotification(newTitle, newTime);
    updateStandardTaskSetting(id, {
      time: newTime,
      enabled: true,
      notificationId
    });

    setNewTitle('');
    setIsAddStandardModalVisible(false);
  };

  const handleToggleStandardTask = async (id: string, enabled: boolean, title: string) => {
    const setting = standardTaskSettings[id];
    if (!setting) return;

    try {
      if (!enabled && setting.notificationId) {
        await Notifications.cancelScheduledNotificationAsync(setting.notificationId);
        updateStandardTaskSetting(id, { ...setting, enabled: false, notificationId: undefined });
      } else if (enabled) {
        const notificationId = await scheduleNotification(title, setting.time);
        updateStandardTaskSetting(id, { ...setting, enabled: true, notificationId });
      }
    } catch (e) {
      Alert.alert("Error", "Could not toggle notification.");
    }
  };

  const handleTestNotification = async () => {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        Alert.alert("Permission Denied", `Status: ${finalStatus}. Please enable notifications for Mummum in your iPhone Settings.`);
        return;
      }

      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: "🔔 Mummum Test Alert",
          body: `Testing care alerts for ${currentBaby?.name || 'your baby'}! Success!`,
          sound: true,
        },
        trigger: {
          seconds: 5,
          repeats: false,
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        } as any,
      });

      if (id) {
        Alert.alert("✅ Success!", "Notification scheduled. It will appear in 5 seconds. Please stay here or lock your screen.");
      } else {
        Alert.alert("❌ Error", "Notification could not be scheduled.");
      }
    } catch (error) {
      console.log('Test Notification Error', error);
      Alert.alert("Error", "Something went wrong while scheduling the test notification.");
    }
  };

  const combinedTasks = [...DEFAULT_DAILY_TASKS, ...userStandardTasks];

  const progress = Math.round((items.length / (combinedTasks.length)) * 100);

  return (
    <View style={[styles.container, { backgroundColor: '#F8FAFB' }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={20}>
          <ArrowLeft size={24} color="#4A5D4C" />
        </TouchableOpacity>
        <Typography variant="headline" weight="700" style={{ color: '#4A5D4C' }}>Checklists</Typography>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Progress Card */}
        <Card style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <View>
              <Typography variant="bodyLg" weight="700" color="#4A5D4C">Overall Progress</Typography>
              <Typography variant="label" color="#607D8B">{items.length} tasks completed</Typography>
            </View>
            <View style={styles.progressBadge}>
              <Typography variant="label" weight="700" color="#fff">{progress}%</Typography>
            </View>
          </View>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
          </View>
        </Card>

        <View style={styles.sectionHeader}>
           <Typography variant="label" weight="800" color="#90A4AE" style={{ letterSpacing: 1 }}>DAILY NURTURE</Typography>
           <TouchableOpacity onPress={() => setIsAddStandardModalVisible(true)}>
             <Plus size={20} color="#4A5D4C" />
           </TouchableOpacity>
        </View>

        {combinedTasks.map((item: any) => {
          const setting = standardTaskSettings[item.id];
          const displayTime = setting?.time || item.time;
          const isEnabled = setting?.enabled || false;
          const isDefault = DEFAULT_DAILY_TASKS.some(d => d.id === item.id);

          return (
            <Swipeable
              key={item.id}
              renderRightActions={() => renderRightActions(item.id, isDefault)}
              friction={2}
              rightThreshold={40}
            >
              <View style={[styles.taskCard, items.includes(item.id) && styles.taskCardCompleted]}>
                <TouchableOpacity 
                  style={styles.taskIconContainer}
                  onPress={() => {
                    setSelectedTask(item);
                    setNewTime(setting?.time || (item.time === 'Morning' ? '08:00 AM' : '06:00 PM'));
                    setIsStandardModalVisible(true);
                  }}
                >
                  <Clock size={20} color={items.includes(item.id) ? '#4CAF50' : '#8D6E63'} />
                </TouchableOpacity>

                <Pressable
                  style={styles.taskPressArea}
                  onPress={() => toggleChecklistItem(item.id)}
                >
                  <View style={styles.taskInfo}>
                    <Typography
                      variant="bodyMd"
                      weight="700"
                      color={items.includes(item.id) ? '#B0BEC5' : '#455A64'}
                      style={items.includes(item.id) && { textDecorationLine: 'line-through' }}
                    >
                      {item.title}
                    </Typography>
                    <Typography variant="label" color="#90A4AE">
                      {displayTime} • {item.type || 'Daily'}
                    </Typography>
                  </View>
                </Pressable>

                <View style={styles.taskActions}>
                  <TouchableOpacity 
                    onPress={() => handleToggleStandardTask(item.id, !isEnabled, item.title)}
                    style={styles.actionIcon}
                  >
                    <Bell size={20} color={isEnabled ? '#4CAF50' : '#CFD8DC'} />
                  </TouchableOpacity>
                  <Pressable onPress={() => toggleChecklistItem(item.id)}>
                     {items.includes(item.id) ? (
                      <CheckCircle size={24} color="#4CAF50" />
                    ) : (
                      <Circle size={24} color="#CFD8DC" />
                    )}
                  </Pressable>
                </View>
              </View>
            </Swipeable>
          );
        })}

        {/* Record Vaccination Shortcut */}
        <TouchableOpacity 
          style={styles.medicalShortcutCard}
          onPress={() => router.push('/log/medical')}
        >
          <View style={styles.medicalShortcutIcon}>
            <Syringe size={20} color="#009688" />
          </View>
          <View style={{ flex: 1 }}>
            <Typography variant="bodyMd" weight="700" color="#009688">Record Vaccination</Typography>
            <Typography variant="label" color="#90A4AE">Update {currentBaby?.name || 'Baby'}'s clinical records</Typography>
          </View>
          <ChevronRight size={20} color="#009688" />
        </TouchableOpacity>

        <View style={{ marginTop: 40, paddingBottom: 40 }}>
          <Typography 
            variant="label" 
            color="#B0BEC5" 
            style={{ textAlign: 'center', paddingHorizontal: 40, lineHeight: 18 }}
          >
            Clinical care alerts are active. Tap the bell icon on any task above to adjust its daily notification time.
          </Typography>
        </View>
      </ScrollView>

      {/* Add New Standard Task Modal */}
      <Modal visible={isAddStandardModalVisible} transparent animationType="slide">
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'position' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? -40 : 0}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Typography variant="headline" weight="700" color="#1B3C35">New Standard Task</Typography>
              <TouchableOpacity onPress={() => setIsAddStandardModalVisible(false)}>
                <X size={24} color="#1B3C35" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.inputSection}>
                <Typography variant="label" weight="700" color="#90A4AE">TASK NAME</Typography>
                <TextInput 
                  style={styles.textInput}
                  placeholder="e.g., Probiotic Drops"
                  value={newTitle}
                  onChangeText={setNewTitle}
                  autoFocus
                />
              </View>

              <View style={styles.inputSection}>
                <Typography variant="label" weight="700" color="#90A4AE">DAILY TIME</Typography>
                <TextInput 
                  style={styles.textInput}
                  placeholder="08:30 AM"
                  value={newTime}
                  onChangeText={setNewTime}
                />
              </View>

              <TouchableOpacity style={styles.saveBtn} onPress={handleAddUserStandardTask}>
                <Typography variant="bodyLg" weight="700" color="#fff">Create Clinical Task</Typography>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Edit Standard Task Modal */}
      <Modal visible={isStandardModalVisible} transparent animationType="slide">
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'position' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? -40 : 0}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Typography variant="headline" weight="700" color="#1B3C35">{selectedTask?.title}</Typography>
                <Typography variant="label" color="#607D8B">Set Daily Notification Time</Typography>
              </View>
              <TouchableOpacity onPress={() => setIsStandardModalVisible(false)}>
                <X size={24} color="#1B3C35" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.inputSection}>
                <Typography variant="label" weight="700" color="#90A4AE">NOTIFICATION TIME</Typography>
                <TextInput 
                  style={styles.textInput}
                  placeholder="09:00 AM"
                  value={newTime}
                  onChangeText={setNewTime}
                  autoFocus
                />
              </View>

              <View style={styles.switchRow}>
                <View>
                  <Typography variant="body" weight="700" color="#1B3C35">Enable Alerts</Typography>
                  <Typography variant="label" color="#90A4AE">Get notified on your device</Typography>
                </View>
                <Switch 
                  value={standardTaskSettings[selectedTask?.id]?.enabled}
                  onValueChange={(val) => handleToggleStandardTask(selectedTask.id, val, selectedTask.title)}
                  trackColor={{ false: '#CFD8DC', true: '#4A5D4C' }}
                />
              </View>

              <TouchableOpacity style={styles.saveBtn} onPress={handleUpdateStandardTask}>
                <Typography variant="bodyLg" weight="700" color="#fff">Save Settings</Typography>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#fff',
  },
  progressCard: {
    marginVertical: 20,
    padding: 20,
    borderRadius: 24,
    backgroundColor: '#fff',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  progressBadge: {
    backgroundColor: '#C69C82',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#F0F0F0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#C69C82',
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 24,
    backgroundColor: '#F2F5F6',
    borderRadius: 16,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12,
  },
  activeTab: {
    backgroundColor: '#4A5D4C',
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 60,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  taskPressArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  taskCardCompleted: {
    backgroundColor: '#F8F9FA',
    opacity: 0.8,
  },
  taskIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FBE9E7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  taskInfo: {
    flex: 1,
  },
  taskActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionIcon: {
    padding: 8,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 20,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
    marginTop: 12,
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
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  modalBody: {
    gap: 24,
  },
  inputSection: {
    gap: 12,
  },
  textInput: {
    fontSize: 18,
    padding: 16,
    backgroundColor: '#F8FAFB',
    borderRadius: 16,
    color: '#1B3C35',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  saveBtn: {
    backgroundColor: '#4A5D4C',
    padding: 20,
    borderRadius: 20,
    alignItems: 'center',
    marginTop: 12,
  },
  deleteAction: {
    backgroundColor: '#FF5252',
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    height: '84%',
    borderRadius: 20,
    marginBottom: 12,
  },
  medicalShortcutCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0F2F1',
    padding: 20,
    borderRadius: 24,
    marginTop: 24,
    gap: 16,
    borderWidth: 1,
    borderColor: '#B2DFDB',
  },
  medicalShortcutIcon: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
