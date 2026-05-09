import Card from '@/components/Card';
import Typography from '@/components/Typography';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useRouter } from 'expo-router';
import { 
  Activity, ArrowLeft, CheckCircle, Circle, Clock, Plus, Bell, X, Trash2, 
  Syringe, ChevronRight, Calendar, Stethoscope, MapPin, User, Info, 
  AlertCircle, Briefcase, LogIn, LogOut, StickyNote, Package, Heart 
} from 'lucide-react-native';
import React, { useState, useEffect } from 'react';
import { 
  Pressable, 
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
import { Swipeable, ScrollView, GestureHandlerRootView } from 'react-native-gesture-handler';
import * as Notifications from 'expo-notifications';
import { format, subDays, isAfter, parseISO } from 'date-fns';
import { useBabyStore } from '@/store/useBabyStore';

const DEFAULT_DAILY_TASKS = [
  { id: 'd1', title: 'Vitamin D Drops', time: 'Morning', type: 'Med' },
  { id: 'd2', title: 'Tummy Time (15 mins)', time: 'Morning', type: 'Daily' },
  { id: 'd3', title: 'Bath / Skin Care', time: 'Evening', type: 'Daily' },
  { id: 'd4', title: 'Gum Cleaning', time: 'Morning', type: 'Daily' },
];

const DAYCARE_BAG_ITEMS = [
  { id: 'b1', title: 'Fresh Milk / Formula', type: 'Bag' },
  { id: 'b2', title: 'Extra Change of Clothes', type: 'Bag' },
  { id: 'b3', title: 'Diapers & Wipes', type: 'Bag' },
  { id: 'b4', title: 'Comfort Item (Pacifier/Lovey)', type: 'Bag' },
];

export default function ChecklistsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const themeColors = Colors[colorScheme];
  const { 
    completedChecklistItems, 
    toggleChecklistItem, 
    standardTaskSettings,
    updateStandardTaskSetting,
    userStandardTasks,
    addUserStandardTask,
    deleteUserStandardTask,
    currentBabyId,
    babies,
    appointments,
    addAppointment,
    deleteAppointment,
    dayCareLogs,
    addDayCareLog,
    deleteDayCareLog
  } = useBabyStore();
  
  const [activeTab, setActiveTab] = useState<'tasks' | 'appointments' | 'daycare'>('tasks');
  const [isStandardModalVisible, setIsStandardModalVisible] = useState(false);
  const [isAddStandardModalVisible, setIsAddStandardModalVisible] = useState(false);
  const [isAppointmentModalVisible, setIsAppointmentModalVisible] = useState(false);
  const [isDayCareModalVisible, setIsDayCareModalVisible] = useState(false);
  
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newTime, setNewTime] = useState('09:00 AM');
  
  // Appointment Form State
  const [apptTitle, setApptTitle] = useState('');
  const [apptDoctor, setApptDoctor] = useState('');
  const [apptDate, setApptDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [apptTime, setApptTime] = useState('10:00 AM');
  const [apptNotes, setApptNotes] = useState('');

  // Day Care Form State
  const [dcDropOff, setDcDropOff] = useState('');
  const [dcPickUp, setDcPickUp] = useState('');
  const [dcNotes, setDcNotes] = useState('');

  const currentBaby = babies.find(b => b.id === currentBabyId);
  const dateKey = format(new Date(), 'yyyy-MM-dd');
  const babyChecklists = (completedChecklistItems as any)[currentBabyId || ''] || {};
  const items = babyChecklists[dateKey] || [];

  const babyAppointments = appointments.filter(a => a.babyId === currentBabyId)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const babyDayCareLogs = dayCareLogs.filter(l => l.babyId === currentBabyId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

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

  const renderApptRightActions = (id: string) => {
    return (
      <TouchableOpacity 
        style={styles.deleteAction} 
        onPress={() => handleDeleteAppointment(id)}
      >
        <Trash2 size={24} color="#fff" />
      </TouchableOpacity>
    );
  };

  const renderDayCareRightActions = (id: string) => {
    return (
      <TouchableOpacity 
        style={styles.deleteAction} 
        onPress={() => deleteDayCareLog(id)}
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
          body: `It's time for ${currentBaby?.name ? currentBaby.name : 'your baby'}'s ${title.toLowerCase()}!`,
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

  const scheduleAppointmentReminders = async (title: string, doctor: string, dateStr: string, timeStr: string) => {
    const ids = [];
    try {
      const [year, month, day] = dateStr.split('-').map(Number);
      const [time, modifier] = timeStr.split(' ');
      let [hours, minutes] = time.split(':').map(Number);
      if (modifier === 'PM' && hours < 12) hours += 12;
      if (modifier === 'AM' && hours === 12) hours = 0;

      const baseDate = new Date(year, month - 1, day, hours, minutes);

      const reminders = [
        { label: 'in 7 days', date: subDays(baseDate, 7) },
        { label: 'in 2 days', date: subDays(baseDate, 2) },
        { label: 'today', date: baseDate }
      ];

      for (const r of reminders) {
        if (isAfter(r.date, new Date())) {
          const id = await Notifications.scheduleNotificationAsync({
            content: {
              title: `Pediatric Visit: ${title}`,
              body: `Appointment with ${doctor} is ${r.label}!`,
              sound: true,
            },
            trigger: r.date,
          });
          ids.push(id);
        }
      }
    } catch (e) {
      console.log('Appt Notification Error', e);
    }
    return ids;
  };

  const handleAddAppointment = async () => {
    if (!apptTitle || !apptDoctor) {
      Alert.alert("Missing Info", "Please provide a title and doctor name.");
      return;
    }

    const notificationIds = await scheduleAppointmentReminders(apptTitle, apptDoctor, apptDate, apptTime);
    
    addAppointment({
      id: Math.random().toString(36).substring(7),
      title: apptTitle,
      doctor: apptDoctor,
      date: apptDate,
      time: apptTime,
      notes: apptNotes,
      notificationIds
    });

    setApptTitle('');
    setApptDoctor('');
    setApptNotes('');
    setIsAppointmentModalVisible(false);
  };

  const handleDeleteAppointment = async (id: string) => {
    const appt = appointments.find(a => a.id === id);
    if (appt?.notificationIds) {
      for (const nid of appt.notificationIds) {
        await Notifications.cancelScheduledNotificationAsync(nid);
      }
    }
    deleteAppointment(id);
  };

  const handleAddDayCareLog = () => {
    if (!dcDropOff && !dcPickUp && !dcNotes) return;

    addDayCareLog({
      id: Math.random().toString(36).substring(7),
      date: new Date().toISOString(),
      dropOffTime: dcDropOff,
      pickUpTime: dcPickUp,
      notes: dcNotes,
      suppliesProvided: [] // Could link to bag items if needed
    });

    setDcDropOff('');
    setDcPickUp('');
    setDcNotes('');
    setIsDayCareModalVisible(false);
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

  const combinedTasks = [...DEFAULT_DAILY_TASKS, ...userStandardTasks];
  const progress = Math.round((items.length / (combinedTasks.length)) * 100);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={[styles.container, { backgroundColor: '#F8FAFB' }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={20}>
            <ArrowLeft size={24} color="#4A5D4C" />
          </TouchableOpacity>
          <Typography variant="headline" weight="700" style={{ color: '#4A5D4C' }}>Checklists</Typography>
          <View style={{ width: 24 }} />
        </View>

        {/* Tab Switcher */}
        <View style={styles.tabContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 24 }}>
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'tasks' && styles.activeTab]}
              onPress={() => setActiveTab('tasks')}
            >
              <Typography variant="body" weight="700" color={activeTab === 'tasks' ? '#4A5D4C' : '#90A4AE'}>Daily Tasks</Typography>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'appointments' && styles.activeTab]}
              onPress={() => setActiveTab('appointments')}
            >
              <Typography variant="body" weight="700" color={activeTab === 'appointments' ? '#4A5D4C' : '#90A4AE'}>Pediatric Visits</Typography>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'daycare' && styles.activeTab]}
              onPress={() => setActiveTab('daycare')}
            >
              <Typography variant="body" weight="700" color={activeTab === 'daycare' ? '#4A5D4C' : '#90A4AE'}>Day Care</Typography>
            </TouchableOpacity>
          </ScrollView>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {activeTab === 'tasks' && (
            <>
              {/* Progress Card */}
              <Card style={styles.progressCard}>
                <View style={styles.progressHeader}>
                  <View>
                    <Typography variant="bodyLg" weight="700" color="#4A5D4C">Daily Progress</Typography>
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
                 <Typography variant="label" weight="800" color="#90A4AE" style={{ letterSpacing: 1 }}>NURTURE LIST</Typography>
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
            </>
          )}

          {activeTab === 'appointments' && (
            <>
              <View style={styles.sectionHeader}>
                 <Typography variant="label" weight="800" color="#90A4AE" style={{ letterSpacing: 1 }}>UPCOMING VISITS</Typography>
                 <TouchableOpacity onPress={() => setIsAppointmentModalVisible(true)}>
                   <Plus size={20} color="#4A5D4C" />
                 </TouchableOpacity>
              </View>

              {babyAppointments.length === 0 ? (
                <View style={styles.emptyState}>
                  <View style={styles.emptyIconCircle}>
                    <Stethoscope size={32} color="#B0BEC5" />
                  </View>
                  <Typography variant="body" weight="600" color="#90A4AE">No upcoming appointments</Typography>
                </View>
              ) : (
                babyAppointments.map((appt) => (
                  <Swipeable
                    key={appt.id}
                    renderRightActions={() => renderApptRightActions(appt.id)}
                    friction={2}
                    rightThreshold={40}
                  >
                    <Card style={styles.apptCard}>
                      <View style={styles.apptHeader}>
                        <View style={styles.apptDateBadge}>
                          <Typography variant="label" weight="800" color="#4A5D4C">
                            {format(parseISO(appt.date), 'MMM').toUpperCase()}
                          </Typography>
                          <Typography variant="headline" weight="800" color="#4A5D4C">
                            {format(parseISO(appt.date), 'dd')}
                          </Typography>
                        </View>
                        <View style={{ flex: 1, marginLeft: 16 }}>
                          <Typography variant="bodyLg" weight="700" color="#1B3C35">{appt.title}</Typography>
                          <View style={styles.apptMetaRow}>
                             <User size={14} color="#607D8B" />
                             <Typography variant="label" color="#607D8B">Dr. {appt.doctor}</Typography>
                          </View>
                        </View>
                        <View style={styles.apptTimeTag}>
                          <Clock size={12} color="#89A08B" />
                          <Typography variant="label" weight="700" color="#89A08B">{appt.time}</Typography>
                        </View>
                      </View>
                      <View style={styles.reminderStatus}>
                         <AlertCircle size={14} color="#4CAF50" />
                         <Typography variant="label" weight="700" color="#4CAF50">Reminders: 7d, 2d, Today</Typography>
                      </View>
                    </Card>
                  </Swipeable>
                ))
              )}
            </>
          )}

          {activeTab === 'daycare' && (
            <>
              {/* Day Care Bag Section */}
              <View style={styles.sectionHeader}>
                 <Typography variant="label" weight="800" color="#90A4AE" style={{ letterSpacing: 1 }}>DAY CARE BAG</Typography>
                 <Briefcase size={20} color="#4A5D4C" />
              </View>

              {DAYCARE_BAG_ITEMS.map((item) => (
                <View key={item.id} style={[styles.taskCard, items.includes(item.id) && styles.taskCardCompleted]}>
                  <View style={[styles.taskIconContainer, { backgroundColor: '#E0F2F1' }]}>
                    <Package size={20} color="#009688" />
                  </View>
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
                    </View>
                    {items.includes(item.id) ? (
                      <CheckCircle size={24} color="#4CAF50" />
                    ) : (
                      <Circle size={24} color="#CFD8DC" />
                    )}
                  </Pressable>
                </View>
              ))}

              <View style={[styles.sectionHeader, { marginTop: 24 }]}>
                 <Typography variant="label" weight="800" color="#90A4AE" style={{ letterSpacing: 1 }}>DAILY REPORTS</Typography>
                 <TouchableOpacity onPress={() => setIsDayCareModalVisible(true)}>
                   <Plus size={20} color="#4A5D4C" />
                 </TouchableOpacity>
              </View>

              {babyDayCareLogs.length === 0 ? (
                <View style={styles.emptyState}>
                  <View style={styles.emptyIconCircle}>
                    <StickyNote size={32} color="#B0BEC5" />
                  </View>
                  <Typography variant="body" weight="600" color="#90A4AE">No reports logged yet</Typography>
                  <Typography variant="label" color="#B0BEC5" style={{ textAlign: 'center', marginTop: 8 }}>
                    Track drop-offs, pick-ups, and teacher notes here.
                  </Typography>
                </View>
              ) : (
                babyDayCareLogs.map((log) => (
                  <Swipeable
                    key={log.id}
                    renderRightActions={() => renderDayCareRightActions(log.id)}
                    friction={2}
                    rightThreshold={40}
                  >
                    <Card style={styles.dcCard}>
                      <View style={styles.dcHeader}>
                        <Typography variant="body" weight="700" color="#4A5D4C">
                          {format(parseISO(log.date), 'EEEE, MMM dd')}
                        </Typography>
                        <Briefcase size={16} color="#90A4AE" />
                      </View>
                      
                      <View style={styles.dcTimeRow}>
                        <View style={styles.dcTimeBlock}>
                          <LogIn size={14} color="#009688" />
                          <Typography variant="label" weight="700" color="#009688">
                            IN: {log.dropOffTime || '--:--'}
                          </Typography>
                        </View>
                        <View style={styles.dcTimeBlock}>
                          <LogOut size={14} color="#EF5350" />
                          <Typography variant="label" weight="700" color="#EF5350">
                            OUT: {log.pickUpTime || '--:--'}
                          </Typography>
                        </View>
                      </View>

                      {log.notes && (
                        <View style={styles.dcNotes}>
                          <Typography variant="label" color="#607D8B" style={{ fontStyle: 'italic' }}>
                            "{log.notes}"
                          </Typography>
                        </View>
                      )}
                    </Card>
                  </Swipeable>
                ))
              )}
            </>
          )}

          <View style={{ marginTop: 40, paddingBottom: 40 }}>
            <Typography 
              variant="label" 
              color="#B0BEC5" 
              style={{ textAlign: 'center', paddingHorizontal: 40, lineHeight: 18 }}
            >
              {activeTab === 'tasks' && "Tap the bell icon on any task to adjust its daily notification time."}
              {activeTab === 'appointments' && "Reminders are automatically scheduled 1 week, 2 days, and on the day of the visit."}
              {activeTab === 'daycare' && "Keep track of the daily hand-off and ensure the bag is packed with essentials."}
            </Typography>
          </View>
        </ScrollView>

        {/* Modals remain similar, adding Day Care Modal */}
        <Modal visible={isAddStandardModalVisible} transparent animationType="slide">
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Typography variant="headline" weight="700" color="#1B3C35">New Task</Typography>
                <TouchableOpacity onPress={() => setIsAddStandardModalVisible(false)}><X size={24} color="#1B3C35" /></TouchableOpacity>
              </View>
              <View style={styles.modalBody}>
                <View style={styles.inputSection}>
                  <Typography variant="label" weight="700" color="#90A4AE">NAME</Typography>
                  <TextInput style={styles.textInput} placeholder="e.g., Tummy Time" value={newTitle} onChangeText={setNewTitle} autoFocus />
                </View>
                <View style={styles.inputSection}>
                  <Typography variant="label" weight="700" color="#90A4AE">TIME</Typography>
                  <TextInput style={styles.textInput} placeholder="08:30 AM" value={newTime} onChangeText={setNewTime} />
                </View>
                <TouchableOpacity style={styles.saveBtn} onPress={handleAddUserStandardTask}>
                  <Typography variant="bodyLg" weight="700" color="#fff">Create Task</Typography>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>

        <Modal visible={isAppointmentModalVisible} transparent animationType="slide">
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Typography variant="headline" weight="700" color="#1B3C35">New Visit</Typography>
                <TouchableOpacity onPress={() => setIsAppointmentModalVisible(false)}><X size={24} color="#1B3C35" /></TouchableOpacity>
              </View>
              <View style={styles.modalBody}>
                <TextInput style={styles.textInput} placeholder="Purpose (e.g. Wellness Check)" value={apptTitle} onChangeText={setApptTitle} />
                <TextInput style={styles.textInput} placeholder="Doctor Name" value={apptDoctor} onChangeText={setApptDoctor} />
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <TextInput style={[styles.textInput, { flex: 1 }]} placeholder="Date (YYYY-MM-DD)" value={apptDate} onChangeText={setApptDate} />
                  <TextInput style={[styles.textInput, { flex: 1 }]} placeholder="Time" value={apptTime} onChangeText={setApptTime} />
                </View>
                <TouchableOpacity style={styles.saveBtn} onPress={handleAddAppointment}>
                  <Typography variant="bodyLg" weight="700" color="#fff">Schedule Visit</Typography>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>

        <Modal visible={isDayCareModalVisible} transparent animationType="slide">
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Typography variant="headline" weight="700" color="#1B3C35">Day Care Report</Typography>
                <TouchableOpacity onPress={() => setIsDayCareModalVisible(false)}><X size={24} color="#1B3C35" /></TouchableOpacity>
              </View>
              <View style={styles.modalBody}>
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <View style={{ flex: 1 }}>
                    <Typography variant="label" weight="700" color="#90A4AE">DROP OFF</Typography>
                    <TextInput style={styles.textInput} placeholder="08:00 AM" value={dcDropOff} onChangeText={setDcDropOff} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Typography variant="label" weight="700" color="#90A4AE">PICK UP</Typography>
                    <TextInput style={styles.textInput} placeholder="05:00 PM" value={dcPickUp} onChangeText={setDcPickUp} />
                  </View>
                </View>
                <View style={styles.inputSection}>
                  <Typography variant="label" weight="700" color="#90A4AE">TEACHER NOTES / UPDATES</Typography>
                  <TextInput style={[styles.textInput, { height: 100, textAlignVertical: 'top' }]} placeholder="e.g., Ate well, napped 2 hours." value={dcNotes} onChangeText={setDcNotes} multiline />
                </View>
                <TouchableOpacity style={styles.saveBtn} onPress={handleAddDayCareLog}>
                  <Typography variant="bodyLg" weight="700" color="#fff">Save Report</Typography>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>

        <Modal visible={isStandardModalVisible} transparent animationType="slide">
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Typography variant="headline" weight="700" color="#1B3C35">{selectedTask?.title}</Typography>
                <TouchableOpacity onPress={() => setIsStandardModalVisible(false)}><X size={24} color="#1B3C35" /></TouchableOpacity>
              </View>
              <View style={styles.modalBody}>
                <TextInput style={styles.textInput} placeholder="09:00 AM" value={newTime} onChangeText={setNewTime} />
                <TouchableOpacity style={styles.saveBtn} onPress={handleUpdateStandardTask}>
                  <Typography variant="bodyLg" weight="700" color="#fff">Save Notification</Typography>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#fff',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  tab: {
    paddingBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: { borderBottomColor: '#4A5D4C' },
  progressCard: {
    marginVertical: 20,
    padding: 20,
    borderRadius: 24,
    backgroundColor: '#fff',
  },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  progressBadge: { backgroundColor: '#C69C82', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  progressBarBg: { height: 8, backgroundColor: '#F0F0F0', borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#C69C82' },
  content: { paddingHorizontal: 20, paddingBottom: 60 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, marginTop: 12 },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
  },
  taskPressArea: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  taskCardCompleted: { opacity: 0.6 },
  taskIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FBE9E7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  taskInfo: { flex: 1 },
  taskActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  actionIcon: { padding: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: 48 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 },
  modalBody: { gap: 24 },
  inputSection: { gap: 12 },
  textInput: { fontSize: 18, padding: 16, backgroundColor: '#F8FAFB', borderRadius: 16, color: '#1B3C35' },
  saveBtn: { backgroundColor: '#4A5D4C', padding: 20, borderRadius: 20, alignItems: 'center' },
  deleteAction: { backgroundColor: '#FF5252', justifyContent: 'center', alignItems: 'center', width: 80, height: '84%', borderRadius: 20, marginBottom: 12 },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, backgroundColor: '#fff', borderRadius: 32, marginTop: 12 },
  emptyIconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#F5F7F8', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  apptCard: { padding: 20, borderRadius: 28, backgroundColor: '#fff', marginBottom: 16 },
  apptHeader: { flexDirection: 'row', alignItems: 'center' },
  apptDateBadge: { width: 64, height: 64, borderRadius: 16, backgroundColor: '#E8F1E9', alignItems: 'center', justifyContent: 'center' },
  apptMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  apptTimeTag: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F8E9', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, gap: 6 },
  reminderStatus: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#F5F5F5' },
  dcCard: { padding: 20, borderRadius: 24, backgroundColor: '#fff', marginBottom: 16 },
  dcHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  dcTimeRow: { flexDirection: 'row', gap: 16, marginBottom: 12 },
  dcTimeBlock: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#F8FAFB', padding: 10, borderRadius: 12, flex: 1 },
  dcNotes: { backgroundColor: '#FFF9C4', padding: 12, borderRadius: 12 },
});
