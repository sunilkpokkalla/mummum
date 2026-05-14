import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { SafeStorage } from '@/lib/storage';
import { format } from 'date-fns';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

export type ActivityType = 'feed' | 'sleep' | 'diaper' | 'growth' | 'milestone' | 'vaccination' | 'medicine';

export interface Activity {
  id: string;
  babyId: string;
  type: ActivityType;
  timestamp: Date;
  details: any;
}

export interface Memory {
  id: string;
  babyId: string;
  uri: string;
  title: string;
  timestamp: Date;
}

export interface Baby {
  id: string;
  name: string;
  birthDate: Date;
  gender?: string;
  age?: string;
  photoUri?: string;
}

export interface Appointment {
  id: string;
  babyId: string;
  title: string;
  doctor: string;
  date: string; // ISO String
  time: string; // "09:00 AM"
  notes?: string;
  notificationIds?: string[];
}

export interface DayCareLog {
  id: string;
  babyId: string;
  date: string; // ISO String
  dropOffTime?: string;
  pickUpTime?: string;
  notes?: string;
  suppliesProvided: string[]; // item IDs from a standard list
}

export interface Reminder {
  id: string;
  title: string;
  time: string; // "08:00 AM"
  enabled: boolean;
  notificationId?: string;
}

interface ActiveSession {
  babyId: string;
  type: ActivityType;
  startTime: Date;
  details?: any;
  side?: 'L' | 'R';
}

interface BabyState {
  babies: Baby[];
  currentBabyId: string | null;
  activities: Activity[];
  activeSessions: ActiveSession[];
  memories: Memory[];
  completedChecklistItems: Record<string, Record<string, string[]>>; // babyId -> dateKey -> itemIds
  completedMilestones: Record<string, string[]>; // babyId -> itemIds
  customReminders: Reminder[];
  userStandardTasks: { id: string; title: string; time: string; type: string }[];
  standardTaskSettings: Record<string, { time: string; enabled: boolean; notificationId?: string }>;
  isOnboarded: boolean;
  userPhotoUri: string | null;
  userName: string;
  tempBaby: Partial<Baby>;
  appointments: Appointment[];
  dayCareLogs: DayCareLog[];
  isPro: boolean;
  isSyncing: boolean;
  _hasHydrated: boolean;
  globalModalConfig: {
    visible: boolean;
    title: string;
    description: string;
    confirmText?: string;
    secondaryText?: string;
    cancelText?: string;
    onConfirm?: () => void;
    onSecondary?: () => void;
    isDestructive?: boolean;
  };
  setHydrated: (status: boolean) => void;
  
  // Actions
  addBaby: (baby: Baby) => void;
  updateBaby: (id: string, data: Partial<Baby>) => void;
  updateUserPhoto: (uri: string | null) => void;
  updateUserName: (name: string) => void;
  setCurrentBaby: (id: string) => void;
  addActivity: (activity: Omit<Activity, 'id' | 'babyId'>) => void;
  updateActivity: (id: string, data: Partial<Activity>) => void;
  deleteActivity: (id: string) => void;
  startSession: (session: ActiveSession) => void;
  stopSession: (type: ActivityType) => void;
  addMemory: (memory: Omit<Memory, 'babyId'>) => void;
  toggleChecklistItem: (id: string) => void;
  toggleMilestone: (id: string) => void;
  addReminder: (reminder: Reminder) => void;
  updateReminder: (id: string, data: Partial<Reminder>) => void;
  deleteReminder: (id: string) => void;
  addAppointment: (appointment: Omit<Appointment, 'babyId'>) => void;
  deleteAppointment: (id: string) => void;
  addDayCareLog: (log: Omit<DayCareLog, 'babyId'>) => void;
  updateDayCareLog: (id: string, data: Partial<DayCareLog>) => void;
  deleteDayCareLog: (id: string) => void;
  addUserStandardTask: (task: { id: string; title: string; time: string; type: string }) => void;
  deleteUserStandardTask: (id: string) => void;
  updateStandardTaskSetting: (id: string, setting: { time: string; enabled: boolean; notificationId?: string }) => void;
  completeOnboarding: () => void;
  updateTempBaby: (data: Partial<Baby>) => void;
  setPro: (status: boolean) => void;
  setSyncing: (status: boolean) => void;
  showGlobalModal: (config: { title: string; description: string; confirmText?: string; secondaryText?: string; cancelText?: string; onConfirm?: () => void; onSecondary?: () => void; isDestructive?: boolean }) => void;
  hideGlobalModal: () => void;
  resetStore: () => void;
  toggleReminder: (id: string) => void;
  syncToCloud: () => Promise<void>;
  pullFromCloud: () => Promise<void>;
  setStore: (data: Partial<BabyState>) => void;
}

// Utility to push data to Firestore
const pushToFirestore = async (state: Partial<BabyState>) => {
  const user = auth().currentUser;
  if (!user) return;

  try {
    // PRE-SYNC CLEANUP: Ensure we don't push undefined or malformed fields
    const payload = {
      babies: state.babies || [],
      currentBabyId: state.currentBabyId || (state.babies?.[0]?.id) || null,
      activities: state.activities || [],
      memories: state.memories || [],
      appointments: state.appointments || [],
      dayCareLogs: state.dayCareLogs || [],
      completedChecklistItems: state.completedChecklistItems || {},
      completedMilestones: state.completedMilestones || {},
      customReminders: state.customReminders || [],
      userStandardTasks: state.userStandardTasks || [],
      standardTaskSettings: state.standardTaskSettings || {},
      userName: state.userName || 'Parent',
      userPhotoUri: state.userPhotoUri || null,
      isPro: !!state.isPro,
      isOnboarded: !!state.isOnboarded,
      updatedAt: firestore.FieldValue.serverTimestamp(),
    };

    await firestore().collection('users').doc(user.uid).set(payload, { merge: true });
    console.log('[Cloud Sync]: Data pushed successfully');
  } catch (e) {
    console.error('[Cloud Sync]: Push failed:', e);
  }
};

// Recursive helper to convert Firestore Timestamps to JS Dates
const rehydrateDates = (obj: any): any => {
  if (!obj || typeof obj !== 'object') return obj;

  // Handle Firestore Timestamp
  if (obj.seconds !== undefined && obj.nanoseconds !== undefined) {
    return new Date(obj.seconds * 1000);
  }

  // Handle ISO Strings in specific date-related fields
  // (Optional: can be aggressive, but focusing on known timestamp fields is safer)

  // Handle Arrays
  if (Array.isArray(obj)) {
    return obj.map(rehydrateDates);
  }

  // Handle Objects
  const newObj: any = {};
  for (const key in obj) {
    // If it's a timestamp string (like from AsyncStorage hydration), convert to Date
    const value = obj[key];
    if (typeof value === 'string' && (key === 'timestamp' || key === 'startTime' || key === 'endTime' || key === 'birthDate')) {
      const d = new Date(value);
      if (!isNaN(d.getTime())) {
        newObj[key] = d;
        continue;
      }
    }
    newObj[key] = rehydrateDates(value);
  }
  return newObj;
};

export const useBabyStore = create<BabyState>()(
  persist(
    (set, get) => ({
      babies: [],
      currentBabyId: null,
      activities: [],
      activeSessions: [],
      memories: [],
      completedChecklistItems: {},
      completedMilestones: {},
      customReminders: [],
      userStandardTasks: [],
      standardTaskSettings: {},
      isOnboarded: false,
      userPhotoUri: null,
      userName: 'Parent',
      tempBaby: {},
      appointments: [],
      dayCareLogs: [],
      isPro: false,
      isSyncing: false,
      _hasHydrated: false,
      globalModalConfig: {
        visible: false,
        title: '',
        description: '',
      },

      addBaby: (baby) => set((state) => ({
        babies: [...state.babies, baby],
        currentBabyId: state.currentBabyId || baby.id
      })),

      updateBaby: (id, data) => set((state) => ({
        babies: state.babies.map((b) => b.id === id ? { ...b, ...data } : b)
      })),

      updateUserPhoto: (uri) => set({ userPhotoUri: uri }),
      updateUserName: (name) => set({ userName: name }),
      setCurrentBaby: (id) => set({ currentBabyId: id }),

      addActivity: (activity) => set((state) => {
        const newActivity = {
          ...activity,
          id: Date.now().toString(),
          babyId: state.currentBabyId || '',
        };
        return { activities: [newActivity, ...state.activities] };
      }),

      updateActivity: (id, data) => set((state) => ({
        activities: state.activities.map((a) => a.id === id ? { ...a, ...data } : a)
      })),

      deleteActivity: (id) => set((state) => ({
        activities: state.activities.filter((a) => a.id !== id)
      })),

      startSession: (session) => set((state) => ({
        activeSessions: [...state.activeSessions, session]
      })),

      stopSession: (type) => set((state) => ({
        activeSessions: state.activeSessions.filter((s) => s.type !== type)
      })),

      addMemory: (memory) => set((state) => ({
        memories: [{ ...memory, babyId: state.currentBabyId || '' }, ...state.memories]
      })),

      toggleChecklistItem: (id) => set((state) => {
        const babyId = state.currentBabyId || 'default';
        const dateKey = format(new Date(), 'yyyy-MM-dd');
        const currentItems = state.completedChecklistItems[babyId]?.[dateKey] || [];
        
        const newItems = currentItems.includes(id)
          ? currentItems.filter(i => i !== id)
          : [...currentItems, id];

        return {
          completedChecklistItems: {
            ...state.completedChecklistItems,
            [babyId]: {
              ...state.completedChecklistItems[babyId],
              [dateKey]: newItems
            }
          }
        };
      }),

      toggleMilestone: (id) => set((state) => {
        const babyId = state.currentBabyId || 'default';
        const currentMilestones = state.completedMilestones[babyId] || [];
        
        const newMilestones = currentMilestones.includes(id)
          ? currentMilestones.filter(m => m !== id)
          : [...currentMilestones, id];

        return {
          completedMilestones: {
            ...state.completedMilestones,
            [babyId]: newMilestones
          }
        };
      }),

      addReminder: (reminder) => set((state) => ({
        customReminders: [...state.customReminders, reminder]
      })),

      updateReminder: (id, data) => set((state) => ({
        customReminders: state.customReminders.map(r => r.id === id ? { ...r, ...data } : r)
      })),

      toggleReminder: (id) => set((state) => ({
        customReminders: state.customReminders.map(r => 
          r.id === id ? { ...r, enabled: !r.enabled } : r
        )
      })),

      deleteReminder: (id) => set((state) => ({
        customReminders: state.customReminders.filter(r => r.id !== id)
      })),

      addAppointment: (appointment) => set((state) => ({
        appointments: [{ ...appointment, babyId: state.currentBabyId || '' }, ...state.appointments]
      })),

      deleteAppointment: (id) => set((state) => ({
        appointments: state.appointments.filter(a => a.id !== id)
      })),

      addDayCareLog: (log) => set((state) => ({
        dayCareLogs: [{ ...log, babyId: state.currentBabyId || '' }, ...state.dayCareLogs]
      })),

      updateDayCareLog: (id, data) => set((state) => ({
        dayCareLogs: state.dayCareLogs.map(l => l.id === id ? { ...l, ...data } : l)
      })),

      deleteDayCareLog: (id) => set((state) => ({
        dayCareLogs: state.dayCareLogs.filter(l => l.id !== id)
      })),

      updateStandardTaskSetting: (id, setting) => set((state) => ({
        standardTaskSettings: {
          ...state.standardTaskSettings,
          [id]: { ...state.standardTaskSettings[id], ...setting }
        }
      })),

      addUserStandardTask: (task) => set((state) => ({
        userStandardTasks: [...state.userStandardTasks, task]
      })),

      deleteUserStandardTask: (id) => set((state) => ({
        userStandardTasks: state.userStandardTasks.filter(t => t.id !== id)
      })),

      completeOnboarding: () => set({ isOnboarded: true }),

      updateTempBaby: (data) => set((state) => ({
        tempBaby: { ...state.tempBaby, ...data }
      })),
      
      setPro: (status) => set({ isPro: status }),
      setSyncing: (status) => set({ isSyncing: status }),
      setHydrated: (status) => set({ _hasHydrated: status }),
      
      showGlobalModal: (config) => set({ 
        globalModalConfig: { 
          ...config, 
          visible: true, 
          onConfirm: config.onConfirm || (() => get().hideGlobalModal())
        } 
      }),
      
      hideGlobalModal: () => set((state) => ({ 
        globalModalConfig: { ...state.globalModalConfig, visible: false } 
      })),

      resetStore: () => set({
        babies: [],
        currentBabyId: null,
        activities: [],
        activeSessions: [],
        memories: [],
        completedChecklistItems: {},
        completedMilestones: {},
        customReminders: [],
        userStandardTasks: [],
        standardTaskSettings: {},
        isOnboarded: false,
        tempBaby: {},
        userName: 'Parent',
        userPhotoUri: null,
        isPro: false,
      }),

      setStore: (data) => set((state) => ({
        ...state,
        ...data
      })),

      syncToCloud: async () => {
        const state = useBabyStore.getState();
        await pushToFirestore(state);
      },

      pullFromCloud: async () => {
        const user = auth().currentUser;
        if (!user) return;

        try {
          const doc = await firestore().collection('users').doc(user.uid).get();
          if (doc.exists) {
            const data = doc.data();
            if (data) {
              const rehydrated = rehydrateDates(data);
              const state = get();

              // SMART MERGE: Avoid overwriting local data with empty cloud fields
              const mergeArrays = (local: any[], cloud: any[]) => {
                if (!cloud || cloud.length === 0) return local;
                const localIds = new Set(local.map(i => i.id));
                const uniqueCloud = cloud.filter(i => !localIds.has(i.id));
                return [...uniqueCloud, ...local];
              };

              const mergedActivities = mergeArrays(state.activities, rehydrated.activities || []);
              const mergedBabies = mergeArrays(state.babies, rehydrated.babies || []);

              // Check if cloud actually has data worth restoring
              const cloudHasData = (rehydrated.activities?.length > 0 || rehydrated.babies?.length > 0);
              const localIsEmpty = (state.activities.length === 0 && state.babies.length === 0);

              if (cloudHasData || localIsEmpty) {
                set({
                  babies: mergedBabies,
                  currentBabyId: rehydrated.currentBabyId || state.currentBabyId || mergedBabies[0]?.id || null,
                  activities: mergedActivities,
                  memories: mergeArrays(state.memories, rehydrated.memories || []),
                  appointments: mergeArrays(state.appointments, rehydrated.appointments || []),
                  dayCareLogs: mergeArrays(state.dayCareLogs, rehydrated.dayCareLogs || []),
                  
                  // For objects (checklist/milestones), we merge keys
                  completedMilestones: { ...rehydrated.completedMilestones, ...state.completedMilestones },
                  completedChecklistItems: { ...rehydrated.completedChecklistItems, ...state.completedChecklistItems },
                  
                  customReminders: mergeArrays(state.customReminders, rehydrated.customReminders || []),
                  userStandardTasks: mergeArrays(state.userStandardTasks, rehydrated.userStandardTasks || []),
                  standardTaskSettings: { ...rehydrated.standardTaskSettings, ...state.standardTaskSettings },

                  userName: rehydrated.userName || state.userName,
                  userPhotoUri: rehydrated.userPhotoUri || state.userPhotoUri,
                  isPro: rehydrated.isPro !== undefined ? rehydrated.isPro : state.isPro,
                  isOnboarded: (mergedBabies.length > 0) || state.isOnboarded,
                });
                
                // If local had data and cloud was empty, push the merged state back to cloud
                if (!cloudHasData && !localIsEmpty) {
                  console.log('[Cloud Sync]: Migrating local data to cloud account...');
                  await get().syncToCloud();
                }
              }
            }
          } else {
            // Document doesn't exist -> New user or migration
            const state = get();
            if (state.activities.length > 0 || state.babies.length > 0) {
              console.log('[Cloud Sync]: Initializing cloud profile with local data...');
              await get().syncToCloud();
            }
          }
        } catch (e) {
          console.error('[Cloud Sync]: Pull failed:', e);
        }
      }
    }),
    {
      name: 'mummum-storage',
      storage: createJSONStorage(() => SafeStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    }
  )
);
