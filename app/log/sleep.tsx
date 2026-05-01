import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Pressable, ScrollView, Image, Dimensions, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { format } from 'date-fns';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import Typography from '@/components/Typography';
import Card from '@/components/Card';
import { Bell, Moon, TrendingUp, ChevronRight, Smile, CloudMoon as MoonCloud, Frown } from 'lucide-react-native';
import { useBabyStore } from '@/store/useBabyStore';

const { width } = Dimensions.get('window');

export default function SleepLogScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? 'light';
  const themeColors = Colors[colorScheme];
  const { activities, activeSessions, startSession, stopSession, addActivity, babies, currentBabyId } = useBabyStore();
  const currentBaby = babies.find(b => b.id === currentBabyId);

  const activeSleep = activeSessions.find(s => s.type === 'sleep');
  const [timer, setTimer] = useState(0);
  const [showMoodPicker, setShowMoodPicker] = useState(false);
  const [selectedMood, setSelectedMood] = useState('PEACEFUL');

  const getBabyAge = (birthDate: Date | string | undefined) => {
    if (!birthDate) return '';
    const birth = new Date(birthDate);
    const now = new Date();
    const diffMonths = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
    return `${diffMonths} months old`;
  };

  const sleepActivities = activities
    .filter(a => a.type === 'sleep')
    .sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const totalSleepToday = sleepActivities
    .filter(a => new Date(a.timestamp).toDateString() === new Date().toDateString())
    .reduce((acc, s) => acc + (s.details?.duration || 0), 0);

  useEffect(() => {
    if (activeSleep) {
      const elapsed = Math.floor((new Date().getTime() - new Date(activeSleep.startTime).getTime()) / 1000);
      setTimer(elapsed);
    }
  }, [activeSleep]);

  useEffect(() => {
    let interval: any = null;
    if (activeSleep) {
      interval = setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000);
    } else {
      setTimer(0);
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [activeSleep]);

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${mins}m`;
  };

  const handleStartSleep = () => {
    startSession({
      type: 'sleep',
      startTime: new Date()
    });
  };

  const handleWakeUp = () => {
    setShowMoodPicker(true);
  };

  const handleWakeUpComplete = (mood: string) => {
    addActivity({
      type: 'sleep',
      timestamp: new Date(),
      details: {
        startTime: activeSleep?.startTime || new Date(),
        duration: timer,
        quality: mood
      },
    });
    stopSession('sleep');
    setShowMoodPicker(false);
    router.replace('/(tabs)');
  };

  return (
    <View style={[styles.container, { backgroundColor: '#F8FAFB', paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Image 
            source={currentBaby?.photoUri ? { uri: currentBaby.photoUri } : require('@/assets/images/baby_avatar.png')} 
            style={styles.avatar} 
          />
          <View>
            <Typography variant="headline" weight="700" style={{ color: '#1B3C35' }}>Sleep Log</Typography>
            <Typography variant="label" color="#607D8B">{currentBaby?.name || 'your baby'} • {getBabyAge(currentBaby?.birthDate)}</Typography>
          </View>
        </View>
        <Pressable 
          style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
          hitSlop={10}
        >
          <Bell size={24} color="#1B3C35" />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Current Session Card */}
        <Card style={[styles.sessionCard, !activeSleep && { backgroundColor: '#4A5D4C' }]}>
          <Typography variant="label" weight="700" color="#B0BEC5" style={{ letterSpacing: 1 }}>
            {activeSleep ? 'CURRENT SESSION' : 'AWAKE'}
          </Typography>
          <View style={styles.timerRow}>
            <View>
              <Typography variant="display" weight="700" color="#fff" style={{ fontSize: 28, textAlign: 'center' }}>
                {activeSleep ? `Sleeping for ${formatDuration(timer)}` : 'Baby is currently awake'}
              </Typography>
            </View>
            <Moon size={40} color="#fff" opacity={0.2} style={{ position: 'absolute', right: 0, top: 0 }} />
          </View>

          <View style={styles.timerCircle}>
            <View style={[styles.progressRing, !activeSleep && { borderTopColor: 'rgba(255,255,255,0.2)' }]} />
            <Moon size={32} color="#fff" opacity={activeSleep ? 1 : 0.5} />
          </View>

          {showMoodPicker ? (
            <View style={styles.moodPicker}>
              <Typography variant="label" weight="700" color="rgba(255,255,255,0.7)" style={{ marginBottom: 20, letterSpacing: 1.2 }}>HOW DID BABY WAKE UP? </Typography>
              <View style={styles.moodGrid}>
                <TouchableOpacity style={styles.moodBtn} onPress={() => handleWakeUpComplete('HAPPY')}>
                  <View style={[styles.moodIconCircle, { backgroundColor: '#E8F5E9' }]}>
                    <Smile size={28} color="#4CAF50" />
                  </View>
                  <Typography variant="label" weight="700" color="#fff">Happy</Typography>
                </TouchableOpacity>
                <TouchableOpacity style={styles.moodBtn} onPress={() => handleWakeUpComplete('PEACEFUL')}>
                  <View style={[styles.moodIconCircle, { backgroundColor: '#E3F2FD' }]}>
                    <MoonCloud size={28} color="#2196F3" />
                  </View>
                  <Typography variant="label" weight="700" color="#fff">Calm</Typography>
                </TouchableOpacity>
                <TouchableOpacity style={styles.moodBtn} onPress={() => handleWakeUpComplete('FUSSY')}>
                  <View style={[styles.moodIconCircle, { backgroundColor: '#FFEBEE' }]}>
                    <Frown size={28} color="#F44336" />
                  </View>
                  <Typography variant="label" weight="700" color="#fff">Fussy</Typography>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <Pressable 
              style={({ pressed }) => [
                styles.wakeUpBtn, 
                { opacity: pressed ? 0.9 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] }
              ]} 
              onPress={activeSleep ? handleWakeUp : handleStartSleep}
              hitSlop={10}
            >
              <Typography variant="bodyLg" weight="700" color={activeSleep ? '#345261' : '#4A5D4C'}>
                {activeSleep ? 'Wake Up' : 'Start Sleep'}
              </Typography>
            </Pressable>
          )}
        </Card>

        {/* Daily Summary Card */}
        <Card style={styles.summaryCard}>
          <View style={styles.summaryHeaderRow}>
            <View style={styles.summaryIconContainer}>
              <TrendingUp size={20} color="#2196F3" />
            </View>
            <View style={styles.summaryBadge}>
              <Typography variant="label" weight="700" color="#2196F3">Today</Typography>
            </View>
          </View>
          <View style={{ marginTop: 16 }}>
            <Typography variant="display" weight="700" color="#1A1A1A" style={{ fontSize: 28 }}>
              {formatDuration(totalSleepToday)}
            </Typography>
            <Typography variant="bodyMd" color="#607D8B">Total sleep tracked today.</Typography>
          </View>
        </Card>

        {/* Pro Tip Card */}
        <Card style={styles.tipCard}>
          <View style={styles.tipIcon}>
            <TrendingUp size={24} color="#8D6E63" />
          </View>
          <View style={{ flex: 1 }}>
            <Typography variant="label" weight="700" color="#8D6E63">PRO TIP</Typography>
            <Typography variant="bodyMd" color="#3E2723">
              Keep the room dim during naps for better night rest.
            </Typography>
          </View>
        </Card>

        {/* Log History */}
        <View style={styles.historySection}>
          <View style={styles.sectionHeader}>
            <Typography variant="headline" weight="700" color="#1A1A1A">Log History</Typography>
            <Pressable hitSlop={10} style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
              <Typography variant="label" weight="600" color="#4A5D4C">View Trends</Typography>
            </Pressable>
          </View>

          <View style={styles.historyList}>
            {sleepActivities.slice(0, 5).map((activity) => (
              <HistoryItem 
                key={activity.id}
                title={new Date(activity.timestamp).getHours() > 19 || new Date(activity.timestamp).getHours() < 6 ? "Night Sleep" : "Nap"} 
                time={`${format(new Date(activity.details?.startTime || activity.timestamp), 'HH:mm')} - ${format(new Date(activity.timestamp), 'HH:mm')}`} 
                duration={formatDuration(activity.details?.duration || 0)} 
                mood={activity.details?.quality || "PEACEFUL"} 
                icon={<Moon size={24} color="#FFD54F" />} 
              />
            ))}
            {sleepActivities.length === 0 && (
              <Typography variant="label" color="#B0BEC5" style={{ textAlign: 'center', marginTop: 20 }}>
                No sleep history recorded yet.
              </Typography>
            )}
          </View>
        </View>

        {/* Decoration */}
        <View style={styles.decoration}>
          <View style={styles.moonDecoration}>
            <Moon size={48} color="#FFF9C4" />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function HistoryItem({ title, time, duration, mood, icon }: any) {
  return (
    <Card style={styles.historyCard}>
      <View style={styles.historyLeft}>
        <Typography variant="bodyLg" weight="700" color="#1A1A1A">{title}</Typography>
        <Typography variant="label" color="#607D8B">{time} • {duration}</Typography>
      </View>
      <View style={styles.historyRight}>
        {icon}
        <Typography variant="label" weight="700" color="#B0BEC5" style={{ fontSize: 10, marginTop: 4 }}>{mood}</Typography>
      </View>
    </Card>
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
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#fff',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  content: {
    padding: 24,
    gap: 20,
    paddingBottom: 40,
  },
  sessionCard: {
    padding: 32,
    borderRadius: 40,
    backgroundColor: '#345261', // Dark blue from image
    alignItems: 'center',
    borderWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  timerRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 12,
    marginBottom: 32,
    position: 'relative',
  },
  timerCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
    position: 'relative',
  },
  progressRing: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.1)',
    borderTopColor: '#fff',
  },
  wakeUpBtn: {
    width: '100%',
    height: 64,
    borderRadius: 32,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  moodPicker: {
    width: '100%',
    alignItems: 'center',
  },
  moodGrid: {
    flexDirection: 'row',
    gap: 20,
    justifyContent: 'center',
  },
  moodBtn: {
    alignItems: 'center',
    gap: 8,
  },
  summaryCard: {
    padding: 24,
    borderRadius: 32,
    backgroundColor: '#E3F2FD',
    borderWidth: 0,
    position: 'relative',
  },
  summaryHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#BBDEFB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  moodIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  tipCard: {
    flexDirection: 'row',
    padding: 24,
    borderRadius: 32,
    backgroundColor: '#FBE9E7',
    borderWidth: 0,
    gap: 16,
    alignItems: 'center',
  },
  tipIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFCCBC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  historySection: {
    marginTop: 12,
    gap: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyList: {
    gap: 12,
  },
  historyCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderRadius: 24,
    backgroundColor: '#fff',
    borderWidth: 0,
    borderLeftWidth: 4,
    borderLeftColor: '#345261',
  },
  historyLeft: {
    gap: 4,
  },
  historyRight: {
    alignItems: 'center',
  },
  decoration: {
    alignItems: 'center',
    marginTop: 20,
  },
  moonDecoration: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#E0F2F1',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.5,
  }
});
