import { useEffect, useRef } from 'react';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { useBabyStore } from '@/store/useBabyStore';
import { usePremium } from '@/hooks/usePremium';

export function useCloudSync() {
  const { isPro, setSyncing } = useBabyStore();
  const { activities, babies, currentBabyId, memories, appointments, dayCareLogs, completedMilestones, setStore } = useBabyStore();
  const user = auth().currentUser;
  const isInitialLoad = useRef(true);
  const skipNextUpload = useRef(false);

  // 1. DOWNLOAD FROM CLOUD (On Sign In / App Launch)
  useEffect(() => {
    if (!user || !isPro) return;

    const fetchCloudData = async () => {
      try {
        setSyncing(true);
        const userDoc = await firestore().collection('users').doc(user.uid).get();
        if (userDoc.exists) {
          const cloudData = userDoc.data();
          if (cloudData) {
            console.log('[CloudSync] Data downloaded from Firestore');
            
            // TRANSLATION LAYER: Convert Firebase Timestamps back to JS Dates
            const translateDates = (arr: any[]) => arr.map(item => ({
              ...item,
              timestamp: item.timestamp?.toDate ? item.timestamp.toDate() : item.timestamp,
              startTime: item.startTime?.toDate ? item.startTime.toDate() : item.startTime,
              birthDate: item.birthDate?.toDate ? item.birthDate.toDate() : item.birthDate,
            }));

            const translatedActivities = translateDates(cloudData.activities || []);
            const translatedBabies = translateDates(cloudData.babies || []);
            const translatedMemories = translateDates(cloudData.memories || []);

            // Mark that the next change is from a download, so don't upload it back
            skipNextUpload.current = true;
            
            setStore({
              activities: translatedActivities,
              babies: translatedBabies,
              currentBabyId: cloudData.currentBabyId || null,
              memories: translatedMemories,
              appointments: cloudData.appointments || [],
              dayCareLogs: cloudData.dayCareLogs || [],
              completedMilestones: cloudData.completedMilestones || {},
              isOnboarded: (translatedBabies.length > 0)
            });
          }
        }
      } catch (e) {
        if (__DEV__) console.error('[CloudSync] Download error:', e);
      } finally {
        isInitialLoad.current = false;
        setSyncing(false);
      }
    };

    fetchCloudData();
  }, [user?.uid, isPro]);

  // 2. UPLOAD TO CLOUD (On Local Change)
  useEffect(() => {
    if (!user || !isPro || isInitialLoad.current) return;

    // If this change came from a download, skip this upload cycle
    if (skipNextUpload.current) {
      skipNextUpload.current = false;
      return;
    }

    const syncToCloud = async () => {
      try {
        setSyncing(true);
        if (babies.length === 0 && !currentBabyId) return;

        await firestore().collection('users').doc(user.uid).set({
          activities,
          babies,
          currentBabyId,
          memories,
          appointments,
          dayCareLogs,
          completedMilestones,
          lastSync: firestore.FieldValue.serverTimestamp(),
          updatedAt: new Date().toISOString()
        }, { merge: true });
      } catch (e) {
        if (__DEV__) console.error('[CloudSync] Upload error:', e);
      } finally {
        setSyncing(false);
      }
    };

    const timer = setTimeout(syncToCloud, 2000);
    return () => clearTimeout(timer);
  }, [activities, babies, currentBabyId, memories, appointments, dayCareLogs, completedMilestones, user?.uid, isPro]);
}
