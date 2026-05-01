import { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, View, Pressable, Image, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import Typography from '@/components/Typography';
import Card from '@/components/Card';
import { 
  Milk, 
  Moon, 
  Droplet, 
  Plus, 
  TrendingUp,
  Bell,
  Baby as BabyIcon,
  ChevronRight,
  BarChart2,
  X,
  MessageSquare,
  Pill,
  CheckSquare
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useBabyStore } from '@/store/useBabyStore';
import { formatDistanceToNow, isToday, format, intervalToDuration } from 'date-fns';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { saveImagePermanently } from '@/utils/imagePersistor';

const { width } = Dimensions.get('window');

export default function DashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? 'light';
  const themeColors = Colors[colorScheme];
  const { activities, babies, currentBabyId, activeSessions, updateBaby } = useBabyStore();

  const currentBaby = babies.find(b => b.id === currentBabyId);

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && currentBabyId) {
      const permanentUri = await saveImagePermanently(result.assets[0].uri);
      updateBaby(currentBabyId, { photoUri: permanentUri });
    }
  };

  const getBabyAge = (birthDate: Date | string | undefined) => {
    if (!birthDate) return '';
    const birth = new Date(birthDate);
    const now = new Date();
    const duration = intervalToDuration({ start: birth, end: now });
    
    if (duration.years && duration.years > 0) {
      return `${duration.years}y ${duration.months}m old`;
    }
    if (duration.months && duration.months > 0) {
      return `${duration.months} months old`;
    }
    const days = Math.floor((now.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24));
    if (days >= 7) {
      return `${Math.floor(days / 7)} weeks old`;
    }
    return `${days} days old`;
  };

  const lastFeed = activities.find(a => a.type === 'feed');
  const lastSleep = activities.find(a => a.type === 'sleep');
  const lastDiaper = activities.find(a => a.type === 'diaper');

  const todaysActivities = activities.filter(a => isToday(new Date(a.timestamp)));
  const activeSession = activeSessions[0];

  // Live timer for active session
  const [sessionTimer, setSessionTimer] = useState(0);

  useEffect(() => {
    let interval: any = null;
    if (activeSession) {
      const calculateElapsed = () => {
        const start = new Date(activeSession.startTime).getTime();
        const now = new Date().getTime();
        setSessionTimer(Math.floor((now - start) / 1000));
      };
      
      calculateElapsed();
      interval = setInterval(calculateElapsed, 1000);
    } else {
      setSessionTimer(0);
    }
    return () => clearInterval(interval);
  }, [activeSession]);

  const formatSessionTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) return `${hrs}h ${mins}m`;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Consolidated Stats for Today
  const feedCount = todaysActivities.filter(a => a.type === 'feed').length;
  const sleepCount = todaysActivities.filter(a => a.type === 'sleep').length;
  const diaperCount = todaysActivities.filter(a => a.type === 'diaper').length;

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background, paddingTop: insets.top }]}>
      <ScrollView 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Dynamic Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Pressable 
              onPress={handlePickImage}
              hitSlop={8}
              style={({ pressed }) => [
                styles.avatarContainer, 
                { borderColor: themeColors.surfaceVariant, opacity: pressed ? 0.7 : 1 }
              ]}
            >
              <Image 
                source={currentBaby?.photoUri ? { uri: currentBaby.photoUri } : require('@/assets/images/baby_avatar.png')} 
                style={styles.avatar}
              />
            </Pressable>
            <View style={styles.headerInfo}>
              <Typography variant="headline" weight="700">{currentBaby?.name || 'Your Baby'}</Typography>
              <Typography variant="label" color={themeColors.icon}>{getBabyAge(currentBaby?.birthDate)}</Typography>
            </View>
          </View>
          <View style={styles.headerRight}>
            <Pressable 
              style={({ pressed }) => [
                styles.notificationButton, 
                { backgroundColor: themeColors.surface, opacity: pressed ? 0.8 : 1 }
              ]}
            >
              <Bell size={22} color={themeColors.text} />
              <View style={[styles.notificationDot, { backgroundColor: themeColors.error }]} />
            </Pressable>
          </View>
        </View>

        {/* Active Session Integration */}
        {activeSession && (
          <Card style={[styles.activeSessionCard, { backgroundColor: activeSession.type === 'feed' ? '#E8F5E9' : '#E3F2FD' }]}>
            <Pressable 
              style={styles.activeSessionMain}
              hitSlop={10}
              onPress={() => {
                const route = activeSession.type === 'growth' ? '/charts' : 
                              activeSession.type === 'milestone' ? '/milestones' : 
                              `/log/${activeSession.type}`;
                router.push(route as any);
              }}
            >
              <View style={styles.activeSessionInfo}>
                <View style={[styles.activeIconCircle, { backgroundColor: activeSession.type === 'feed' ? '#4A5D4C' : '#1A237E' }]}>
                  {activeSession.type === 'feed' ? <Milk size={20} color="#fff" /> : <Moon size={20} color="#fff" />}
                </View>
                <View>
                  <Typography weight="700" color={activeSession.type === 'feed' ? '#2E7D32' : '#1A237E'}>
                    {activeSession.type === 'feed' ? 'Feeding in Progress' : 'Baby is Sleeping'}
                  </Typography>
                  <Typography variant="bodyMd" weight="600" color={activeSession.type === 'feed' ? '#4CAF50' : '#3F51B5'}>
                    Duration: {formatSessionTime(sessionTimer)}
                  </Typography>
                </View>
              </View>
            </Pressable>
            
            <Pressable 
              hitSlop={15}
              style={({ pressed }) => [
                styles.stopButton, 
                { backgroundColor: activeSession.type === 'feed' ? '#C8E6C9' : '#C5CAE9', opacity: pressed ? 0.7 : 1 }
              ]}
              onPress={() => {
                if (activeSession.type === 'sleep') {
                  // If it's sleep, we usually want to log it
                  router.push('/log/sleep');
                } else {
                  useBabyStore.getState().stopSession(activeSession.type);
                }
              }}
            >
              <X size={20} color={activeSession.type === 'feed' ? '#2E7D32' : '#1A237E'} />
            </Pressable>
          </Card>
        )}

        {/* Consolidated Daily Summary */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Typography variant="headline" weight="700">Today's Summary</Typography>
            <View style={styles.statsRow}>
              <StatPill icon={<Milk size={14} color="#4A5D4C" />} count={feedCount} color="#E8F5E9" />
              <StatPill icon={<Moon size={14} color="#1A237E" />} count={sleepCount} color="#E3F2FD" />
              <StatPill icon={<Droplet size={14} color="#E65100" />} count={diaperCount} color="#FFF3E0" />
            </View>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.summaryScroll} contentContainerStyle={styles.summaryContent}>
            <SummaryCard 
              icon={<Milk size={20} color={themeColors.primary} />}
              label="Last Feed"
              value={lastFeed ? formatDistanceToNow(new Date(lastFeed.timestamp)) + ' ago' : 'No data'}
              accent={themeColors.primary}
            />
            <SummaryCard 
              icon={<Moon size={20} color={themeColors.secondary} />}
              label="Last Sleep"
              value={lastSleep ? formatDistanceToNow(new Date(lastSleep.timestamp)) + ' ago' : 'No data'}
              accent={themeColors.secondary}
            />
            <SummaryCard 
              icon={<Droplet size={20} color={themeColors.tertiary} />}
              label="Last Diaper"
              value={lastDiaper ? formatDistanceToNow(new Date(lastDiaper.timestamp)) + ' ago' : 'No data'}
              accent={themeColors.tertiary}
            />
          </ScrollView>
        </View>

        {/* Quick Actions Grid */}
        <View style={styles.section}>
          <Typography variant="headline" weight="700" style={styles.sectionTitle}>Quick Actions</Typography>
          <View style={styles.actionGrid}>
            <QuickAction 
              icon={<Plus size={32} color={themeColors.primary} />}
              label="Start Feed"
              backgroundColor={colorScheme === 'light' ? '#E8F5E9' : '#1B2E1D'}
              onPress={() => router.push('/log/feed')}
            />
            <QuickAction 
              icon={<Moon size={32} color={themeColors.secondary} />}
              label="Start Sleep"
              backgroundColor={colorScheme === 'light' ? '#E3F2FD' : '#1A237E20'}
              onPress={() => router.push('/log/sleep')}
            />
            <QuickAction 
              icon={<Droplet size={32} color={themeColors.tertiary} />}
              label="Log Diaper"
              backgroundColor={colorScheme === 'light' ? '#FFF3E0' : '#3E272320'}
              onPress={() => router.push('/log/diaper')}
            />
            <QuickAction 
              icon={<Pill size={32} color={themeColors.primary} />}
              label="Medication"
              backgroundColor={themeColors.surfaceVariant + '40'}
              onPress={() => router.push('/checklists')}
            />
          </View>
        </View>

        {/* Today's Timeline */}
        <View style={styles.section}>
          <Typography variant="headline" weight="700" style={styles.sectionTitle}>Today's Timeline</Typography>
          <View style={styles.timeline}>
            <View style={[styles.timelineLine, { backgroundColor: themeColors.surfaceVariant }]} />
            {todaysActivities.length > 0 ? (
              todaysActivities.map((activity, index) => (
                <TimelineItem 
                  key={activity.id}
                  activity={activity}
                  icon={getIconForActivity(activity.type, themeColors)}
                  backgroundColor={getBgForActivity(activity.type, colorScheme, themeColors)}
                  isLast={index === todaysActivities.length - 1}
                />
              ))
            ) : (
              <View style={styles.emptyTimeline}>
                <Typography color={themeColors.icon}>No activities logged today yet.</Typography>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function StatPill({ icon, count, color }: any) {
  return (
    <View style={[styles.statPill, { backgroundColor: color }]}>
      {icon}
      <Typography variant="label" weight="700" style={{ marginLeft: 4 }}>{count}</Typography>
    </View>
  );
}

function SummaryCard({ icon, label, value, accent }: any) {
  const colorScheme = useColorScheme() ?? 'light';
  const themeColors = Colors[colorScheme];

  return (
    <Card style={[styles.summaryCard, { borderLeftColor: accent }]}>
      <View style={styles.summaryIcon}>{icon}</View>
      <View>
        <Typography variant="label" color={themeColors.icon}>{label}</Typography>
        <Typography variant="bodyMd" weight="700">{value}</Typography>
      </View>
    </Card>
  );
}

function QuickAction({ icon, label, backgroundColor, onPress }: any) {
  return (
    <Pressable 
      hitSlop={20}
      style={({ pressed }) => [
        styles.actionButton, 
        { backgroundColor, opacity: pressed ? 0.7 : 1, transform: [{ scale: pressed ? 0.96 : 1 }] }
      ]} 
      onPress={onPress}
    >
      {icon}
      <Typography variant="label" weight="600" style={styles.actionLabel}>{label}</Typography>
    </Pressable>
  );
}

function TimelineItem({ activity, icon, backgroundColor, isLast }: any) {
  const colorScheme = useColorScheme() ?? 'light';
  const themeColors = Colors[colorScheme];

  const getTitle = (type: string) => {
    switch (type) {
      case 'feed': return 'Feeding';
      case 'sleep': return 'Sleep';
      case 'diaper': return 'Diaper Change';
      default: return type.charAt(0).toUpperCase() + type.slice(1);
    }
  };

  const getDescription = (activity: any) => {
    const { type, details } = activity;
    if (type === 'feed') {
      const mode = details?.feedMode || 'Breast';
      const content = details?.content ? ` • ${details.content}` : '';
      const amount = details?.amount ? ` • ${details.amount}${details.unit || 'oz'}` : '';
      
      if (mode === 'Breast') {
        const formatSecs = (s: number) => {
          const m = Math.floor(s / 60);
          const rs = s % 60;
          return m > 0 ? `${m}m ${rs}s` : `${rs}s`;
        };
        const left = details?.leftDuration ? `L: ${formatSecs(details.leftDuration)}` : '';
        const right = details?.rightDuration ? `R: ${formatSecs(details.rightDuration)}` : '';
        const parts = [left, right].filter(Boolean);
        return `Breast • ${parts.length > 0 ? parts.join(' • ') : '0s'}`;
      }
      return `${mode}${content}${amount}`;
    }
    if (type === 'sleep') {
      const mins = Math.floor((details?.duration || 0) / 60);
      const quality = details?.quality || 'Good';
      const formattedQuality = quality.charAt(0).toUpperCase() + quality.slice(1).toLowerCase();
      return `Duration: ${mins} mins\nQuality: ${formattedQuality}`;
    }
    if (type === 'diaper') {
      return `Type: ${details?.diaperType || 'Wet'} • ${details?.hasRash ? 'Rash noted' : 'Clean'}`;
    }
    return details?.note || 'Activity completed';
  };

  return (
    <View style={styles.timelineItem}>
      <View style={[styles.timelineIcon, { backgroundColor }]}>
        {icon}
      </View>
      <Card style={styles.timelineContent}>
        <View style={styles.timelineHeader}>
          <Typography variant="bodyMd" weight="700">{getTitle(activity.type)}</Typography>
          <Typography variant="label" color={themeColors.icon}>{format(new Date(activity.timestamp), 'h:mm a')}</Typography>
        </View>
        <Typography variant="label" color={themeColors.icon}>{getDescription(activity)}</Typography>
        
        {activity.details?.notes ? (
          <View style={[styles.noteBubble, { backgroundColor: themeColors.surfaceVariant + '40' }]}>
            <MessageSquare size={12} color={themeColors.icon} style={{ marginRight: 6 }} />
            <Typography variant="label" style={styles.noteText}>{activity.details.notes}</Typography>
          </View>
        ) : null}
      </Card>
    </View>
  );
}

function getIconForActivity(type: string, themeColors: any) {
  switch (type) {
    case 'feed': return <Milk size={18} color={themeColors.primary} />;
    case 'sleep': return <Moon size={18} color={themeColors.secondary} />;
    case 'diaper': return <Droplet size={18} color={themeColors.tertiary} />;
    default: return <BabyIcon size={18} color={themeColors.icon} />;
  }
}

function getBgForActivity(type: string, colorScheme: string, themeColors: any) {
  switch (type) {
    case 'feed': return colorScheme === 'light' ? '#E8F5E9' : '#1B2E1D';
    case 'sleep': return colorScheme === 'light' ? '#E3F2FD' : '#1A237E20';
    case 'diaper': return colorScheme === 'light' ? '#FFF3E0' : '#3E272320';
    default: return themeColors.surfaceVariant + '40';
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
    gap: 20, // Reduced from 28 to pull content higher
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8, // Reduced from 12
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  headerInfo: {
    gap: 2,
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationDot: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#fff',
  },
  activeSessionCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderRadius: 24,
    borderWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  activeSessionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  activeIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeSessionMain: {
    flex: 1,
  },
  stopButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    gap: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  summaryScroll: {
    marginHorizontal: -20,
  },
  summaryContent: {
    paddingHorizontal: 20,
    gap: 16,
  },
  summaryCard: {
    width: 160,
    padding: 16,
    borderRadius: 20,
    borderLeftWidth: 4,
    gap: 12,
  },
  summaryIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  sectionTitle: {
    marginBottom: 4,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  actionButton: {
    width: (width - 56) / 2,
    padding: 20,
    borderRadius: 24,
    alignItems: 'center',
    gap: 12,
  },
  actionLabel: {
    textAlign: 'center',
  },
  analyticsCard: {
    padding: 24,
    borderRadius: 32,
    gap: 24,
  },
  analyticsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  trendBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chartContainer: {
    flexDirection: 'row',
    height: 120,
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  chartBarWrapper: {
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  chartBar: {
    width: 32,
    borderRadius: 8,
  },
  chartDay: {
    fontSize: 11,
    fontWeight: '600',
  },
  timeline: {
    gap: 20,
    paddingLeft: 20,
  },
  timelineLine: {
    position: 'absolute',
    left: 20,
    top: 20,
    bottom: 20,
    width: 2,
    opacity: 0.5,
  },
  timelineItem: {
    flexDirection: 'row',
    gap: 20,
    alignItems: 'center',
  },
  timelineIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  timelineContent: {
    flex: 1,
    padding: 16,
    gap: 4,
  },
  timelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  emptyTimeline: {
    padding: 20,
    alignItems: 'center',
  },
  noteBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  noteText: {
    flex: 1,
    fontStyle: 'italic',
    fontSize: 11,
  },
});
