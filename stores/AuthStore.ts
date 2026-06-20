import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import api from '../src/lib/api';

interface User {
  userId: string;
  name?: string;
  role: 'buyer' | 'vendor' | 'rider';
  phone?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  kycStatus: string | null;
  isLoading: boolean;
  error: string | null;
}

interface AuthActions {
  sendOtp: (phoneNumber: string) => Promise<void>;
  verifyOtp: (phoneNumber: string, otp: string, role: string) => Promise<void>;
  logout: () => Promise<void>;
  loadSession: () => Promise<void>;
  clearError: () => void;
}

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  token: null,
  kycStatus: null,
  isLoading: false,
  error: null,

  sendOtp: async (phoneNumber: string) => {
    set({ isLoading: true, error: null });
    try {
      await api.post('/api/auth/send-otp', { phoneNumber });
      set({ isLoading: false });
    } catch (error: any) {
      set({ isLoading: false, error: error.message });
      throw error;
    }
  },

  verifyOtp: async (phoneNumber: string, otp: string, role: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post<{
        token: string;
        user: { userId: string; role: string; name?: string; phone?: string };
        kycStatus?: string;
      }>('/api/auth/verify-otp', { phoneNumber, otp, role });

      // Atomically store token and user
      await AsyncStorage.setItem('oja_token', response.token);
      await AsyncStorage.setItem('oja_user', JSON.stringify(response.user));

      set({
        user: response.user,
        token: response.token,
        kycStatus: response.kycStatus || null,
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      set({ isLoading: false, error: error.message });
      throw error;
    }
  },

  logout: async () => {
    await AsyncStorage.multiRemove(['oja_token', 'oja_user']);
    set({ user: null, token: null, kycStatus: null, error: null });
  },

  loadSession: async () => {
    set({ isLoading: true });
    try {
      const token = await AsyncStorage.getItem('oja_token');
      const userJson = await AsyncStorage.getItem('oja_user');

      if (!token || !userJson) {
        set({ isLoading: false });
        return;
      }

      // Validate token with backend
      try {
        const user = await api.get<User>('/api/auth/me');
        set({
          user,
          token,
          isLoading: false,
          error: null,
        });
      } catch (error) {
        // Token invalid - clear session
        await AsyncStorage.multiRemove(['oja_token', 'oja_user']);
        set({ user: null, token: null, isLoading: false, error: null });
      }
    } catch (error) {
      set({ isLoading: false, error: null });
    }
  },

  clearError: () => set({ error: null }),
}));
