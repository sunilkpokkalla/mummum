import React, { useMemo, useState, useRef } from 'react';
import { StyleSheet, ScrollView, View, TouchableOpacity, Dimensions, Platform, Modal, Image, Alert } from 'react-native';

// Safe Dynamic Imports to prevent crashes in Expo Go/Dev Client without native modules
let ViewShot: any = View;
let MediaLibrary: any = null;

try {
  const RNViewShot = require('react-native-view-shot');
  ViewShot = RNViewShot.default || RNViewShot;
} catch (e) {}

try {
  MediaLibrary = require('expo-media-library');
} catch (e) {}
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import Typography from '@/components/Typography';
import Card from '@/components/Card';
import { useRouter } from 'expo-router';
import { useBabyStore } from '@/store/useBabyStore';
import { 
  format, 
  isSameDay, 
  subDays,
  addDays,
  startOfToday
} from 'date-fns';
import { Milk, Moon, Droplet, ChevronRight, FileText, Share2, Syringe, Pill, Baby, Scale, Star, Settings } from 'lucide-react-native';
import { generateBabyReport } from '@/utils/reportGenerator';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

export default function LogsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? 'light';
  const themeColors = Colors[colorScheme];
  const { activities, babies, currentBabyId, isPro } = useBabyStore();
  const currentBaby = babies.find(b => b.id === currentBabyId);

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [activeView, setActiveView] = useState('daily'); // 'daily', 'weekly', 'monthly'
  const [isMainExpanded, setIsMainExpanded] = useState(false);
  const [isShareModalVisible, setIsShareModalVisible] = useState(false);

  // Create a 14-day strip terminating today
  const calendarDays = useMemo(() => {
    const today = startOfToday();
    return Array.from({ length: 14 }).map((_, i) => subDays(today, 13 - i));
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
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <View>
            <Typography variant="display" weight="800" style={{ color: '#1B3C35', fontSize: 34 }}>History</Typography>
            <Typography variant="bodyMd" weight="600" color="#607D8B">Daily Nurture for {currentBaby?.name || 'Baby'}</Typography>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity 
              style={styles.headerBtn}
              onPress={() => router.push('/settings')}
            >
              <Settings size={22} color="#1B3C35" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.headerBtn, { backgroundColor: '#1B3C35' }]}
              onPress={() => setIsShareModalVisible(true)}
            >
              <Share2 size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Clinical Reporting Hub - Now on History Board */}
        <Card style={styles.clinicalBoardCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <Image 
              source={require('../../assets/images/MUMMUM_FINAL.png')} 
              style={{ width: 40, height: 40 }}
              resizeMode="contain"
            />
            <View>
              <Typography variant="label" weight="800" color="#1B3C35">MUMMUM CLINICAL HUB</Typography>
              <Typography variant="label" color="#90A4AE" style={{ fontSize: 9 }}>PROFESSIONAL PEDIATRIC REPORTING</Typography>
            </View>
          </View>

          {!isPro ? (
            <View style={{ gap: 12 }}>
              <Typography variant="label" color="#607D8B" style={{ lineHeight: 16 }}>
                Generate professional PDF reports, track medical history, and unlock advanced clinical insights with Mummum Pro.
              </Typography>
              <TouchableOpacity 
                style={[styles.boardPdfBtn, { backgroundColor: '#1B3C35' }]} 
                onPress={() => router.push('/premium')}
              >
                <Star size={18} color="#fff" fill="#fff" />
                <Typography variant="body" weight="800" color="#fff">Unlock Clinical Pro</Typography>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <View style={styles.boardTabContainer}>
                {['daily', 'weekly', 'monthly'].map((tab) => (
                  <TouchableOpacity 
                    key={tab} 
                    style={[styles.boardTabPill, activeView === tab && { backgroundColor: '#1B3C35', borderColor: '#1B3C35' }]}
                    onPress={() => setActiveView(tab)}
                  >
                    <Typography variant="label" weight="800" color={activeView === tab ? '#fff' : '#90A4AE'}>
                      {tab.toUpperCase()}
                    </Typography>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity 
                style={styles.boardPdfBtn} 
                onPress={() => generateBabyReport(currentBaby, activities, activeView === 'daily' ? 1 : (activeView === 'weekly' ? 7 : 30), useBabyStore.getState().memories)}
              >
                <FileText size={18} color="#fff" />
                <Typography variant="body" weight="800" color="#fff">Generate {activeView.charAt(0).toUpperCase() + activeView.slice(1)} PDF</Typography>
              </TouchableOpacity>
            </>
          )}
        </Card>

        {/* Calendar Strip - Only in Daily View */}
        {activeView === 'daily' && (
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
        )}

        {/* Main Prominent Summary Card */}
        <View style={styles.mainCardContainer}>
          <Card style={[styles.summaryCard, isMainExpanded && { paddingBottom: 0 }]}>
            <View style={styles.summaryCardHeader}>
              <TouchableOpacity 
                activeOpacity={0.8} 
                onPress={() => setIsMainExpanded(!isMainExpanded)}
                style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
              >
                <Typography variant="bodyLg" weight="800" color="#1B3C35">
                  {format(selectedDate, 'MMMM d, yyyy')} • {format(selectedDate, 'EEEE')}
                </Typography>
                <ChevronRight size={20} color="#CFD8DC" style={{ transform: [{ rotate: isMainExpanded ? '90deg' : '0deg' }] }} />
              </TouchableOpacity>
              
              <View style={{ width: 1, height: 24, backgroundColor: '#F1F5F9', marginHorizontal: 12 }} />
              
              <TouchableOpacity onPress={() => setIsShareModalVisible(true)}>
                <Share2 size={20} color="#1B3C35" />
              </TouchableOpacity>
            </View>
            
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
          <Typography variant="label" weight="800" color="#B0BEC5" style={styles.sectionLabel}>
            {activeView === 'daily' ? 'DAILY TIMELINE' : (activeView === 'weekly' ? 'WEEKLY SUMMARY' : 'MONTHLY OVERVIEW')}
          </Typography>
          <View style={styles.historyList}>
            {Object.entries(dailySummaries)
              .sort((a,b) => b[0].localeCompare(a[0]))
              .filter(([_, data], index) => {
                if (activeView === 'daily') return isSameDay(data.date, selectedDate);
                if (activeView === 'weekly') return index < 7;
                if (activeView === 'monthly') return index < 30;
                return true;
              })
              .map(([key, data]) => (
                <HistoryRow key={key} data={data} isSelected={key === selectedDateKey && activeView === 'daily'} />
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
  const [reportPeriod, setReportPeriod] = useState(7);
  const viewShotRef = useRef<any>(null);
  
  const selectedDateActivities = activities.filter((a: any) => isSameDay(new Date(a.timestamp), data.date));
  
  const sortedGrowth = activities
    .filter((a: any) => a.type === 'growth')
    .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  
  const lastWeight = sortedGrowth.find((a: any) => a.details?.metric === 'Weight');
  const lastHeight = sortedGrowth.find((a: any) => a.details?.metric === 'Height');
  const lastHeadCirc = sortedGrowth.find((a: any) => a.details?.metric === 'Head Circ');

  const birthDate = baby?.birthDate ? new Date(baby.birthDate) : new Date();
  const diffTime = Math.abs(data.date.getTime() - birthDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  const getOrdinal = (n: number) => {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };
  const emotionalDay = getOrdinal(diffDays);

  const medsCount = selectedDateActivities.filter((a: any) => a.type === 'medicine').length;
  const vaccinesCount = selectedDateActivities.filter((a: any) => a.type === 'vaccine' || a.type === 'vaccination').length;
  const careEvents = selectedDateActivities.filter((a: any) => a.type === 'diaper').length;

  const handleSaveImage = async () => {
    try {
      if (!MediaLibrary) {
        Alert.alert(
          'Export Restricted', 
          'Native image export is only available in the production build. Please use npx expo run:ios to enable this feature locally.',
          [{ text: 'OK' }]
        );
        return;
      }

      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Please grant gallery access to save snapshots.');
        return;
      }

      const uri = await viewShotRef.current.capture();
      await MediaLibrary.saveToLibraryAsync(uri);
      Alert.alert('Saved!', 'Snapshot has been saved to your gallery.');
    } catch (error) {
      console.error('Save failed:', error);
      Alert.alert(
        'Export Restricted', 
        'Native image export is only available in the production build. Please use npx expo run:ios to enable this feature locally.',
        [{ text: 'OK' }]
      );
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <ScrollView contentContainerStyle={{ paddingVertical: 40 }} showsVerticalScrollIndicator={false}>
          <View style={styles.bannerContainer}>
            <ViewShot ref={viewShotRef} options={{ format: 'jpg', quality: 0.9, backgroundColor: '#fff' }}>
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
                  </View>
                </View>

                <View style={styles.reportDivider} />

                <View style={styles.bannerVitalsRow}>
                  <View style={styles.vitalStatItem}>
                    <Scale size={16} color="#607D8B" />
                    <Typography variant="bodyMd" weight="800" color="#1B3C35">
                      {lastWeight ? `${lastWeight.details.value}${lastWeight.details.unit}` : '--'}
                    </Typography>
                    <Typography variant="label" color="#90A4AE">Weight</Typography>
                  </View>
                  <View style={styles.vitalStatItem}>
                    <Droplet size={16} color="#607D8B" />
                    <Typography variant="bodyMd" weight="800" color="#1B3C35">
                      {lastHeight ? `${lastHeight.details.value}${lastHeight.details.unit}` : '--'}
                    </Typography>
                    <Typography variant="label" color="#90A4AE">Height</Typography>
                  </View>
                  <View style={styles.vitalStatItem}>
                    <Baby size={16} color="#607D8B" />
                    <Typography variant="bodyMd" weight="800" color="#1B3C35">
                      {lastHeadCirc ? `${lastHeadCirc.details.value}${lastHeadCirc.details.unit}` : '--'}
                    </Typography>
                    <Typography variant="label" color="#90A4AE">Head Circ</Typography>
                  </View>
                </View>

                <View style={[styles.reportDivider, { marginTop: 16 }]} />

                <Typography variant="bodyLg" weight="800" color="#1B3C35" style={{ textAlign: 'center', marginBottom: 4 }}>
                  {format(data.date, 'MMMM d, yyyy')} • Daily Report
                </Typography>
                <Typography variant="label" weight="800" color="#C69C82" style={{ textAlign: 'center', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 24 }}>
                  Celebrating {baby?.name}'s {emotionalDay} Day
                </Typography>

                {/* High Level 4-Item Grid */}
                <View style={styles.categoryGrid}>
                  <CategoryItem 
                    icon={<Pill size={20} color="#D32F2F" />} 
                    title="HEALTH" 
                    detail={`${medsCount + vaccinesCount} Events`} 
                    bgColor="#FFEBEE"
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

                <Typography variant="label" weight="800" color="#B0BEC5" style={{ textAlign: 'center', marginTop: 16, letterSpacing: 1 }}>
                  GENERATED BY MUMMUM HUB
                </Typography>
              </View>
            </ViewShot>

            <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
              <TouchableOpacity 
                style={[styles.closeBannerBtn, { flex: 1, backgroundColor: '#C69C82' }]} 
                onPress={handleSaveImage}
              >
                <Typography variant="body" weight="800" color="#fff">Save to Gallery</Typography>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.closeBannerBtn, { flex: 1, backgroundColor: '#fff', borderWidth: 1, borderColor: '#F1F5F9' }]} 
                onPress={onClose}
              >
                <Typography variant="body" weight="800" color="#4A5D4C">Close</Typography>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
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
  headerActions: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  headerBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  headerShareBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  tabContainer: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  tabPill: {
    flex: 1,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
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
  clinicalBoardCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 32,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 4,
  },
  boardTabContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  boardTabPill: {
    flex: 1,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F8FAFB',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  boardPdfBtn: {
    backgroundColor: '#4A5D4C',
    height: 48,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#4A5D4C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
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
  bannerVitalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 4,
  },
  vitalStatItem: {
    alignItems: 'center',
    gap: 2,
  },
  downloadIconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    marginLeft: 8,
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
    gap: 8,
    backgroundColor: '#F8FAFB',
    padding: 12,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBannerBtn: {
    paddingVertical: 20,
    alignItems: 'center',
    backgroundColor: '#F8FAFB',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  clinicalReportingHub: {
    backgroundColor: '#F8FAFB',
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  periodSelector: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  periodPill: {
    flex: 1,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  generatePdfBtn: {
    backgroundColor: '#1B3C35',
    height: 56,
    borderRadius: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#1B3C35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  }
});
