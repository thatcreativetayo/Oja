import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const BASE_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:3000';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export class UploadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UploadError';
  }
}

export async function uploadImage(uri: string): Promise<string> {
  // Validate file exists and get size
  const fileInfo = await FileSystem.getInfoAsync(uri);
  
  if (!fileInfo.exists) {
    throw new UploadError('File not found');
  }

  if (fileInfo.size && fileInfo.size > MAX_FILE_SIZE) {
    throw new UploadError('File size must be less than 5MB');
  }

  // Get auth token
  const token = await AsyncStorage.getItem('oja_token');
  if (!token) {
    throw new UploadError('Authentication required');
  }

  // Create FormData
  const formData = new FormData();
  formData.append('file', {
    uri,
    type: 'image/jpeg',
    name: 'upload.jpg',
  } as any);

  try {
    const response = await fetch(`${BASE_URL}/api/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new UploadError(errorData.message || 'Upload failed');
    }

    const data = await response.json();
    
    if (!data.success || !data.data?.url) {
      throw new UploadError('Invalid response from server');
    }

    return data.data.url;
  } catch (error: any) {
    if (error instanceof UploadError) {
      throw error;
    }
    throw new UploadError('Failed to upload image. Please try again.');
  }
}

export const uploadService = {
  uploadImage,
};

export default uploadService;
