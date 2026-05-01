import * as FileSystem from 'expo-file-system/legacy';

const STORAGE_FILE = `${FileSystem.documentDirectory}mummum_storage.json`;

const getStorageData = async (): Promise<Record<string, string>> => {
  try {
    const info = await FileSystem.getInfoAsync(STORAGE_FILE);
    if (!info.exists) return {};
    const content = await FileSystem.readAsStringAsync(STORAGE_FILE);
    return JSON.parse(content);
  } catch (e) {
    return {};
  }
};

const saveStorageData = async (data: Record<string, string>) => {
  try {
    await FileSystem.writeAsStringAsync(STORAGE_FILE, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save to permanent storage:', e);
  }
};

export const SafeStorage = {
  getItem: async (key: string): Promise<string | null> => {
    const data = await getStorageData();
    return data[key] || null;
  },
  setItem: async (key: string, value: string): Promise<void> => {
    const data = await getStorageData();
    data[key] = value;
    await saveStorageData(data);
  },
  removeItem: async (key: string): Promise<void> => {
    const data = await getStorageData();
    delete data[key];
    await saveStorageData(data);
  },
};

