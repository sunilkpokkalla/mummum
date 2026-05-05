import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Modal,
  Dimensions,
  TextInput,
  TouchableWithoutFeedback,
} from 'react-native';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react-native';
import Typography from './Typography';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface DateTimePickerProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (date: Date) => void;
  initialDate?: Date;
  mode?: 'date' | 'datetime';
}

export default function DateTimePicker({ visible, onClose, onSelect, initialDate, mode = 'datetime' }: DateTimePickerProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(initialDate || new Date());
  const [viewDate, setViewDate] = useState<Date>(initialDate || new Date());
  
  const [hours, setHours] = useState(format(selectedDate, 'hh'));
  const [minutes, setMinutes] = useState(format(selectedDate, 'mm'));
  const [ampm, setAmpm] = useState(format(selectedDate, 'a'));

  const moveMonth = (offset: number) => {
    const next = new Date(viewDate);
    next.setMonth(next.getMonth() + offset);
    setViewDate(next);
  };

  const moveYear = (offset: number) => {
    const next = new Date(viewDate);
    next.setFullYear(next.getFullYear() + offset);
    setViewDate(next);
  };

  const days = eachDayOfInterval({
    start: startOfMonth(viewDate),
    end: endOfMonth(viewDate),
  });

  const startDay = startOfMonth(viewDate).getDay();
  const emptyDays = Array(startDay).fill(null);

  const handleConfirm = () => {
    const finalDate = new Date(selectedDate);
    if (mode === 'datetime') {
      let h = parseInt(hours);
      if (ampm === 'PM' && h < 12) h += 12;
      if (ampm === 'AM' && h === 12) h = 0;
      finalDate.setHours(h);
      finalDate.setMinutes(parseInt(minutes));
    }
    onSelect(finalDate);
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <View style={styles.navGroup}>
                  <TouchableOpacity onPress={() => moveYear(-1)}><ChevronsLeft size={20} color="#1B3C35" /></TouchableOpacity>
                  <TouchableOpacity onPress={() => moveMonth(-1)}><ChevronLeft size={20} color="#1B3C35" /></TouchableOpacity>
                </View>
                <Typography variant="body" weight="800" color="#1B3C35">{format(viewDate, 'MMMM yyyy')}</Typography>
                <View style={styles.navGroup}>
                  <TouchableOpacity onPress={() => moveMonth(1)}><ChevronRight size={20} color="#1B3C35" /></TouchableOpacity>
                  <TouchableOpacity onPress={() => moveYear(1)}><ChevronsRight size={20} color="#1B3C35" /></TouchableOpacity>
                </View>
              </View>

              <View style={styles.daysGrid}>
                {['S','M','T','W','T','F','S'].map((d, i) => (
                  <Typography key={i} style={styles.dayHeader}>{d}</Typography>
                ))}
                {emptyDays.map((_, i) => <View key={`e-${i}`} style={styles.dayBox} />)}
                {days.map((day) => {
                  const isSelected = isSameDay(day, selectedDate);
                  return (
                    <TouchableOpacity 
                      key={day.toISOString()} 
                      style={[styles.dayBox, isSelected && styles.selectedDay]}
                      onPress={() => setSelectedDate(day)}
                    >
                      <Typography variant="label" weight="800" color={isSelected ? '#fff' : '#1B3C35'}>
                        {format(day, 'd')}
                      </Typography>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {mode === 'datetime' && (
                <View style={styles.timeSection}>
                  <Typography variant="label" weight="800" color="#90A4AE" style={{ marginBottom: 12 }}>TIME</Typography>
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
                          style={[styles.ampmBtn, ampm === p && styles.ampmBtnActive]}
                          onPress={() => setAmpm(p)}
                        >
                          <Typography variant="label" weight="800" color={ampm === p ? '#fff' : '#607D8B'}>{p}</Typography>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </View>
              )}

              <View style={styles.modalFooter}>
                <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                  <Typography variant="body" weight="800" color="#90A4AE">Cancel</Typography>
                </TouchableOpacity>
                <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm}>
                  <Typography variant="body" weight="800" color="#fff">Confirm</Typography>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center', alignItems: 'center',
  },
  modalCard: {
    backgroundColor: '#fff', borderRadius: 32,
    padding: 24, width: SCREEN_WIDTH - 48,
    shadowColor: '#000', shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2, shadowRadius: 20, elevation: 20,
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 20,
  },
  navGroup: { flexDirection: 'row', gap: 12 },
  daysGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  dayHeader: {
    width: (SCREEN_WIDTH - 96) / 7,
    textAlign: 'center', color: '#B0BEC5', fontSize: 12, fontWeight: '800', marginBottom: 12,
  },
  dayBox: {
    width: (SCREEN_WIDTH - 96) / 7,
    height: 40, alignItems: 'center', justifyContent: 'center',
    marginBottom: 4,
  },
  selectedDay: {
    backgroundColor: '#1B3C35', borderRadius: 12,
  },
  timeSection: {
    marginTop: 20, paddingTop: 20, borderTopWidth: 1, borderTopColor: '#F1F5F9',
  },
  timeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  timeInputGroup: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  timeInput: {
    width: 50, height: 44, backgroundColor: '#F8FAFB', borderRadius: 12,
    textAlign: 'center', fontSize: 18, fontWeight: '700', color: '#1B3C35',
  },
  ampmGroup: { flexDirection: 'row', backgroundColor: '#F8FAFB', borderRadius: 12, padding: 4 },
  ampmBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  ampmBtnActive: { backgroundColor: '#1B3C35' },
  modalFooter: {
    flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 24,
  },
  cancelBtn: { padding: 12 },
  confirmBtn: {
    backgroundColor: '#1B3C35', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 16,
  },
});
