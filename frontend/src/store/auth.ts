import { create } from 'zustand';
import { User } from '@/types';
import api from '@/lib/axios';
import Cookies from 'js-cookie';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  initializeAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: typeof window !== 'undefined' ? Cookies.get('token') || null : null,
  isLoading: false,

  initializeAuth: async () => {
    const token = Cookies.get('token');
    if (token) {
      try {
        const response = await api.get('/auth/me');
        set({ user: response.data.user });
      } catch (error) {
        console.error(error);
        Cookies.remove('token');
        set({ user: null, token: null });
      }
    }
  },

  login: async (email: string, password: string) => {
    set({ isLoading: true });
    try {
      const response = await api.post('/auth/login', { email, password });
      const { user, token } = response.data;

      // Set token in cookie with same settings as backend
      Cookies.set('token', token, {
        expires: 1, // 1 day
        sameSite: 'strict',
        secure: process.env.NODE_ENV === 'production'
      });

      set({ user, token, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  register: async (name: string, email: string, password: string) => {
    set({ isLoading: true });
    try {
      const response = await api.post('/auth/register', { name, email, password });
      const { user, token } = response.data;

      // Set token in cookie with same settings as backend
      Cookies.set('token', token, {
        expires: 1, // 1 day
        sameSite: 'strict',
        secure: process.env.NODE_ENV === 'production'
      });

      set({ user, token, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: () => {
    Cookies.remove('token');
    window.location.href = '/';
    set({ user: null, token: null });
  },
}));

