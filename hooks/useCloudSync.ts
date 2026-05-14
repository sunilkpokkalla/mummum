import { useEffect, useRef, useState } from 'react';
import { Platform, NativeModules } from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { useBabyStore } from '@/store/useBabyStore';
import { usePremium } from '@/hooks/usePremium';

export function useCloudSync() {
  const { setSyncing, _hasHydrated, pullFromCloud, syncToCloud } = useBabyStore();
  const { activities, babies, currentBabyId, memories, appointments, dayCareLogs, completedMilestones, completedChecklistItems, userName, userPhotoUri, isPro } = useBabyStore();
  const [user, setUser] = useState(auth().currentUser);
  const isInitialLoad = useRef(true);
  const skipNextUpload = useRef(false);

  // REACTIVE AUTH HANDSHAKE
  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged((u) => {
      setUser(u);
      if (u) {
        isInitialLoad.current = true;
      }
    });
    return unsubscribe;
  }, []);

  // 1. DOWNLOAD FROM CLOUD (On Sign In / App Launch)
  useEffect(() => {
    if (!user || !_hasHydrated) return;

    const fetchCloudData = async () => {
      try {
        setSyncing(true);
        
        // RevenueCat Sync
        if (Platform.OS === 'ios' && NativeModules.RNPurchases) {
          const Purchases = require('react-native-purchases').default;
          try {
            await Purchases.logIn(user.uid);
          } catch (loginErr) {
            console.error('[CloudSync] RevenueCat logIn failed:', loginErr);
          }
        }

        // Use central store puller
        await pullFromCloud();
        
        // Mark that the next change is from a download
        skipNextUpload.current = true;
      } catch (e) {
        console.error('[CloudSync] Download error:', e);
      } finally {
        isInitialLoad.current = false;
        setSyncing(false);
      }
    };

    fetchCloudData();
  }, [user?.uid, _hasHydrated]);

  // 2. UPLOAD TO CLOUD (On Local Change)
  useEffect(() => {
    if (!user || isInitialLoad.current || !_hasHydrated) return;

    // If this change came from a download, skip this upload cycle
    if (skipNextUpload.current) {
      skipNextUpload.current = false;
      return;
    }

    const triggerUpload = async () => {
      // Use central store pusher
      await syncToCloud();
    };

    const timer = setTimeout(triggerUpload, 2000);
    return () => clearTimeout(timer);
  }, [
    activities, 
    babies, 
    currentBabyId, 
    memories, 
    appointments, 
    dayCareLogs, 
    completedMilestones, 
    completedChecklistItems, 
    userName, 
    userPhotoUri, 
    isPro, 
    user?.uid
  ]);
}
