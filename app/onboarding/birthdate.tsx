import React, { useState } from 'react';
import { StyleSheet, View, TouchableOpacity, Dimensions, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import Typography from '@/components/Typography';
import { useBabyStore } from '@/store/useBabyStore';
import { ArrowRight, Calendar as CalendarIcon, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IS_TABLET = SCREEN_WIDTH > 600;
const MAX_CONTENT_WIDTH = IS_TABLET ? 800 : 500;
const ACTUAL_CONTENT_WIDTH = Math.min(SCREEN_WIDTH - 48, MAX_CONTENT_WIDTH);

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

  const handleNext = () => {
    updateTempBaby({ birthDate: selectedDate });
    router.push('/onboarding/wishes');
  };

  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  const startDay = startOfMonth(currentMonth).getDay();
  const emptyDays = Array(startDay).fill(null);

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background, paddingTop: insets.top }]}>
      <ScrollView 
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        <View style={[styles.content, IS_TABLET && styles.tabletContent]}>
          <Animated.View entering={FadeInDown.delay(100).duration(800)} style={styles.iconContainer}>
            <View style={[styles.iconCircle, { backgroundColor: themeColors.secondary + '15' }]}>
              <CalendarIcon size={IS_TABLET ? 40 : 32} color={themeColors.secondary} />
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(200).duration(800)}>
            <Typography variant="display" style={[styles.title, IS_TABLET && { fontSize: 42, lineHeight: 50 }]}>
              When was {tempBaby.name || 'your baby'} born?
            </Typography>
            <Typography variant="bodyLg" color={themeColors.icon} style={styles.subtitle}>
              Select the date to continue.
            </Typography>
          </Animated.View>

          <View style={[styles.calendarContainer, { backgroundColor: themeColors.surface }]}>
            <View style={styles.calendarHeader}>
              <View style={styles.navGroup}>
                <TouchableOpacity 
                  onPressIn={() => moveYear(-1)} 
                  style={[styles.navButton, { backgroundColor: themeColors.primary + '10', borderColor: themeColors.primary + '20' }]} 
                  activeOpacity={0.4}
                >
                  <ChevronsLeft size={IS_TABLET ? 24 : 20} color={themeColors.primary} />
                </TouchableOpacity>
                <TouchableOpacity 
                  onPressIn={() => moveMonth(-1)} 
                  style={[styles.navButton, { backgroundColor: themeColors.primary + '10', borderColor: themeColors.primary + '20' }]} 
                  activeOpacity={0.4}
                >
                  <ChevronLeft size={IS_TABLET ? 24 : 20} color={themeColors.primary} />
                </TouchableOpacity>
              </View>
              
              <View style={styles.monthDisplay}>
                <Typography variant="display" weight="800" style={[styles.monthLabel, IS_TABLET && { fontSize: 24 }]}>
                  {format(currentMonth, 'MMMM')}
                </Typography>
                <Typography variant="bodyLg" weight="600" color={themeColors.icon}>
                  {format(currentMonth, 'yyyy')}
                </Typography>
              </View>
              
              <View style={styles.navGroup}>
                <TouchableOpacity 
                  onPressIn={() => moveMonth(1)} 
                  style={[styles.navButton, { backgroundColor: themeColors.primary + '10', borderColor: themeColors.primary + '20' }]} 
                  activeOpacity={0.4}
                >
                  <ChevronRight size={IS_TABLET ? 24 : 20} color={themeColors.primary} />
                </TouchableOpacity>
                <TouchableOpacity 
                  onPressIn={() => moveYear(1)} 
                  style={[styles.navButton, { backgroundColor: themeColors.primary + '10', borderColor: themeColors.primary + '20' }]} 
                  activeOpacity={0.4}
                >
                  <ChevronsRight size={IS_TABLET ? 24 : 20} color={themeColors.primary} />
                </TouchableOpacity>
              </View>
            </View>

            <View key={`grid-${refreshKey}`} style={styles.daysGrid}>
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                <Typography key={`label-${i}`} variant="label" weight="700" style={styles.dayLabel} color={themeColors.icon}>{day}</Typography>
              ))}
              {emptyDays.map((_, i) => (
                <View key={`empty-${i}`} style={styles.dayCell} />
              ))}
              {days.map((day) => {
                const isSame = isSameDay(day, selectedDate);
                return (
                  <TouchableOpacity 
                    key={day.toISOString()} 
                    style={[
                      styles.dayCell,
                      isSame && { backgroundColor: themeColors.primary, shadowColor: themeColors.primary, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 }
                    ]}
                    onPress={() => setSelectedDate(day)}
                    activeOpacity={0.8}
                  >
                    <Typography 
                      variant={IS_TABLET ? "bodyLg" : "body"}
                      weight={isSame ? "800" : "600"}
                      style={{ color: isSame ? '#fff' : themeColors.text }}
                    >
                      {format(day, 'd')}
                    </Typography>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.footer}>
            <TouchableOpacity 
              style={[styles.button, { backgroundColor: themeColors.primary }]}
              onPress={handleNext}
              activeOpacity={0.8}
            >
              <Typography variant="bodyLg" weight="700" style={{ color: '#fff' }}>Confirm Date</Typography>
              <ArrowRight size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    padding: 24,
    paddingTop: 10,
    paddingBottom: 80,
  },
  tabletContent: {
    maxWidth: MAX_CONTENT_WIDTH,
    alignSelf: 'center',
    width: '100%',
  },
  iconContainer: {
    marginBottom: 24,
  },
  iconCircle: {
    width: IS_TABLET ? 80 : 64,
    height: IS_TABLET ? 80 : 64,
    borderRadius: IS_TABLET ? 24 : 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    lineHeight: 36,
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  subtitle: {
    marginBottom: 32,
    opacity: 0.8,
  },
  calendarContainer: {
    borderRadius: 32,
    padding: IS_TABLET ? 32 : 20,
    marginBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 8,
    minHeight: 340,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  navGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  navButton: {
    width: IS_TABLET ? 54 : 44,
    height: IS_TABLET ? 54 : 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 27,
    borderWidth: 1,
  },
  monthDisplay: {
    alignItems: 'center',
    flex: 1,
  },
  monthLabel: {
    fontSize: 20,
    letterSpacing: -0.5,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayLabel: {
    width: (ACTUAL_CONTENT_WIDTH - (IS_TABLET ? 64 : 40)) / 7,
    textAlign: 'center',
    marginBottom: IS_TABLET ? 24 : 20,
    fontSize: IS_TABLET ? 14 : 11,
    letterSpacing: 1,
  },
  dayCell: {
    width: (ACTUAL_CONTENT_WIDTH - (IS_TABLET ? 64 : 40)) / 7,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: IS_TABLET ? 24 : 18,
    marginBottom: 8,
  },
  footer: {
    marginTop: 8,
  },
  button: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    borderRadius: 24,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
});
