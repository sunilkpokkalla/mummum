import React, { useMemo, useState } from 'react';
import { StyleSheet, ScrollView, View, TouchableOpacity, Dimensions, Platform, Modal, Image } from 'react-native';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import Typography from '@/components/Typography';
import Card from '@/components/Card';
import { useBabyStore } from '@/store/useBabyStore';
import { 
  format, 
  isSameDay, 
  subDays,
  addDays,
  startOfToday
} from 'date-fns';
import { Milk, Moon, Droplet, ChevronRight, FileText, Share2, Syringe, Pill, Baby, Scale } from 'lucide-react-native';
import { generateBabyReport } from '@/utils/reportGenerator';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

export default function LogsScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? 'light';
  const themeColors = Colors[colorScheme];
  const { activities, babies, currentBabyId } = useBabyStore();
  const currentBaby = babies.find(b => b.id === currentBabyId);

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isMainExpanded, setIsMainExpanded] = useState(false);
  const [isShareModalVisible, setIsShareModalVisible] = useState(false);

  // Create a 14-day strip centered around today
  const calendarDays = useMemo(() => {
    const today = startOfToday();
    return Array.from({ length: 14 }).map((_, i) => addDays(subDays(today, 7), i));
  }, []);

  const babyActivities = useMemo(() => {
    return activities.filter(a => a.babyId === currentBabyId);
  }, [activities, currentBabyId]);

  const sortedActivities = useMemo(() => {
    return [...babyActivities].sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [babyActivities]);

  const dailySummaries = useMemo(() => {
    const groups: { [key: string]: { 
      date: Date,
      activities: any[],
      stats: { feeds: number, amount: number, sleep: number, diapers: number }
    } } = {};
    
    sortedActivities.forEach(activity => {
      if (!activity?.timestamp || !activity?.type) return;
      
      const date = new Date(activity.timestamp);
      if (isNaN(date.getTime())) return;

      const dateKey = format(date, 'yyyy-MM-dd');
      
      if (!groups[dateKey]) {
        groups[dateKey] = { 
          date, 
          activities: [], 
          stats: { feeds: 0, amount: 0, sleep: 0, diapers: 0 } 
        };
      }
      
      groups[dateKey].activities.push(activity);
      
      if (activity.type === 'feed') {
        groups[dateKey].stats.feeds += 1;
        const amt = parseFloat(activity.details?.amount || '0');
        if (!isNaN(amt)) {
          groups[dateKey].stats.amount += amt;
        }
      } else if (activity.type === 'sleep') {
        groups[dateKey].stats.sleep += (activity.details?.duration || 0);
      } else if (activity.type === 'diaper') {
        groups[dateKey].stats.diapers += 1;
      }
    });
    
    return groups;
  }, [sortedActivities]);

  const selectedDateKey = format(selectedDate, 'yyyy-MM-dd');
  const selectedDayData = dailySummaries[selectedDateKey] || {
    date: selectedDate,
    stats: { feeds: 0, amount: 0, sleep: 0, diapers: 0 }
  };

  return (
    <View style={[styles.container, { backgroundColor: '#F8FAFB', paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Typography variant="display" weight="800" style={{ color: '#1B3C35', fontSize: 34 }}>History</Typography>
          <Typography variant="bodyMd" weight="600" color="#607D8B">Daily Nurture for {currentBaby?.name || 'Baby'}</Typography>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Elegant Report Buttons */}
        <View style={styles.reportRow}>
          <TouchableOpacity 
            style={[styles.pillButton, { backgroundColor: '#FCE4EC' }]}
            onPress={() => generateBabyReport(currentBaby, activities, 7)}
          >
            <FileText size={18} color="#E91E63" />
            <Typography variant="body" weight="700" color="#E91E63">Weekly Summary</Typography>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.pillButton, { backgroundColor: '#E3F2FD' }]}
            onPress={() => generateBabyReport(currentBaby, activities, 30)}
          >
            <Share2 size={18} color="#1565C0" />
            <Typography variant="body" weight="700" color="#1565C0">Monthly Report</Typography>
          </TouchableOpacity>
        </View>

        {/* Calendar Strip */}
        <View style={styles.calendarStripWrapper}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.calendarStrip}>
            {calendarDays.map((date) => {
              const isSelected = isSameDay(date, selectedDate);
              const isToday = isSameDay(date, new Date());
              return (
                <TouchableOpacity 
                  key={date.toISOString()}
                  style={[
                    styles.dateCard, 
                    isSelected && { backgroundColor: '#4A5D4C', shadowColor: '#4A5D4C', shadowOpacity: 0.2 }
                  ]}
                  onPress={() => setSelectedDate(date)}
                >
                  <Typography variant="label" weight="700" color={isSelected ? '#fff' : '#90A4AE'} style={{ fontSize: 10 }}>
                    {format(date, 'EEE').toUpperCase()}
                  </Typography>
                  <Typography variant="body" weight="800" color={isSelected ? '#fff' : '#1B3C35'} style={{ fontSize: 18 }}>
                    {format(date, 'd')}
                  </Typography>
                  {isToday && !isSelected && <View style={styles.todayIndicator} />}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Share Social Button */}
        <TouchableOpacity 
          style={styles.shareSocialButton}
          onPress={() => setIsShareModalVisible(true)}
        >
          <Share2 size={20} color="#fff" />
          <Typography variant="bodyLg" weight="800" color="#fff">Share Social Report</Typography>
        </TouchableOpacity>

        {/* Main Prominent Summary Card */}
        <View style={styles.mainCardContainer}>
          <Card style={[styles.summaryCard, isMainExpanded && { paddingBottom: 0 }]}>
            <TouchableOpacity 
              activeOpacity={0.8} 
              onPress={() => setIsMainExpanded(!isMainExpanded)}
              style={styles.summaryCardHeader}
            >
              <Typography variant="bodyLg" weight="800" color="#1B3C35">
                {format(selectedDate, 'MMMM d, yyyy')} • {format(selectedDate, 'EEEE')}
              </Typography>
              <ChevronRight size={20} color="#CFD8DC" style={{ transform: [{ rotate: isMainExpanded ? '90deg' : '0deg' }] }} />
            </TouchableOpacity>
            
            <View style={styles.statsGrid}>
              <View style={styles.statBox}>
                <View style={[styles.statIconCircle, { backgroundColor: '#E8F5E9' }]}>
                  <Milk size={24} color="#2E7D32" />
                </View>
                <Typography variant="display" weight="800" color="#1B3C35">{selectedDayData.stats.feeds}</Typography>
                <Typography variant="label" weight="700" color="#90A4AE">Feeds</Typography>
              </View>
              <View style={styles.statBox}>
                <View style={[styles.statIconCircle, { backgroundColor: '#E3F2FD' }]}>
                  <Moon size={24} color="#1565C0" />
                </View>
                <Typography variant="display" weight="800" color="#1B3C35">
                  {Math.floor(selectedDayData.stats.sleep/3600)}h {Math.floor((selectedDayData.stats.sleep%3600)/60)}m
                </Typography>
                <Typography variant="label" weight="700" color="#90A4AE">Sleep</Typography>
              </View>
              <View style={styles.statBox}>
                <View style={[styles.statIconCircle, { backgroundColor: '#FFF3E0' }]}>
                  <Droplet size={24} color="#E65100" />
                </View>
                <Typography variant="display" weight="800" color="#1B3C35">{selectedDayData.stats.diapers}</Typography>
                <Typography variant="label" weight="700" color="#90A4AE">Diaper</Typography>
              </View>
            </View>

            {isMainExpanded && (
              <View style={{ marginTop: 24 }}>
                <View style={styles.divider} />
                {selectedDayData.activities?.length > 0 ? (
                  selectedDayData.activities.map((activity: any) => (
                    <ActivityItem key={activity.id} activity={activity} />
                  ))
                ) : (
                  <Typography variant="label" color="#B0BEC5" style={{ textAlign: 'center', paddingVertical: 12 }}>
                    No activity records found for this day
                  </Typography>
                )}
                <View style={{ height: 16 }} />
              </View>
            )}
          </Card>
        </View>
        
        {/* All History Section */}
        <View style={styles.historySection}>
          <Typography variant="label" weight="800" color="#B0BEC5" style={styles.sectionLabel}>ALL HISTORY</Typography>
          <View style={styles.historyList}>
            {Object.entries(dailySummaries)
              .sort((a,b) => b[0].localeCompare(a[0]))
              .map(([key, data]) => (
                <HistoryRow key={key} data={data} isSelected={key === selectedDateKey} />
              ))
            }
            {Object.keys(dailySummaries).length === 0 && (
              <View style={styles.emptyState}>
                <Baby size={48} color="#CFD8DC" />
                <Typography color="#B0BEC5" style={{ marginTop: 12 }}>No clinical history found</Typography>
              </View>
            )}
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      <SocialShareModal 
        visible={isShareModalVisible}
        onClose={() => setIsShareModalVisible(false)}
        baby={currentBaby}
        data={selectedDayData}
        activities={babyActivities}
      />
    </View>
  );
}

function SocialShareModal({ visible, onClose, baby, data, activities }: any) {
  const selectedDateActivities = activities.filter((a: any) => isSameDay(new Date(a.timestamp), data.date));
  
  const sortedGrowth = activities
    .filter((a: any) => a.type === 'growth')
    .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  
  const lastWeight = sortedGrowth.find((a: any) => a.details?.metric === 'Weight');
  const lastHeight = sortedGrowth.find((a: any) => a.details?.metric === 'Height');
  const lastHeadCirc = sortedGrowth.find((a: any) => a.details?.metric === 'Head Circ');

  const careEvents = selectedDateActivities.filter((a: any) => a.type === 'medicine' || a.type === 'vaccination' || a.type === 'diaper').length;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.bannerContainer}>
          <View style={styles.bannerContent}>
            {/* Header: Large Logo Left, Baby Name & Metrics Right */}
            <View style={styles.bannerHeaderSplit}>
              <View style={styles.bannerHeaderLeft}>
                <Image 
                  source={require('../../assets/images/MUMMUM_FINAL.png')} 
                  style={{ width: 64, height: 64 }}
                  resizeMode="contain"
                />
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Typography variant="display" weight="800" color="#1B3C35" style={{ fontSize: 24 }}>{(baby as any)?.name || 'Baby'}</Typography>
                <Typography variant="label" weight="800" color="#607D8B" style={{ fontSize: 10, marginTop: 4 }}>
                  {lastWeight ? `${lastWeight.details.value}${lastWeight.details.unit}` : '--'} • {lastHeight ? `${lastHeight.details.value}${lastHeight.details.unit}` : '--'} • {lastHeadCirc ? `${lastHeadCirc.details.value}${lastHeadCirc.details.unit}` : '--'}
                </Typography>
              </View>
            </View>

            <View style={styles.reportDivider} />

            <Typography variant="bodyLg" weight="800" color="#1B3C35" style={{ textAlign: 'center', marginBottom: 24 }}>
              {format(data.date, 'MMMM d, yyyy')} • Daily Report
            </Typography>

            {/* High Level 4-Item Grid */}
            <View style={styles.categoryGrid}>
              <CategoryItem 
                icon={<Scale size={20} color="#795548" />} 
                title="VITALS" 
                detail={lastWeight ? `${lastWeight.details.value}${lastWeight.details.unit}` : '--'} 
                bgColor="#EFEBE9"
              />
              <CategoryItem 
                icon={<Milk size={20} color="#2E7D32" />} 
                title="NUTRITION" 
                detail={`${data.stats.feeds} Feeds`} 
                bgColor="#E8F5E9"
              />
              <CategoryItem 
                icon={<Moon size={20} color="#1565C0" />} 
                title="REST" 
                detail={`${Math.floor(data.stats.sleep/3600)}h Sleep`} 
                bgColor="#E3F2FD"
              />
              <CategoryItem 
                icon={<Droplet size={20} color="#E65100" />} 
                title="CARE" 
                detail={`${careEvents} Events`} 
                bgColor="#FFF3E0"
              />
            </View>

            <Typography variant="label" weight="800" color="#B0BEC5" style={{ textAlign: 'center', marginTop: 40, letterSpacing: 1 }}>
              GENERATED BY MUMMUM HUB
            </Typography>
          </View>

          <TouchableOpacity style={styles.closeBannerBtn} onPress={onClose}>
            <Typography variant="body" weight="800" color="#4A5D4C">Close Report</Typography>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function CategoryItem({ icon, title, detail, bgColor }: any) {
  return (
    <View style={styles.categoryItem}>
      <View style={[styles.categoryIcon, { backgroundColor: bgColor }]}>
        {icon}
      </View>
      <View style={{ alignItems: 'center' }}>
        <Typography variant="label" weight="800" color="#90A4AE" style={{ fontSize: 9 }}>{title}</Typography>
        <Typography variant="bodyMd" weight="800" color="#1B3C35">{detail}</Typography>
      </View>
    </View>
  );
}

function HistoryRow({ data, isSelected }: { data: any, isSelected: boolean }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card style={[
      styles.historyRowCard, 
      isSelected && { borderColor: '#E8F5E9', borderWidth: 2 },
      isExpanded && { paddingBottom: 0 }
    ]}>
      <TouchableOpacity 
        onPress={() => setIsExpanded(!isExpanded)}
        activeOpacity={0.8}
        style={styles.historyRowContent}
      >
        <View style={styles.historyRowInfo}>
          <Typography variant="bodyLg" weight="800" color="#1B3C35">
            {format(data.date, 'MMMM d')}
          </Typography>
          <Typography variant="label" color="#90A4AE">{format(data.date, 'EEEE')}</Typography>
        </View>
        <View style={styles.historyRowStats}>
          <View style={styles.smallStat}>
            <Milk size={14} color="#2E7D32" />
            <Typography variant="label" weight="800" color="#455A64">{data.stats.feeds}</Typography>
          </View>
          <View style={styles.smallStat}>
            <Moon size={14} color="#1565C0" />
            <Typography variant="label" weight="800" color="#455A64">{Math.floor(data.stats.sleep/3600)}h</Typography>
          </View>
          <View style={styles.smallStat}>
            <Droplet size={14} color="#E65100" />
            <Typography variant="label" weight="800" color="#455A64">{data.stats.diapers}</Typography>
          </View>
          <ChevronRight size={18} color="#CFD8DC" style={{ transform: [{ rotate: isExpanded ? '90deg' : '0deg' }] }} />
        </View>
      </TouchableOpacity>

      {isExpanded && (
        <View style={styles.expandedContent}>
          <View style={styles.divider} />
          {data.activities.map((activity: any) => (
            <ActivityItem key={activity.id} activity={activity} />
          ))}
          <View style={{ height: 16 }} />
        </View>
      )}
    </Card>
  );
}

function ActivityItem({ activity }: { activity: any }) {
  const getIcon = () => {
    switch (activity.type) {
      case 'feed': return <Milk size={16} color="#2E7D32" />;
      case 'sleep': return <Moon size={16} color="#1565C0" />;
      case 'diaper': return <Droplet size={16} color="#E65100" />;
      case 'vaccination': return <Syringe size={16} color="#009688" />;
      case 'medicine': return <Pill size={16} color="#9C27B0" />;
      case 'growth': return <Scale size={16} color="#795548" />;
      default: return <FileText size={16} color="#607D8B" />;
    }
  };

  const getDetails = () => {
    const d = activity.details;
    if (activity.type === 'feed') {
      return d.feedMode === 'Breast' 
        ? `Breastfeed • ${[d.leftDuration ? `L:${Math.round(d.leftDuration/60)}m` : '', d.rightDuration ? `R:${Math.round(d.rightDuration/60)}m` : ''].filter(Boolean).join(' ')}`
        : `${d.feedMode} • ${d.amount}${d.unit}`;
    }
    if (activity.type === 'sleep') {
      const duration = d.duration || 0;
      return `Slept for ${Math.floor(duration/3600)}h ${Math.floor((duration%3600)/60)}m`;
    }
    if (activity.type === 'diaper') {
      return `${d.diaperType} • ${d.hasRash ? 'Rash noted' : 'Clean'}`;
    }
    if (activity.type === 'vaccination') {
      return `${d.name}`;
    }
    if (activity.type === 'medicine') {
      return `${d.name} (${d.dosage || 'No dose'})`;
    }
    if (activity.type === 'growth') {
      if (d.metric && d.value) {
        return `${d.metric} • ${d.value}${d.unit || ''}`;
      }
      return 'Measurement recorded';
    }
    return '';
  };

  return (
    <View style={styles.activityItemRow}>
      <View style={[styles.activityIconMini, { backgroundColor: '#F8FAFB' }]}>
        {getIcon()}
      </View>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="label" weight="800" color="#1B3C35" style={{ fontSize: 11, textTransform: 'uppercase' }}>
            {activity.type}
          </Typography>
          <Typography variant="label" color="#90A4AE">{format(new Date(activity.timestamp), 'h:mm a')}</Typography>
        </View>
        <Typography variant="label" weight="600" color="#607D8B" style={{ fontSize: 12 }}>{getDetails()}</Typography>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
  },
  content: {
    paddingHorizontal: 24,
  },
  reportRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  pillButton: {
    flex: 1,
    flexDirection: 'row',
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  calendarStripWrapper: {
    marginBottom: 32,
  },
  calendarStrip: {
    gap: 12,
  },
  dateCard: {
    width: 60,
    height: 80,
    borderRadius: 24,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 3,
  },
  todayIndicator: {
    position: 'absolute',
    bottom: 8,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#C69C82',
  },
  mainCardContainer: {
    marginBottom: 40,
  },
  summaryCard: {
    padding: 24,
    borderRadius: 40,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 30,
    elevation: 10,
  },
  summaryCardHeader: {
    marginBottom: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statBox: {
    alignItems: 'center',
    gap: 4,
  },
  statIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  historySection: {
    gap: 16,
  },
  sectionLabel: {
    letterSpacing: 1.5,
    marginLeft: 4,
  },
  historyList: {
    gap: 12,
  },
  historyRowCard: {
    padding: 0,
    borderRadius: 28,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
    overflow: 'hidden',
  },
  historyRowContent: {
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyRowInfo: {
    gap: 2,
  },
  historyRowStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  smallStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F8FAFB',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  expandedContent: {
    paddingHorizontal: 20,
    paddingBottom: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginBottom: 16,
  },
  activityItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  activityIconMini: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    padding: 60,
    alignItems: 'center',
    gap: 12,
  },
  shareSocialButton: {
    backgroundColor: '#4A5D4C',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 18,
    borderRadius: 24,
    marginBottom: 24,
    shadowColor: '#4A5D4C',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    padding: 20,
  },
  bannerContainer: {
    backgroundColor: '#fff',
    borderRadius: 40,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.3,
    shadowRadius: 40,
    elevation: 24,
  },
  bannerContent: {
    padding: 32,
    backgroundColor: '#fff',
  },
  bannerHeaderSplit: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  bannerHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoCircle: {
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reportDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginBottom: 24,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  categoryItem: {
    width: (width - 40 - 64 - 12) / 2, // Adjusted for padding and gap
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F8FAFB',
    padding: 16,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBannerBtn: {
    paddingVertical: 20,
    alignItems: 'center',
    backgroundColor: '#F8FAFB',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  }
});
