import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { SafeStorage } from '@/lib/storage';
import { format } from 'date-fns';

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
  isPro: boolean;
  isTrial: boolean;
  trialStartedAt: number | null;
  
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
  addUserStandardTask: (task: { id: string; title: string; time: string; type: string }) => void;
  deleteUserStandardTask: (id: string) => void;
  updateStandardTaskSetting: (id: string, setting: { time: string; enabled: boolean; notificationId?: string }) => void;
  completeOnboarding: () => void;
  updateTempBaby: (data: Partial<Baby>) => void;
  setPro: (val: boolean, isTrial?: boolean) => void;
  resetStore: () => void;
  toggleReminder: (id: string) => void;
}

export const useBabyStore = create<BabyState>()(
  persist(
    (set) => ({
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
      userName: 'MumMum Parent',
      tempBaby: {},
      isPro: false,
      isTrial: false,
      trialStartedAt: null,

      addBaby: (baby) => set((state) => ({ 
        babies: [...state.babies, baby],
        currentBabyId: state.currentBabyId || baby.id,
        tempBaby: {}
      })),

      updateBaby: (id, data) => set((state) => ({
        babies: state.babies.map((b) => b.id === id ? { ...b, ...data } : b)
      })),

      updateUserPhoto: (uri) => set({ userPhotoUri: uri }),
      
      updateUserName: (name) => set({ userName: name }),

      setCurrentBaby: (id) => set({ currentBabyId: id }),

      addActivity: (activity) => set((state) => ({
        activities: [
          { 
            ...activity, 
            id: Math.random().toString(36).substring(7),
            babyId: state.currentBabyId || '' 
          },
          ...state.activities
        ]
      })),

      updateActivity: (id, data) => set((state) => ({
        activities: state.activities.map(a => a.id === id ? { ...a, ...data } : a)
      })),

      deleteActivity: (id) => set((state) => ({
        activities: state.activities.filter((a) => a.id !== id)
      })),

      startSession: (session) => set((state) => ({
        activeSessions: [
          ...state.activeSessions.filter(s => !(s.type === session.type && s.babyId === state.currentBabyId)), 
          { ...session, babyId: state.currentBabyId || '' }
        ]
      })),

      stopSession: (type) => set((state) => ({
        activeSessions: state.activeSessions.filter(s => !(s.type === type && s.babyId === state.currentBabyId))
      })),
      
      addMemory: (memory) => set((state) => ({
        memories: [
          { ...memory, babyId: state.currentBabyId || '' },
          ...state.memories
        ]
      })),

      toggleChecklistItem: (id) => set((state) => {
        if (!state.currentBabyId) return state;
        const dateKey = format(new Date(), 'yyyy-MM-dd');
        const babyChecklists = state.completedChecklistItems[state.currentBabyId] || {};
        const currentItems = babyChecklists[dateKey] || [];
        
        const newItems = currentItems.includes(id)
          ? currentItems.filter(i => i !== id)
          : [...currentItems, id];
        
        return {
          completedChecklistItems: {
            ...state.completedChecklistItems,
            [state.currentBabyId]: {
              ...babyChecklists,
              [dateKey]: newItems
            }
          }
        };
      }),

      toggleMilestone: (id) => set((state) => {
        if (!state.currentBabyId) return state;
        const currentMilestones = state.completedMilestones[state.currentBabyId] || [];
        const newMilestones = currentMilestones.includes(id)
          ? currentMilestones.filter(m => m !== id)
          : [...currentMilestones, id];
        
        return {
          completedMilestones: {
            ...state.completedMilestones,
            [state.currentBabyId]: newMilestones
          }
        };
      }),

      addReminder: (reminder) => set((state) => ({
        customReminders: [...state.customReminders, reminder]
      })),

      updateReminder: (id, data) => set((state) => ({
        customReminders: state.customReminders.map(r => r.id === id ? { ...r, ...data } : r)
      })),

      deleteReminder: (id) => set((state) => ({
        customReminders: state.customReminders.filter(r => r.id !== id)
      })),

      toggleReminder: (id: string) => set((state) => ({
        customReminders: state.customReminders.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r)
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

      completeOnboarding: () => set((state) => ({ 
        isOnboarded: true,
        trialStartedAt: state.trialStartedAt || Date.now()
      })),

      updateTempBaby: (data) => set((state) => ({
        tempBaby: { ...state.tempBaby, ...data }
      })),
      
      setPro: (val, isTrial = false) => set({ 
        isPro: val, 
        isTrial: isTrial,
        trialStartedAt: isTrial ? Date.now() : null 
      }),

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
      }),
    }),
    {
      name: 'mummum-storage',
      storage: createJSONStorage(() => SafeStorage),
    }
  )
);
