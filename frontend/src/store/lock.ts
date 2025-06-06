import { create } from 'zustand';
import api from '@/lib/axios';
import Cookies from 'js-cookie';

interface LockState {
  currentLock: string | null;
  cleanup: (() => void) | null;
  releaseLock: () => Promise<void>;
  acquireLock: (appointmentId: string) => Promise<void>;
  initializeLock: () => void;
}

// Helper to get persisted lock
const getPersistedLock = () => {
  if (typeof window === 'undefined') return null;
  const persisted = localStorage.getItem('currentLock');
  return persisted ? persisted : null;
};

export const useLockStore = create<LockState>((set, get) => ({
  currentLock: getPersistedLock(),
  cleanup: null,

  initializeLock: () => {
    const currentLock = getPersistedLock();
    if (currentLock) {
      set({ currentLock });

      // Setup cleanup when tab/window is closed
      if (typeof window !== 'undefined') {
        const cleanup = () => {
          const lock = get().currentLock;
          const token = Cookies.get('token');

          if (lock && token) {
            try {
              const blob = new Blob([JSON.stringify({
                appointmentId: lock,
                authorization: `Bearer ${token}`
              })], {
                type: 'application/json'
              });

              navigator.sendBeacon(
                `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'}/appointments/release-lock`,
                blob
              );

              // Clear persisted lock
              localStorage.removeItem('currentLock');
            } catch (error) {
              console.error('Failed to release lock during cleanup:', error);
            }
          }
        };

        // Add event listeners
        window.addEventListener('beforeunload', cleanup);
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'hidden') {
            cleanup();
          }
        });

        // Store the cleanup function for later removal
        const removeListeners = () => {
          console.log('Removing event listeners');
          window.removeEventListener('beforeunload', cleanup);
          document.removeEventListener('visibilitychange', cleanup);
        };

        // Store cleanup function in state
        set({ cleanup: removeListeners });
      }
    }
  },

  acquireLock: async (appointmentId: string) => {
    try {
      console.log('Acquiring lock for:', appointmentId);
      await api.post(`/appointments/${appointmentId}/acquire-lock`);
      console.log('Lock acquired, setting state');

      // Persist lock in localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('currentLock', appointmentId);
      }

      set({ currentLock: appointmentId });

      // Setup cleanup when tab/window is closed
      if (typeof window !== 'undefined') {
        const cleanup = () => {
          const currentLock = get().currentLock;
          const token = Cookies.get('token');

          if (currentLock && token) {
            try {
              const blob = new Blob([JSON.stringify({
                appointmentId: currentLock,
                authorization: `Bearer ${token}`
              })], {
                type: 'application/json'
              });

              navigator.sendBeacon(
                `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'}/appointments/release-lock`,
                blob
              );

              // Clear persisted lock
              localStorage.removeItem('currentLock');
            } catch (error) {
              console.error('Failed to release lock during cleanup:', error);
            }
          }
        };

        // Add event listeners
        window.addEventListener('beforeunload', cleanup);
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'hidden') {
            cleanup();
          }
        });

        // Store the cleanup function for later removal
        const removeListeners = () => {
          console.log('Removing event listeners');
          window.removeEventListener('beforeunload', cleanup);
          document.removeEventListener('visibilitychange', cleanup);
        };

        // Store cleanup function in state
        set({ cleanup: removeListeners });
      }
    } catch (error) {
      console.error('Failed to acquire lock:', error);
      throw error;
    }
  },

  releaseLock: async () => {
    console.log('Release lock called');
    const currentLock = get().currentLock;
    const cleanup = get().cleanup;
    console.log('Current lock:', currentLock);

    if (currentLock) {
      try {
        console.log('Sending release request');
        await api.delete(`/appointments/${currentLock}/release-lock`);
        console.log('Lock released successfully');
        if (cleanup) {
          cleanup();
        }

        // Clear persisted lock
        if (typeof window !== 'undefined') {
          localStorage.removeItem('currentLock');
        }

        set({ currentLock: null, cleanup: null });
      } catch (error) {
        console.error('Failed to release lock:', error);
        throw error;
      }
    } else {
      console.log('No current lock to release');
    }
  },
}));