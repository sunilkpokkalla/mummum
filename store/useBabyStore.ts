import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { SafeStorage } from '@/lib/storage';

export type ActivityType = 'feed' | 'sleep' | 'diaper' | 'growth' | 'milestone';

export interface Activity {
  id: string;
  type: ActivityType;
  timestamp: Date;
  details: any;
}

export interface Memory {
  id: string;
  uri: string;
  title: string;
  timestamp: Date;
}

export interface Baby {
  id: string;
  name: string;
  birthDate: Date;
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
  type: ActivityType;
  startTime: Date;
  side?: 'L' | 'R';
}

interface BabyState {
  babies: Baby[];
  currentBabyId: string | null;
  activities: Activity[];
  activeSessions: ActiveSession[];
  memories: Memory[];
  completedChecklistItems: string[];
  customReminders: Reminder[];
  isOnboarded: boolean;
  tempBaby: Partial<Baby>;
  
  // Actions
  addBaby: (baby: Baby) => void;
  updateBaby: (id: string, data: Partial<Baby>) => void;
  setCurrentBaby: (id: string) => void;
  addActivity: (activity: Omit<Activity, 'id'>) => void;
  deleteActivity: (id: string) => void;
  startSession: (session: ActiveSession) => void;
  stopSession: (type: ActivityType) => void;
  addMemory: (memory: Memory) => void;
  toggleChecklistItem: (id: string) => void;
  addReminder: (reminder: Reminder) => void;
  updateReminder: (id: string, data: Partial<Reminder>) => void;
  deleteReminder: (id: string) => void;
  completeOnboarding: () => void;
  updateTempBaby: (data: Partial<Baby>) => void;
  resetStore: () => void;
}

export const useBabyStore = create<BabyState>()(
  persist(
    (set) => ({
      babies: [],
      currentBabyId: null,
      activities: [],
      activeSessions: [],
      memories: [],
      completedChecklistItems: [],
      customReminders: [],
      isOnboarded: false,
      tempBaby: {},

      addBaby: (baby) => set((state) => ({ 
        babies: [...state.babies, baby],
        currentBabyId: state.currentBabyId || baby.id 
      })),

      updateBaby: (id, data) => set((state) => ({
        babies: state.babies.map((b) => b.id === id ? { ...b, ...data } : b)
      })),

      setCurrentBaby: (id) => set({ currentBabyId: id }),

      addActivity: (activity) => set((state) => ({
        activities: [
          { ...activity, id: Math.random().toString(36).substring(7) },
          ...state.activities
        ]
      })),

      deleteActivity: (id) => set((state) => ({
        activities: state.activities.filter((a) => a.id !== id)
      })),

      startSession: (session) => set((state) => ({
        activeSessions: [...state.activeSessions.filter(s => s.type !== session.type), session]
      })),

      stopSession: (type) => set((state) => ({
        activeSessions: state.activeSessions.filter(s => s.type !== type)
      })),
      
      addMemory: (memory) => set((state) => ({
        memories: [memory, ...state.memories]
      })),

      toggleChecklistItem: (id) => set((state) => ({
        completedChecklistItems: state.completedChecklistItems.includes(id)
          ? state.completedChecklistItems.filter(i => i !== id)
          : [...state.completedChecklistItems, id]
      })),

      addReminder: (reminder) => set((state) => ({
        customReminders: [...state.customReminders, reminder]
      })),

      updateReminder: (id, data) => set((state) => ({
        customReminders: state.customReminders.map(r => r.id === id ? { ...r, ...data } : r)
      })),

      deleteReminder: (id) => set((state) => ({
        customReminders: state.customReminders.filter(r => r.id !== id)
      })),

      toggleReminder: (id) => set((state) => ({
        customReminders: state.customReminders.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r)
      })),

      completeOnboarding: () => set({ isOnboarded: true }),

      updateTempBaby: (data) => set((state) => ({
        tempBaby: { ...state.tempBaby, ...data }
      })),

      resetStore: () => set({
        babies: [],
        currentBabyId: null,
        activities: [],
        activeSessions: [],
        isOnboarded: false,
        tempBaby: {}
      }),
    }),
    {
      name: 'mummum-storage',
      storage: createJSONStorage(() => SafeStorage),
    }
  )
);
