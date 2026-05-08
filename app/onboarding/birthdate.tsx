import React, { useState } from 'react';
import { StyleSheet, View, TouchableOpacity, Dimensions, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import Typography from '@/components/Typography';
import { useBabyStore } from '@/store/useBabyStore';
import { ArrowRight, Calendar as CalendarIcon, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function BirthDateScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? 'light';
  const themeColors = Colors[colorScheme];
  const { updateTempBaby, tempBaby } = useBabyStore();
  
  const initialDate = tempBaby.birthDate ? new Date(tempBaby.birthDate) : new Date();
  const [selectedDate, setSelectedDate] = useState<Date>(initialDate);
  const [currentMonth, setCurrentMonth] = useState<Date>(initialDate);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleNext = () => {
    updateTempBaby({ birthDate: selectedDate });
    router.push('/onboarding/wishes');
  };

  const moveMonth = (amount: number) => {
    const next = new Date(currentMonth);
    next.setMonth(next.getMonth() + amount);
    setCurrentMonth(next);
    setRefreshKey(prev => prev + 1);
  };

  const moveYear = (amount: number) => {
    const next = new Date(currentMonth);
    next.setFullYear(next.getFullYear() + amount);
    setCurrentMonth(next);
    setRefreshKey(prev => prev + 1);
  };

  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  const startDay = startOfMonth(currentMonth).getDay();
  const emptyDays = Array(startDay).fill(null);

  // CELL SIZE Calculation
  const CAL_WIDTH = Math.min(SCREEN_WIDTH - 48, 500);
  const CELL_SIZE = (CAL_WIDTH - 40) / 7;

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background, borderColor: 'red', borderWidth: 5 }]}>
      
      {/* DIAGNOSTIC BUTTON AT THE TOP */}
      <View style={{ padding: 20, zIndex: 100, backgroundColor: 'yellow' }}>
         <TouchableOpacity 
            style={[styles.button, { backgroundColor: 'red' }]}
            onPress={handleNext}
          >
            <Typography variant="bodyLg" weight="700" style={{ color: '#fff' }}>DEBUG: CLICK ME TO CONTINUE</Typography>
          </TouchableOpacity>
      </View>

      <ScrollView 
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20 }}
      >
        <Typography variant="display">Screen: {Math.round(SCREEN_WIDTH)}x{Math.round(SCREEN_HEIGHT)}</Typography>
        <Typography variant="body">Baby Name: {tempBaby.name}</Typography>

        <View style={[styles.calendarContainer, { backgroundColor: themeColors.surface, width: CAL_WIDTH, alignSelf: 'center' }]}>
            <View style={styles.calendarHeader}>
              <View style={styles.navGroup}>
                <TouchableOpacity onPressIn={() => moveYear(-1)} style={styles.navButton}><ChevronsLeft color={themeColors.primary} /></TouchableOpacity>
                <TouchableOpacity onPressIn={() => moveMonth(-1)} style={styles.navButton}><ChevronLeft color={themeColors.primary} /></TouchableOpacity>
              </View>
              <Typography weight="800">{format(currentMonth, 'MMMM yyyy')}</Typography>
              <View style={styles.navGroup}>
                <TouchableOpacity onPressIn={() => moveMonth(1)} style={styles.navButton}><ChevronRight color={themeColors.primary} /></TouchableOpacity>
                <TouchableOpacity onPressIn={() => moveYear(1)} style={styles.navButton}><ChevronsRight color={themeColors.primary} /></TouchableOpacity>
              </View>
            </View>

            <View key={`grid-${refreshKey}`} style={styles.daysGrid}>
              {days.map((day) => {
                const isSame = isSameDay(day, selectedDate);
                return (
                  <TouchableOpacity 
                    key={day.toISOString()} 
                    style={[styles.dayCell, { width: CELL_SIZE, height: CELL_SIZE }, isSame && { backgroundColor: themeColors.primary }]}
                    onPress={() => setSelectedDate(day)}
                  >
                    <Typography style={{ color: isSame ? '#fff' : themeColors.text }}>{format(day, 'd')}</Typography>
                  </TouchableOpacity>
                );
              })}
            </View>
        </View>
      </ScrollView>

      {/* ORIGINAL FOOTER (STILL HERE TO TEST) */}
      <View style={[styles.fixedFooter, { paddingBottom: insets.bottom + 20, backgroundColor: 'green' }]}>
          <TouchableOpacity 
            style={[styles.button, { backgroundColor: themeColors.primary }]}
            onPress={handleNext}
          >
            <Typography variant="bodyLg" weight="700" style={{ color: '#fff' }}>Confirm Date (Green Area)</Typography>
          </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  calendarContainer: {
    borderRadius: 20,
    padding: 10,
    marginVertical: 20,
    elevation: 4,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  navGroup: {
    flexDirection: 'row',
    gap: 10,
  },
  navButton: {
    padding: 10,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  fixedFooter: {
    padding: 20,
  },
  button: {
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
