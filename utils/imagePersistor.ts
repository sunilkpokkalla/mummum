import * as FileSystem from 'expo-file-system';

import * as MediaLibrary from 'expo-media-library';

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

export const saveToAlbum = async (uri: string) => {
  try {
    const { status } = await MediaLibrary.requestPermissionsAsync(true);
    if (status === 'granted') {
      await MediaLibrary.saveToLibraryAsync(uri);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error saving to album:', error);
    return false;
  }
};
