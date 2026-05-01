import * as FileSystem from 'expo-file-system/legacy';

export const saveImagePermanently = async (tempUri: string): Promise<string> => {
  try {
    if (!tempUri) return '';
    
    // Create a permanent filename
    const filename = `baby_photo_${Date.now()}.jpg`;
    const permanentUri = `${FileSystem.documentDirectory}${filename}`;
    
    // Copy the file from temp to permanent storage
    await FileSystem.copyAsync({
      from: tempUri,
      to: permanentUri
    });
    
    return permanentUri;
  } catch (error) {
    console.error('Error persisting image:', error);
    return tempUri; // Fallback to temp if copy fails
  }
};
