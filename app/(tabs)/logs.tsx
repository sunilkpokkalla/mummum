import React, { useMemo, useState } from 'react';
import { StyleSheet, ScrollView, View, TouchableOpacity, Dimensions } from 'react-native';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import Typography from '@/components/Typography';
import Card from '@/components/Card';
import { useBabyStore } from '@/store/useBabyStore';
import { 
  format, 
  isSameDay, 
  subDays
} from 'date-fns';
import { Milk, Moon, Droplet, ChevronRight, FileText, Share2 } from 'lucide-react-native';
import { generateBabyReport } from '@/utils/reportGenerator';

const { width } = Dimensions.get('window');

export default function LogsScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const themeColors = Colors[colorScheme];
  const { activities, babies, currentBabyId } = useBabyStore();
  const currentBaby = babies.find(b => b.id === currentBabyId);

  const [selectedDate, setSelectedDate] = useState(new Date());

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => subDays(new Date(), i)).reverse();
  }, []);

  const sortedActivities = useMemo(() => {
    return [...activities].sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [activities]);

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
  const selectedDayData = dailySummaries[selectedDateKey];

  return (
    <View style={[styles.container, { backgroundColor: '#F8FAFB' }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Typography variant="display" weight="700" style={{ color: '#1B3C35' }}>History</Typography>
          <Typography variant="bodyMd" color="#607D8B">{currentBaby?.name || 'Baby'}'s Clinical Record</Typography>
        </View>
        <TouchableOpacity 
          style={styles.shareButton}
          onPress={() => generateBabyReport(currentBaby, activities, 7)}
        >
          <Share2 size={24} color="#C69C82" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Report Cards */}
        <View style={styles.reportRow}>
          <TouchableOpacity 
            style={[styles.reportCard, { backgroundColor: '#FBE9E7' }]}
            onPress={() => generateBabyReport(currentBaby, activities, 7)}
          >
            <View style={styles.reportIcon}>
              <FileText size={24} color="#C69C82" />
            </View>
            <Typography variant="body" weight="700" color="#C69C82">Weekly Summary</Typography>
            <Typography variant="label" color="#C69C82" opacity={0.7}>Last 7 Days</Typography>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.reportCard, { backgroundColor: '#E3F2FD' }]}
            onPress={() => generateBabyReport(currentBaby, activities, 30)}
          >
            <View style={[styles.reportIcon, { backgroundColor: '#BBDEFB' }]}>
              <Share2 size={24} color="#1565C0" />
            </View>
            <Typography variant="body" weight="700" color="#1565C0">Monthly Report</Typography>
            <Typography variant="label" color="#1565C0" opacity={0.7}>Full History</Typography>
          </TouchableOpacity>
        </View>

        {/* Weekly Strip Consolidated */}
        <View style={styles.calendarStripWrapper}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.calendarStrip}>
            {weekDays.map((date) => {
              const isSelected = isSameDay(date, selectedDate);
              return (
                <TouchableOpacity 
                  key={date.toISOString()}
                  style={[styles.dateCard, isSelected && { backgroundColor: '#4A5D4C' }]}
                  onPress={() => setSelectedDate(date)}
                >
                  <Typography variant="label" weight="700" color={isSelected ? '#fff' : '#90A4AE'} style={{ fontSize: 9 }}>
                    {format(date, 'EEE').toUpperCase()}
                  </Typography>
                  <Typography variant="body" weight="800" color={isSelected ? '#fff' : '#1B3C35'} style={{ fontSize: 16 }}>
                    {format(date, 'd')}
                  </Typography>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.listContainer}>
          {selectedDayData ? (
            <DailySummaryCard dayData={selectedDayData} />
          ) : (
            <View style={styles.emptyState}>
              <Typography color="#B0BEC5">No activities logged for this day.</Typography>
            </View>
          )}
          
          {/* Recent entries separator */}
          <View style={{ marginTop: 24 }}>
             <Typography variant="label" weight="800" color="#CFD8DC">ALL HISTORY</Typography>
          </View>
          {Object.entries(dailySummaries)
            .sort((a,b) => b[0].localeCompare(a[0]))
            .filter(([key]) => key !== selectedDateKey)
            .map(([key, data]) => (
              <DailySummaryCard key={key} dayData={data} />
            ))
          }
        </View>
      </ScrollView>
    </View>
  );
}

function DailySummaryCard({ dayData }: { dayData: any }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const dayNum = format(dayData.date, 'dd');
  const monthYear = format(dayData.date, 'MMM yyyy').toUpperCase();

  return (
    <Card style={styles.dayCard}>
      <TouchableOpacity 
        style={styles.dayHeader} 
        onPress={() => setIsExpanded(!isExpanded)}
        activeOpacity={0.8}
      >
        <View style={styles.dateBlock}>
          <Typography variant="display" weight="800" color="#1B3C35" style={styles.dayNumber}>{dayNum}</Typography>
          <Typography variant="label" weight="700" color="#90A4AE" style={styles.monthYear}>{monthYear}</Typography>
        </View>

        <View style={{ flex: 1 }}>
          <View style={styles.dayStatsRow}>
            <View style={styles.miniStat}>
              <Milk size={14} color="#2E7D32" />
              <Typography variant="label" weight="700" color="#2E7D32">{dayData.stats.feeds} feeds • {dayData.stats.amount}oz</Typography>
            </View>
            <View style={styles.miniStat}>
              <Moon size={14} color="#1565C0" />
              <Typography variant="label" weight="700" color="#1565C0">{Math.floor(dayData.stats.sleep/3600)}h {Math.floor((dayData.stats.sleep%3600)/60)}m sleep</Typography>
            </View>
            <View style={styles.miniStat}>
              <Droplet size={14} color="#E65100" />
              <Typography variant="label" weight="700" color="#E65100">{dayData.stats.diapers} diapers</Typography>
            </View>
          </View>
        </View>
        <ChevronRight size={20} color="#CFD8DC" style={{ transform: [{ rotate: isExpanded ? '90deg' : '0deg' }] }} />
      </TouchableOpacity>

      {isExpanded && (
        <View style={styles.expandedContent}>
          <View style={styles.divider} />
          {dayData.activities.map((activity: any) => (
            <ActivityItem key={activity.id} activity={activity} />
          ))}
        </View>
      )}
    </Card>
  );
}

function ActivityItem({ activity }: { activity: any }) {
  const getIcon = () => {
    switch (activity.type) {
      case 'feed': return <Milk size={18} color="#2E7D32" />;
      case 'sleep': return <Moon size={18} color="#1565C0" />;
      case 'diaper': return <Droplet size={18} color="#E65100" />;
      default: return <FileText size={18} color="#607D8B" />;
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
      const quality = d.quality || 'Peaceful';
      const formattedQuality = quality.charAt(0).toUpperCase() + quality.slice(1).toLowerCase();
      return `Slept for ${Math.round((d.duration || 0)/60)} mins\nQuality: ${formattedQuality}`;
    }
    if (activity.type === 'diaper') {
      return `${d.diaperType} • ${d.hasRash ? 'Rash noted' : 'Clean'}`;
    }
    return '';
  };

  return (
    <View style={styles.activityRow}>
      <View style={styles.activityIconMini}>{getIcon()}</View>
      <View style={{ flex: 1 }}>
        <View style={styles.activityHeader}>
          <Typography variant="label" weight="700" color="#455A64">
            {activity.type.toUpperCase()}
          </Typography>
          <Typography variant="label" color="#90A4AE">{format(new Date(activity.timestamp), 'h:mm a')}</Typography>
        </View>
        <Typography variant="label" color="#607D8B">{getDetails()}</Typography>
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
    paddingTop: 60,
    paddingBottom: 24,
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  shareButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FBE9E7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarStripWrapper: {
    marginVertical: 8,
  },
  calendarStrip: {
    paddingHorizontal: 4,
    gap: 8,
  },
  dateCard: {
    width: 45,
    height: 60,
    borderRadius: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 1,
  },
  content: {
    padding: 20,
    gap: 20,
  },
  reportRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  reportCard: {
    flex: 1,
    padding: 20,
    borderRadius: 24,
    alignItems: 'center',
    gap: 8,
  },
  reportIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  listContainer: {
    gap: 16,
  },
  dayCard: {
    padding: 0,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#fff',
    borderWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  dayHeader: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  dateBlock: {
    backgroundColor: '#F8FAFB',
    padding: 12,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 70,
  },
  dayNumber: {
    fontSize: 28,
    lineHeight: 32,
  },
  monthYear: {
    fontSize: 10,
    marginTop: 2,
  },
  dayStatsRow: {
    flexDirection: 'column',
    gap: 6,
  },
  miniStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F8FAFB',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  expandedContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginBottom: 16,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 16,
  },
  activityIconMini: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#F8FAFB',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  emptyState: {
    padding: 60,
    alignItems: 'center',
  }
});
