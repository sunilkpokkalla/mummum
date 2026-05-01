import Card from '@/components/Card';
import Typography from '@/components/Typography';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useRouter } from 'expo-router';
import { Activity, ArrowLeft, CheckCircle, Circle, Clock, Plus, Bell, X } from 'lucide-react-native';
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
  Animated 
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import * as Notifications from 'expo-notifications';
import { useBabyStore } from '@/store/useBabyStore';

const DAILY_TASKS = [
  { id: 'd1', title: 'Vitamin D Drops', time: 'Morning', type: 'Med' },
  { id: 'd2', title: 'Tummy Time (15 mins)', time: 'Morning', type: 'Daily' },
  { id: 'd3', title: 'Bath / Skin Care', time: 'Evening', type: 'Daily' },
  { id: 'd4', title: 'Gum Cleaning', time: 'Morning', type: 'Daily' },
];

const VACCINATIONS = [
  { id: 'v1', title: 'BCG (Tuberculosis)', period: 'At Birth', status: 'Mandatory' },
  { id: 'v2', title: 'HepB (Hepatitis B)', period: 'At Birth', status: 'Mandatory' },
  { id: 'v3', title: 'DTP 1 (Diphtheria, Tetanus)', period: '6 Weeks', status: 'Scheduled' },
  { id: 'v4', title: 'Polio (OPV/IPV) 1', period: '6 Weeks', status: 'Scheduled' },
  { id: 'v5', title: 'Rotavirus 1', period: '6 Weeks', status: 'Scheduled' },
  { id: 'v6', title: 'DTP 2 / Polio 2', period: '10 Weeks', status: 'Upcoming' },
  { id: 'v7', title: 'DTP 3 / Polio 3', period: '14 Weeks', status: 'Upcoming' },
  { id: 'v8', title: 'Measles 1 / MR', period: '9 Months', status: 'Upcoming' },
  { id: 'v9', title: 'DTP Booster / MMR', period: '15-18 Months', status: 'Upcoming' },
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
    currentBabyId,
    babies
  } = useBabyStore();
  
  const [activeTab, setActiveTab] = useState<'Daily' | 'Vaccinations'>('Daily');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newTime, setNewTime] = useState('09:00 AM');

  const currentBaby = babies.find(b => b.id === currentBabyId);

  useEffect(() => {
    (async () => {
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== 'granted') {
        await Notifications.requestPermissionsAsync();
      }
    })();
  }, []);

  const handleAddReminder = async () => {
    if (!newTitle) return;

    const id = Math.random().toString(36).substring(7);
    
    // Schedule Notification
    let notificationId;
    try {
      const [time, modifier] = newTime.split(' ');
      let [hours, minutes] = time.split(':').map(Number);
      if (modifier === 'PM' && hours < 12) hours += 12;
      if (modifier === 'AM' && hours === 12) hours = 0;

      notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: `Mummum: ${newTitle}`,
          body: `It's time for ${currentBaby?.name || 'baby'}'s ${newTitle.toLowerCase()}!`,
          sound: true,
        },
        trigger: {
          hour: hours,
          minute: minutes,
          repeats: true,
        },
      });
    } catch (e) {
      console.log('Notification Error', e);
    }

    addReminder({
      id,
      title: newTitle,
      time: newTime,
      enabled: true,
      notificationId
    });

    setNewTitle('');
    setIsModalVisible(false);
  };

  const handleToggleReminder = async (id: string, enabled: boolean, reminder: any) => {
    toggleReminder(id);
    
    if (!enabled && reminder.notificationId) {
      await Notifications.cancelScheduledNotificationAsync(reminder.notificationId);
    } else if (enabled) {
      // Re-schedule logic could go here
    }
  };

  const renderRightActions = (id: string, reminder: any) => {
    return (
      <TouchableOpacity 
        style={styles.deleteAction} 
        onPress={() => {
          if (reminder.notificationId) {
            Notifications.cancelScheduledNotificationAsync(reminder.notificationId);
          }
          deleteReminder(id);
        }}
      >
        <Typography variant="label" weight="700" color="#fff">Delete</Typography>
      </TouchableOpacity>
    );
  };

  const currentTasks = activeTab === 'Daily' ? DAILY_TASKS : VACCINATIONS;
  const progress = Math.round((completedChecklistItems.length / (DAILY_TASKS.length + VACCINATIONS.length)) * 100);

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
              <Typography variant="label" color="#607D8B">{completedChecklistItems.length} tasks completed</Typography>
            </View>
            <View style={styles.progressBadge}>
              <Typography variant="label" weight="700" color="#fff">{progress}%</Typography>
            </View>
          </View>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
          </View>
        </Card>

        {/* Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'Daily' && styles.activeTab]}
            onPress={() => setActiveTab('Daily')}
          >
            <Typography weight="600" color={activeTab === 'Daily' ? '#fff' : '#607D8B'}>Daily Nurture</Typography>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'Vaccinations' && styles.activeTab]}
            onPress={() => setActiveTab('Vaccinations')}
          >
            <Typography weight="600" color={activeTab === 'Vaccinations' ? '#fff' : '#607D8B'}>Vaccinations</Typography>
          </TouchableOpacity>
        </View>

        {activeTab === 'Daily' && (
          <View style={styles.sectionHeader}>
             <Typography variant="label" weight="800" color="#90A4AE" style={{ letterSpacing: 1 }}>STANDARD CARE</Typography>
          </View>
        )}

        {currentTasks.map((item: any) => (
          <Pressable
            key={item.id}
            style={[styles.taskCard, completedChecklistItems.includes(item.id) && styles.taskCardCompleted]}
            onPress={() => toggleChecklistItem(item.id)}
          >
            <View style={styles.taskIconContainer}>
              {activeTab === 'Daily' ? (
                <Clock size={20} color={completedChecklistItems.includes(item.id) ? '#4CAF50' : '#8D6E63'} />
              ) : (
                <Activity size={20} color={completedChecklistItems.includes(item.id) ? '#4CAF50' : '#8D6E63'} />
              )}
            </View>
            <View style={styles.taskInfo}>
              <Typography
                variant="bodyMd"
                weight="700"
                color={completedChecklistItems.includes(item.id) ? '#B0BEC5' : '#455A64'}
                style={completedChecklistItems.includes(item.id) && { textDecorationLine: 'line-through' }}
              >
                {item.title}
              </Typography>
              <Typography variant="label" color="#90A4AE">
                {activeTab === 'Daily' ? item.time : item.period} • {item.type || item.status}
              </Typography>
            </View>
            <View style={styles.checkIcon}>
              {completedChecklistItems.includes(item.id) ? (
                <CheckCircle size={24} color="#4CAF50" />
              ) : (
                <Circle size={24} color="#CFD8DC" />
              )}
            </View>
          </Pressable>
        ))}

        {activeTab === 'Daily' && (
          <>
            <View style={[styles.sectionHeader, { marginTop: 20 }]}>
               <Typography variant="label" weight="800" color="#90A4AE" style={{ letterSpacing: 1 }}>CUSTOM REMINDERS</Typography>
               <TouchableOpacity onPress={() => setIsModalVisible(true)}>
                 <Plus size={20} color="#4A5D4C" />
               </TouchableOpacity>
            </View>

            {customReminders.map((reminder) => (
              <Swipeable
                key={reminder.id}
                renderRightActions={() => renderRightActions(reminder.id, reminder)}
              >
                <View style={styles.taskCard}>
                  <View style={[styles.taskIconContainer, { backgroundColor: '#E3F2FD' }]}>
                    <Bell size={20} color="#1565C0" />
                  </View>
                  <View style={styles.taskInfo}>
                    <Typography variant="bodyMd" weight="700" color="#455A64">{reminder.title}</Typography>
                    <Typography variant="label" color="#90A4AE">{reminder.time}</Typography>
                  </View>
                  <Switch 
                    value={reminder.enabled}
                    onValueChange={(val) => handleToggleReminder(reminder.id, val, reminder)}
                    trackColor={{ false: '#CFD8DC', true: '#4A5D4C' }}
                  />
                </View>
              </Swipeable>
            ))}

            <TouchableOpacity 
              style={styles.addBtn}
              onPress={() => setIsModalVisible(true)}
            >
              <Plus size={20} color="#4A5D4C" />
              <Typography variant="body" weight="700" color="#4A5D4C">Add New Reminder</Typography>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>

      {/* Add Reminder Modal */}
      <Modal visible={isModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Typography variant="headline" weight="700" color="#1B3C35">New Reminder</Typography>
              <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                <X size={24} color="#1B3C35" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.inputSection}>
                <Typography variant="label" weight="700" color="#90A4AE">TASK NAME</Typography>
                <TextInput 
                  style={styles.textInput}
                  placeholder="e.g., Afternoon Walk"
                  value={newTitle}
                  onChangeText={setNewTitle}
                  autoFocus
                />
              </View>

              <View style={styles.inputSection}>
                <Typography variant="label" weight="700" color="#90A4AE">REMINDER TIME</Typography>
                <TextInput 
                  style={styles.textInput}
                  placeholder="09:00 AM"
                  value={newTime}
                  onChangeText={setNewTime}
                />
              </View>

              <TouchableOpacity style={styles.saveBtn} onPress={handleAddReminder}>
                <Typography variant="bodyLg" weight="700" color="#fff">Schedule Reminder</Typography>
              </TouchableOpacity>
            </View>
          </View>
        </View>
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
    marginBottom: 20,
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
  checkIcon: {
    marginLeft: 12,
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
    height: '84%', // Match card height
    borderRadius: 20,
    marginBottom: 12,
  }
});
