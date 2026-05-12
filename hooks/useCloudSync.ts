import { useEffect, useRef, useState } from 'react';
import { Platform, NativeModules } from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { useBabyStore } from '@/store/useBabyStore';
import { usePremium } from '@/hooks/usePremium';

export function useCloudSync() {
  const { isPro, setSyncing, _hasHydrated } = useBabyStore();
  const { activities, babies, currentBabyId, memories, appointments, dayCareLogs, completedMilestones, setStore } = useBabyStore();
  const [user, setUser] = useState(auth().currentUser);
  const isInitialLoad = useRef(true);
  const skipNextUpload = useRef(false);

  // REACTIVE AUTH HANDSHAKE
  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged((u) => {
      setUser(u);
      if (u) {
        isInitialLoad.current = true; // Reset initial load on new login to allow fresh fetch
      }
    });
    return unsubscribe;
  }, []);

  // 1. DOWNLOAD FROM CLOUD (On Sign In / App Launch)
  useEffect(() => {
    if (!user || !_hasHydrated) return;

    const fetchCloudData = async () => {
      try {
        // VERIFY PRO STATUS VIA REVENUECAT FIRST
        if (Platform.OS === 'ios' && NativeModules.RNPurchases) {
          const { default: Purchases } = await import('react-native-purchases');
          const customerInfo = await Purchases.getCustomerInfo();
          const hasPro = !!customerInfo.entitlements.active['pro'];
          
          // Update store status to match truth from RevenueCat
          if (hasPro !== useBabyStore.getState().isPro) {
            useBabyStore.getState().setPro(hasPro);
          }

          if (!hasPro) {
            // console.log('[CloudSync] Skip: User is not Pro');
            return;
          }
        }

        setSyncing(true);
        const userDoc = await firestore().collection('users').doc(user.uid).get();
        if (userDoc.exists) {
          const cloudData = userDoc.data();
          if (cloudData) {
            // console.log('[CloudSync] Data downloaded from Firestore');
            
            // USE THE ROBUST STORE REHYDRATOR
            const rehydrateDates = (obj: any): any => {
              if (!obj || typeof obj !== 'object') return obj;
              if (obj.seconds !== undefined && obj.nanoseconds !== undefined) {
                return new Date(obj.seconds * 1000);
              }
              if (Array.isArray(obj)) return obj.map(rehydrateDates);
              const newObj: any = {};
              for (const key in obj) {
                newObj[key] = rehydrateDates(obj[key]);
              }
              return newObj;
            };

            const rehydrated = rehydrateDates(cloudData);

            // Mark that the next change is from a download, so don't upload it back
            skipNextUpload.current = true;
            
            // SAFETY CHECK: Only overwrite if cloud has content or local is empty
            const cloudHasContent = (rehydrated.activities?.length > 0 || rehydrated.babies?.length > 0);
            const localIsEmpty = (activities.length === 0 && babies.length === 0);

            if (cloudHasContent || localIsEmpty) {
              setStore({
                activities: rehydrated.activities || [],
                babies: rehydrated.babies || [],
                currentBabyId: rehydrated.currentBabyId || null,
                memories: rehydrated.memories || [],
                appointments: rehydrated.appointments || [],
                dayCareLogs: rehydrated.dayCareLogs || [],
                completedMilestones: rehydrated.completedMilestones || {},
                completedChecklistItems: rehydrated.completedChecklistItems || {},
                userName: rehydrated.userName || 'Parent',
                userPhotoUri: rehydrated.userPhotoUri || null,
                isPro: rehydrated.isPro !== undefined ? rehydrated.isPro : isPro,
                isOnboarded: (rehydrated.babies?.length > 0)
              });
            }
          }
        }
      } catch (e) {
        console.error('[CloudSync] Download error:', e);
      } finally {
        isInitialLoad.current = false;
        setSyncing(false);
      }
    };

    fetchCloudData();
  }, [user?.uid]);

  // 2. UPLOAD TO CLOUD (On Local Change)
  useEffect(() => {
    if (!user || isInitialLoad.current || !_hasHydrated || !isPro) return;

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
          completedChecklistItems: useBabyStore.getState().completedChecklistItems,
          isPro,
          userName: useBabyStore.getState().userName,
          userPhotoUri: useBabyStore.getState().userPhotoUri,
          lastSync: firestore.FieldValue.serverTimestamp(),
          updatedAt: new Date().toISOString()
        }, { merge: true });
      } catch (e) {
        console.error('[CloudSync] Upload error:', e);
      } finally {
        setSyncing(false);
      }
    };

    const timer = setTimeout(syncToCloud, 2000);
    return () => clearTimeout(timer);
  }, [activities, babies, currentBabyId, memories, appointments, dayCareLogs, completedMilestones, user?.uid]);
}
