import React, { useState } from 'react';
import { 
  Pressable, 
  ScrollView, 
  StyleSheet, 
  TouchableOpacity, 
  View, 
  TextInput,
  Platform,
  Alert,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  Modal,
  Dimensions
} from 'react-native';
import { Swipeable, RectButton } from 'react-native-gesture-handler';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import Typography from '@/components/Typography';
import Card from '@/components/Card';
import { 
  ShieldCheck, 
  Syringe, 
  Pill, 
  Calendar, 
  Info,
  ArrowLeft,
  Plus,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  CheckCircle,
  Trash2,
  Lock,
  Unlock
} from 'lucide-react-native';
import { useBabyStore } from '@/store/useBabyStore';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';

const WHO_VACCINATIONS = [
  { id: 'v1', title: 'BCG (Tuberculosis)', period: 'At Birth' },
  { id: 'v2', title: 'HepB (Hepatitis B)', period: 'At Birth' },
  { id: 'v3', title: 'DTP 1 (Diphtheria)', period: '6 Weeks' },
  { id: 'v4', title: 'Polio 1 (OPV/IPV)', period: '6 Weeks' },
  { id: 'v5', title: 'Rotavirus 1', period: '6 Weeks' },
  { id: 'v6', title: 'DTP 2 / Polio 2', period: '10 Weeks' },
  { id: 'v7', title: 'DTP 3 / Polio 3', period: '14 Weeks' },
  { id: 'v8', title: 'Measles 1 / MR', period: '9 Months' },
  { id: 'v9', title: 'DTP Booster / MMR', period: '15-18 Months' },
];

const { width: SCREEN_WIDTH } = Dimensions.get('window');

function DateTimePickerModal({ onClose, onSelect, initialDate }: any) {
  const colorScheme = useColorScheme() ?? 'light';
  const themeColors = Colors[colorScheme];
  const [selectedDate, setSelectedDate] = useState<Date>(initialDate || new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(initialDate || new Date());
  
  const [hours, setHours] = useState(format(selectedDate, 'hh'));
  const [minutes, setMinutes] = useState(format(selectedDate, 'mm'));
  const [ampm, setAmpm] = useState(format(selectedDate, 'a'));

  const moveMonth = (amount: number) => {
    const next = new Date(currentMonth);
    next.setMonth(next.getMonth() + amount);
    setCurrentMonth(next);
  };

  const moveYear = (amount: number) => {
    const next = new Date(currentMonth);
    next.setFullYear(next.getFullYear() + amount);
    setCurrentMonth(next);
  };

  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  const startDay = startOfMonth(currentMonth).getDay();
  const emptyDays = Array(startDay).fill(null);

  const handleConfirm = () => {
    const finalDate = new Date(selectedDate);
    let h = parseInt(hours);
    if (ampm === 'PM' && h < 12) h += 12;
    if (ampm === 'AM' && h === 12) h = 0;
    finalDate.setHours(h);
    finalDate.setMinutes(parseInt(minutes));
    onSelect(finalDate);
  };

  return (
    <View style={StyleSheet.absoluteFill}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
            <View style={[styles.calendarModal, { backgroundColor: '#fff' }]}>
              <View style={styles.calendarHeader}>
                <TouchableOpacity onPress={() => moveYear(-1)} style={styles.navBtnSmall}>
                  <ChevronsLeft size={20} color="#4A5D4C" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => moveMonth(-1)} style={styles.navBtnSmall}>
                  <ChevronLeft size={20} color="#4A5D4C" />
                </TouchableOpacity>
                
                <View style={{ flex: 1, alignItems: 'center' }}>
                  <Typography variant="bodyLg" weight="800" color="#1B3C35">{format(currentMonth, 'MMMM yyyy')}</Typography>
                </View>

                <TouchableOpacity onPress={() => moveMonth(1)} style={styles.navBtnSmall}>
                  <ChevronRight size={20} color="#4A5D4C" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => moveYear(1)} style={styles.navBtnSmall}>
                  <ChevronsRight size={20} color="#4A5D4C" />
                </TouchableOpacity>
              </View>

              <View style={styles.daysGrid}>
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                  <Typography key={i} variant="label" weight="800" style={styles.dayLabel}>{day}</Typography>
                ))}
                {emptyDays.map((_, i) => <View key={i} style={styles.dayCell} />)}
                {days.map((day) => (
                  <TouchableOpacity 
                    key={day.toISOString()} 
                    style={[
                      styles.dayCell, 
                      isSameDay(day, selectedDate) && { backgroundColor: '#4A5D4C', shadowColor: '#4A5D4C', shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 }
                    ]}
                    onPress={() => setSelectedDate(day)}
                  >
                    <Typography variant="bodyMd" weight="800" color={isSameDay(day, selectedDate) ? '#fff' : '#455A64'}>
                      {format(day, 'd')}
                    </Typography>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.timePickerContainer}>
                <Typography variant="label" weight="800" color="#90A4AE" style={{ marginBottom: 12 }}>SELECT TIME</Typography>
                <View style={styles.timeRow}>
                  <View style={styles.timeInputGroup}>
                    <TextInput 
                      style={styles.timeInput}
                      value={hours}
                      onChangeText={setHours}
                      keyboardType="numeric"
                      maxLength={2}
                    />
                    <Typography variant="body" weight="700">:</Typography>
                    <TextInput 
                      style={styles.timeInput}
                      value={minutes}
                      onChangeText={setMinutes}
                      keyboardType="numeric"
                      maxLength={2}
                    />
                  </View>
                  <View style={styles.ampmGroup}>
                    {['AM', 'PM'].map((p) => (
                      <TouchableOpacity 
                        key={p} 
                        style={[styles.ampmBtn, ampm === p && { backgroundColor: themeColors.primary }]}
                        onPress={() => setAmpm(p)}
                      >
                        <Typography variant="label" weight="700" color={ampm === p ? '#fff' : '#607D8B'}>{p}</Typography>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>
              
              <View style={styles.modalFooter}>
                <TouchableOpacity style={styles.cancelModalBtn} onPress={onClose}>
                  <Typography variant="label" weight="700" color="#90A4AE">Cancel</Typography>
                </TouchableOpacity>
                <TouchableOpacity style={styles.confirmModalBtn} onPress={handleConfirm}>
                  <Typography variant="label" weight="700" color="#fff">Set Date & Time</Typography>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </View>
  );
}

export default function MedicalLogScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? 'light';
  const themeColors = Colors[colorScheme];
  const { addActivity, updateActivity, deleteActivity, babies, currentBabyId, activities } = useBabyStore();
  const currentBaby = babies.find(b => b.id === currentBabyId);
  const babyActivities = activities.filter(a => a.babyId === currentBabyId);

  const [activeTab, setActiveTab] = useState<'VACCINE' | 'MEDICINE'>('VACCINE');
  const [isVaccineModalVisible, setIsVaccineModalVisible] = useState(false);
  const [isDatePickerVisible, setIsDatePickerVisible] = useState(false);
  const [dateTarget, setDateTarget] = useState<'VACCINE' | 'MEDICINE'>('VACCINE');
  const [isSuccess, setIsSuccess] = useState(false);
  
  // Vaccine State
  const [vaccineName, setVaccineName] = useState('');
  const [vaccineDate, setVaccineDate] = useState(new Date());
  const [editingActivityId, setEditingActivityId] = useState<string | null>(null);
  
  // Medicine State
  const [medicineName, setMedicineName] = useState('');
  const [dosage, setDosage] = useState('');
  const [reason, setReason] = useState('');
  const [medicineDate, setMedicineDate] = useState(new Date());

  const handleSaveVaccine = () => {
    if (!vaccineName.trim()) return;
    
    if (editingActivityId) {
      updateActivity(editingActivityId, {
        timestamp: vaccineDate,
        details: {
          name: vaccineName,
          date: format(vaccineDate, 'yyyy-MM-dd'),
        },
      });
    } else {
      addActivity({
        type: 'vaccination',
        timestamp: vaccineDate,
        details: {
          name: vaccineName,
          date: format(vaccineDate, 'yyyy-MM-dd'),
        },
      });
    }
    
    setIsSuccess(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(() => {
      setVaccineName('');
      setEditingActivityId(null);
      setIsSuccess(false);
      setIsVaccineModalVisible(false);
    }, 1000);
  };

  const openVaccineEntry = (name = '', activity?: any) => {
    setVaccineName(name);
    if (activity) {
      setVaccineDate(new Date(activity.timestamp));
      setEditingActivityId(activity.id);
    } else {
      setVaccineDate(new Date());
      setEditingActivityId(null);
    }
    setIsVaccineModalVisible(true);
  };

  const showDatePicker = (target: 'VACCINE' | 'MEDICINE') => {
    setDateTarget(target);
    setIsDatePickerVisible(true);
  };

  const handleDateSelect = (date: Date) => {
    if (dateTarget === 'VACCINE') setVaccineDate(date);
    else setMedicineDate(date);
    setIsDatePickerVisible(false);
  };

  const handleSaveMedicine = () => {
    if (!medicineName.trim() || !reason.trim()) return;
    
    addActivity({
      type: 'medicine',
      timestamp: medicineDate,
      details: {
        name: medicineName,
        dosage: dosage,
        reason: reason,
        date: format(medicineDate, 'yyyy-MM-dd'),
      },
    });
    
    setIsSuccess(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(() => {
      setIsSuccess(false);
      setMedicineName('');
      setDosage('');
      setReason('');
    }, 1000);
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={[styles.container, { backgroundColor: '#F8FAFB', paddingTop: insets.top }]}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <ArrowLeft size={24} color="#1B3C35" />
            </TouchableOpacity>
            <View style={{ alignItems: 'center' }}>
              <Typography variant="headline" weight="700" style={{ color: '#1B3C35' }}>Medical Records</Typography>
              <Typography variant="label" color="#607D8B">Clinical History for {currentBaby?.name || 'Baby'}</Typography>
            </View>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {/* Tab Selector */}
            <View style={styles.tabContainer}>
              <TouchableOpacity 
                style={[styles.tab, activeTab === 'VACCINE' ? styles.activeTab : null]} 
                onPress={() => setActiveTab('VACCINE')}
              >
                <Syringe size={20} color={activeTab === 'VACCINE' ? '#fff' : '#607D8B'} />
                <Typography weight="700" color={activeTab === 'VACCINE' ? '#fff' : '#607D8B'}>Vaccination</Typography>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.tab, activeTab === 'MEDICINE' ? styles.activeTab : null]} 
                onPress={() => setActiveTab('MEDICINE')}
              >
                <Pill size={20} color={activeTab === 'MEDICINE' ? '#fff' : '#607D8B'} />
                <Typography weight="700" color={activeTab === 'MEDICINE' ? '#fff' : '#607D8B'}>Medicine</Typography>
              </TouchableOpacity>
            </View>

            {activeTab === 'VACCINE' ? (
              <View style={styles.vaccineListContainer}>
                <View style={styles.sectionHeader}>
                  <View>
                    <Typography variant="label" weight="800" color="#90A4AE" style={{ letterSpacing: 1.5 }}>WORLD HEALTH ORGANIZATION</Typography>
                    <Typography variant="bodyMd" weight="700" color="#4A5D4C">Clinical Immunization Schedule</Typography>
                  </View>
                  <TouchableOpacity onPress={() => openVaccineEntry()} style={styles.addBtnCircle}>
                    <Plus size={24} color="#fff" />
                  </TouchableOpacity>
                </View>

                {WHO_VACCINATIONS.map((v) => (
                  <VaccineRow 
                    key={v.id}
                    title={v.title}
                    period={v.period}
                    record={babyActivities.find(a => 
                      a.type === 'vaccination' && 
                      (a.details?.name?.toLowerCase().includes(v.title.toLowerCase().split(' (')[0]) || 
                       v.title.toLowerCase().includes(a.details?.name?.toLowerCase() || ''))
                    )}
                    onPress={() => openVaccineEntry(v.title)}
                    onDelete={(id: string) => deleteActivity(id)}
                  />
                ))}

                {/* Additional Vaccinations */}
                {(() => {
                  const otherVaccines = babyActivities.filter(a => 
                    a.type === 'vaccination' && 
                    !WHO_VACCINATIONS.some(v => 
                      a.details?.name?.toLowerCase().includes(v.title.toLowerCase().split(' (')[0]) || 
                      v.title.toLowerCase().includes(a.details?.name?.toLowerCase() || '')
                    )
                  );

                  if (otherVaccines.length === 0) return null;

                  return (
                    <View style={{ marginTop: 24, gap: 12 }}>
                      <Typography variant="label" weight="800" color="#90A4AE" style={{ letterSpacing: 1.5, marginLeft: 4 }}>ADDITIONAL IMMUNIZATIONS</Typography>
                      {otherVaccines.map((v) => (
                        <VaccineRow 
                          key={v.id}
                          title={v.details?.name || 'Unknown Vaccine'}
                          period="Custom Entry"
                          record={v}
                          onPress={() => openVaccineEntry(v.details?.name, v)}
                          onDelete={(id: string) => deleteActivity(id)}
                        />
                      ))}
                    </View>
                  );
                })()}
              </View>
            ) : (
              <View style={styles.formContainer}>
                {/* Medicine Entry Form */}
                <Card style={styles.formCard}>
                  <View style={styles.inputGroup}>
                    <Typography variant="label" weight="700" color="#90A4AE" style={{ marginBottom: 8 }}>MEDICINE NAME</Typography>
                    <TextInput 
                      style={styles.textInput}
                      placeholder="e.g., Paracetamol"
                      value={medicineName}
                      onChangeText={setMedicineName}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Typography variant="label" weight="700" color="#90A4AE" style={{ marginBottom: 8 }}>DOSAGE</Typography>
                    <TextInput 
                      style={styles.textInput}
                      placeholder="e.g., 2.5ml"
                      value={dosage}
                      onChangeText={setDosage}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Typography variant="label" weight="700" color="#90A4AE" style={{ marginBottom: 8 }}>REASON FOR MEDICINE</Typography>
                    <TextInput 
                      style={[styles.textInput, { height: 80, textAlignVertical: 'top', paddingTop: 12 }]}
                      placeholder="e.g., Fever, Teething pain"
                      value={reason}
                      onChangeText={setReason}
                      multiline
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Typography variant="label" weight="700" color="#90A4AE" style={{ marginBottom: 8 }}>DATE & TIME</Typography>
                    <TouchableOpacity style={styles.dateDisplay} onPress={() => showDatePicker('MEDICINE')}>
                      <Calendar size={18} color="#607D8B" />
                      <Typography variant="body" color="#1B3C35">{format(medicineDate, 'PPP p')}</Typography>
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity 
                    style={[styles.saveBtn, (!medicineName.trim() || !reason.trim()) && { opacity: 0.5 }, isSuccess && { backgroundColor: '#4CAF50' }]} 
                    onPress={handleSaveMedicine}
                    disabled={!medicineName.trim() || !reason.trim() || isSuccess}
                  >
                    {isSuccess ? (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <CheckCircle size={24} color="#fff" />
                        <Typography variant="bodyLg" weight="700" color="#fff">Recorded</Typography>
                      </View>
                    ) : (
                      <Typography variant="bodyLg" weight="700" color="#fff">Lock Medical Entry</Typography>
                    )}
                  </TouchableOpacity>
                </Card>

                {/* Medicine History (Moved back to bottom) */}
                <View style={{ gap: 12, marginTop: 24 }}>
                  <Typography variant="label" weight="800" color="#90A4AE" style={{ letterSpacing: 1.5, marginLeft: 4 }}>RECENT DOSAGES</Typography>
                  {babyActivities
                    .filter(a => a.type === 'medicine')
                    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                    .map((m) => (
                      <MedicineRow 
                        key={m.id}
                        medicine={m}
                        onDelete={(id: string) => deleteActivity(id)}
                      />
                    ))}
                </View>
              </View>
            )}
          </ScrollView>

          {/* Record Vaccination Modal */}
          <Modal visible={isVaccineModalVisible} transparent animationType="slide">
            <KeyboardAvoidingView 
              behavior={Platform.OS === 'ios' ? 'position' : 'height'}
              style={styles.modalOverlay}
            >
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <View>
                    <Typography variant="headline" weight="700" color="#1B3C35">Record Vaccination</Typography>
                    <Typography variant="label" color="#607D8B">Capture clinical immunization info</Typography>
                  </View>
                  <TouchableOpacity onPress={() => setIsVaccineModalVisible(false)} style={styles.closeBtn}>
                    <X size={24} color="#1B3C35" />
                  </TouchableOpacity>
                </View>

                <View style={styles.modalBody}>
                  <View style={styles.inputGroup}>
                    <Typography variant="label" weight="700" color="#90A4AE" style={{ marginBottom: 8 }}>VACCINE NAME</Typography>
                    <TextInput 
                      style={styles.textInput}
                      placeholder="e.g., 6-in-1 Vaccine"
                      value={vaccineName}
                      onChangeText={setVaccineName}
                      autoFocus={!vaccineName}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Typography variant="label" weight="700" color="#90A4AE" style={{ marginBottom: 8 }}>DATE & TIME GIVEN</Typography>
                    <TouchableOpacity style={styles.dateDisplay} onPress={() => showDatePicker('VACCINE')}>
                      <Calendar size={18} color="#607D8B" />
                      <Typography variant="body" color="#1B3C35">{format(vaccineDate, 'PPP • p')}</Typography>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.infoBox}>
                    <ShieldCheck size={20} color="#4CAF50" />
                    <Typography variant="label" color="#2E7D32" style={{ flex: 1 }}>
                      This record will be locked into {currentBaby?.name || 'baby'}'s permanent clinical timeline.
                    </Typography>
                  </View>

                  <TouchableOpacity 
                    style={[styles.saveBtn, !vaccineName.trim() && { opacity: 0.5 }, isSuccess && { backgroundColor: '#4CAF50' }]} 
                    onPress={handleSaveVaccine}
                    disabled={!vaccineName.trim() || isSuccess}
                  >
                    {isSuccess ? (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <CheckCircle size={24} color="#fff" />
                        <Typography variant="bodyLg" weight="700" color="#fff">Recorded</Typography>
                      </View>
                    ) : (
                      <Typography variant="bodyLg" weight="700" color="#fff">Record Vaccination</Typography>
                    )}
                  </TouchableOpacity>
                  {isDatePickerVisible && dateTarget === 'VACCINE' && (
                    <DateTimePickerModal 
                      onClose={() => setIsDatePickerVisible(false)}
                      onSelect={handleDateSelect}
                      initialDate={vaccineDate}
                    />
                  )}
                </View>
              </View>
            </KeyboardAvoidingView>
          </Modal>

          {isDatePickerVisible && dateTarget === 'MEDICINE' && (
            <DateTimePickerModal 
              onClose={() => setIsDatePickerVisible(false)}
              onSelect={handleDateSelect}
              initialDate={medicineDate}
            />
          )}
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

function MedicineRow({ medicine, onDelete }: any) {
  const [isLocked, setIsLocked] = useState(true);
  const colorScheme = useColorScheme() ?? 'light';
  const themeColors = Colors[colorScheme];

  const renderRightActions = () => (
    <RectButton 
      style={styles.deleteActionCompact} 
      onPress={() => onDelete(medicine.id)}
    >
      <Trash2 size={16} color="#fff" />
    </RectButton>
  );

  return (
    <Swipeable renderRightActions={renderRightActions} enabled={!isLocked}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
        <TouchableOpacity 
          onPress={() => setIsLocked(!isLocked)} 
          style={{ paddingRight: 8, paddingLeft: 4 }}
        >
          {isLocked ? (
            <Lock size={14} color="#90A4AE" />
          ) : (
            <Unlock size={14} color="#C69C82" />
          )}
        </TouchableOpacity>
        
        <TouchableOpacity 
          activeOpacity={0.7} 
          disabled={isLocked}
          style={{ flex: 1 }}
        >
          <Card style={[
            styles.vaccineCardCompact, 
            { flex: 1 },
            { borderLeftColor: '#C69C82', borderLeftWidth: 3, backgroundColor: isLocked ? '#F8FAFB' : '#FFF9F6' }
          ]}>
            <View style={{ flex: 1, gap: 2 }}>
              <Typography variant="label" weight="800" color="#90A4AE" style={{ fontSize: 7, textTransform: 'uppercase' }}>{medicine.details?.dosage || 'Dose'}</Typography>
              <Typography variant="body" weight="700" style={{ fontSize: 16, color: isLocked ? '#90A4AE' : '#1B3C35' }} numberOfLines={1}>{medicine.details?.name}</Typography>
            </View>
            
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Pill size={14} color={isLocked ? '#90A4AE' : '#C69C82'} />
              <Typography variant="label" weight="700" style={{ fontSize: 11, color: isLocked ? '#90A4AE' : '#8D6E63' }}>
                {format(new Date(medicine.timestamp), 'MMMM d, yyyy • h:mm a')}
              </Typography>
            </View>
          </Card>
        </TouchableOpacity>
      </View>
    </Swipeable>
  );
}

function VaccineRow({ title, period, record, onPress, onDelete }: any) {
  const [isLocked, setIsLocked] = useState(true);
  const colorScheme = useColorScheme() ?? 'light';
  const themeColors = Colors[colorScheme];

  const renderRightActions = () => (
    <RectButton 
      style={styles.deleteActionCompact} 
      onPress={() => record && onDelete(record.id)}
    >
      <Trash2 size={16} color="#fff" />
    </RectButton>
  );

  return (
    <Swipeable renderRightActions={renderRightActions} enabled={!isLocked && !!record}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
        <TouchableOpacity 
          onPress={() => record && setIsLocked(!isLocked)} 
          style={{ paddingRight: 8, paddingLeft: 4 }}
          disabled={!record}
        >
          {!record ? (
            <Lock size={14} color="#CFD8DC" />
          ) : isLocked ? (
            <Lock size={14} color="#90A4AE" />
          ) : (
            <Unlock size={14} color="#4CAF50" />
          )}
        </TouchableOpacity>
        
        <TouchableOpacity 
          activeOpacity={0.7} 
          onPress={onPress} 
          disabled={isLocked && !!record}
          style={{ flex: 1 }}
        >
          <Card style={[
            styles.vaccineCardCompact, 
            { flex: 1, padding: 16, borderRadius: 20 },
            record && { 
              borderLeftColor: '#4CAF50', 
              borderLeftWidth: 4, 
              backgroundColor: isLocked ? '#F8FAFB' : '#F1F8E9',
              shadowColor: '#4CAF50',
              shadowOpacity: 0.05
            }
          ]}>
            <View style={{ flex: 1, gap: 2 }}>
              <Typography variant="label" weight="800" color={record ? '#4CAF50' : '#B0BEC5'} style={{ fontSize: 8, textTransform: 'uppercase', letterSpacing: 1 }}>{period}</Typography>
              <Typography variant="body" weight="700" style={{ fontSize: 16, color: isLocked && record ? '#90A4AE' : '#1B3C35' }} numberOfLines={1}>{title}</Typography>
            </View>
            
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              {record ? (
                <View style={{ backgroundColor: isLocked ? '#ECEFF1' : '#E8F5E9', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Syringe size={12} color={isLocked ? '#90A4AE' : '#4CAF50'} />
                  <Typography variant="label" weight="800" style={{ fontSize: 11, color: isLocked ? '#607D8B' : '#2E7D32' }}>
                    {format(new Date(record.timestamp), 'MMM d')}
                  </Typography>
                </View>
              ) : (
                <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#F8FAFB', alignItems: 'center', justifyCenter: 'center', borderWidth: 1, borderColor: '#ECEFF1', borderStyle: 'dashed' }}>
                  <Plus size={16} color="#CFD8DC" />
                </View>
              )}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  content: {
    padding: 20,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#ECEFF1',
    borderRadius: 20,
    padding: 6,
    gap: 8,
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    gap: 8,
  },
  activeTab: {
    backgroundColor: '#4A5D4C',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  formContainer: {
    gap: 16,
  },
  formCard: {
    padding: 24,
    borderRadius: 32,
    gap: 24,
  },
  inputGroup: {
    gap: 4,
  },
  textInput: {
    backgroundColor: '#F8FAFB',
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    color: '#1B3C35',
    borderWidth: 1,
    borderColor: '#ECEFF1',
  },
  dateDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFB',
    borderRadius: 16,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: '#ECEFF1',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#E8F5E9',
    padding: 16,
    borderRadius: 20,
    gap: 12,
    alignItems: 'center',
  },
  saveBtn: {
    height: 64,
    backgroundColor: '#C69C82',
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  vaccineListContainer: {
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  addBtnCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#4A5D4C',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#ECEFF1',
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 1,
  },
  scheduleInfo: {
    flex: 1,
    gap: 2,
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  calendarModal: {
    width: SCREEN_WIDTH - 32,
    backgroundColor: '#fff',
    borderRadius: 40,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.15,
    shadowRadius: 30,
    elevation: 10,
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 8,
  },
  navBtnSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8FAFB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  dayLabel: {
    width: (SCREEN_WIDTH - 80) / 7,
    textAlign: 'center',
    marginBottom: 16,
    color: '#B0BEC5',
    fontSize: 13,
  },
  dayCell: {
    width: (SCREEN_WIDTH - 80) / 7,
    height: (SCREEN_WIDTH - 80) / 7,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    marginVertical: 2,
  },
  timePickerContainer: {
    marginTop: 16,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#F2F5F6',
    alignItems: 'center',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    marginTop: 8,
  },
  timeInputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFB',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#ECEFF1',
  },
  timeInput: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1B3C35',
    width: 44,
    textAlign: 'center',
  },
  timeSeparator: {
    fontSize: 24,
    fontWeight: '800',
    color: '#CFD8DC',
    paddingHorizontal: 4,
  },
  ampmGroup: {
    flexDirection: 'row',
    backgroundColor: '#F2F5F6',
    padding: 6,
    borderRadius: 20,
    gap: 4,
  },
  ampmBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 16,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginTop: 32,
    gap: 16,
  },
  cancelModalBtn: {
    flex: 1,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 28,
  },
  confirmModalBtn: {
    flex: 2,
    height: 56,
    backgroundColor: '#4A5D4C',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 28,
    shadowColor: '#4A5D4C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 20,
    gap: 16,
    borderWidth: 1,
    borderColor: '#ECEFF1',
  },
  historyIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8F1E9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteAction: {
    backgroundColor: '#FF5252',
    justifyContent: 'center',
    alignItems: 'center',
    width: 70,
    height: '100%',
    borderRadius: 24,
    marginLeft: 10,
  },
  vaccineCardCompact: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ECEFF1',
    backgroundColor: '#fff',
  },
  deleteActionCompact: {
    backgroundColor: '#FF5252',
    justifyContent: 'center',
    alignItems: 'center',
    width: 60,
    height: '100%',
    borderRadius: 12,
    marginLeft: 8,
    marginBottom: 8,
  },
});
