import * as FileSystem from 'expo-file-system';

import * as MediaLibrary from 'expo-media-library';

export const saveImagePermanently = async (tempUri: string): Promise<string> => {
  try {
    if (!tempUri) return '';
    
    // Create a permanent filename (Portable: just the filename)
    const filename = `baby_photo_${Date.now()}.jpg`;
    const permanentUri = `${FileSystem.documentDirectory}${filename}`;
    
    // Copy the file from temp to permanent storage
    await FileSystem.copyAsync({
      from: tempUri,
      to: permanentUri
    });
    
    // Return ONLY the filename to ensure portability across app updates/UUID changes
    return filename;
  } catch (error) {
    console.error('Error persisting image:', error);
    return tempUri;
  }
};

/**
 * Resolves a stored image path (filename or absolute URI) to the current document directory.
 * This ensures photos stay visible even after the app's internal UUID changes.
 */
export const resolveImageUri = (storedUri: string | undefined): string | null => {
  if (!storedUri) return null;
  
  // If it's already a full file URI and exists, keep it (backwards compatibility)
  if (storedUri.startsWith('file://')) return storedUri;
  
  // If it's just a filename, join it with the current document directory
  return `${FileSystem.documentDirectory}${storedUri}`;
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
