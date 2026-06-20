import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const BASE_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:3000';
const DEFAULT_TIMEOUT = 10000; // 10 seconds

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthError';
  }
}

export class ValidationError extends Error {
  details?: Record<string, string>;
  constructor(message: string, details?: Record<string, string>) {
    super(message);
    this.name = 'ValidationError';
    this.details = details;
  }
}

export class ServerError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ServerError';
  }
}

export class NetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NetworkError';
  }
}

export class TimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TimeoutError';
  }
}

async function getToken(): Promise<string | null> {
  return AsyncStorage.getItem('oja_token');
}

async function request<T>(
  method: string,
  path: string,
  body?: object
): Promise<T> {
  const token = await getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT);

  try {
    const response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Handle 401 - clear auth and throw
    if (response.status === 401) {
      await AsyncStorage.multiRemove(['oja_token', 'oja_user']);
      throw new AuthError('Session expired. Please login again.');
    }

    const json = await response.json();

    // Handle error responses
    if (!response.ok) {
      if (response.status >= 400 && response.status < 500) {
        throw new ValidationError(
          json.message || 'Invalid request',
          json.details
        );
      }
      if (response.status >= 500) {
        throw new ServerError(
          "We're having trouble processing your request. Please try again later."
        );
      }
    }

    if (!json.success) {
      throw new Error(json.message || 'Request failed');
    }

    return json.data as T;
  } catch (error: any) {
    clearTimeout(timeoutId);

    if (error.name === 'AbortError') {
      throw new TimeoutError('Request timed out. Please try again.');
    }

    if (error instanceof AuthError ||
        error instanceof ValidationError ||
        error instanceof ServerError ||
        error instanceof TimeoutError) {
      throw error;
    }

    // Network errors
    throw new NetworkError(
      'Network request failed. Please check your internet connection and try again.'
    );
  }
}

export const api = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body: object) => request<T>('POST', path, body),
  patch: <T>(path: string, body?: object) => request<T>('PATCH', path, body || {}),
  delete: <T>(path: string) => request<T>('DELETE', path),
};

export { getToken };
export default api;
