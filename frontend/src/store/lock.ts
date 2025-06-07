import { create } from 'zustand';
import api from '@/lib/axios';
import Cookies from 'js-cookie';

interface LockState {
  currentLock: string | null;
  cleanup: (() => void) | null;
  lastActivity: number | null;
  releaseLock: () => Promise<void>;
  acquireLock: (appointmentId: string) => Promise<void>;
  initializeLock: () => void;
  setupAutoExtend: () => void;
  updateActivity: () => void;
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
  lastActivity: null,

  updateActivity: () => {
    set({ lastActivity: Date.now() });
  },

  initializeLock: () => {
    const currentLock = getPersistedLock();
    if (currentLock) {
      set({ currentLock, lastActivity: Date.now() });
      // Setup auto-extend and cleanup
      get().setupAutoExtend();
    }
  },

  setupAutoExtend: () => {
    const CHECK_INTERVAL = 10000; // Check every 10 seconds
    const INACTIVITY_TIMEOUT = 5 * 60 * 1000; // 5 minutes

    // Clear any existing intervals
    const existingCleanup = get().cleanup;
    if (typeof existingCleanup === 'function') {
      existingCleanup();
    }

    const checkInactivity = async () => {
      const { lastActivity } = get();
      if (!lastActivity) return;

      const now = Date.now();
      const inactiveTime = now - lastActivity;

      // Release lock if user has been inactive
      if (inactiveTime >= INACTIVITY_TIMEOUT) {
        console.log('Releasing lock due to inactivity');
        await get().releaseLock();
        return;
      }
    };

    // Setup periodic check
    const interval = setInterval(checkInactivity, CHECK_INTERVAL);

    // Setup activity tracking
    const activityEvents = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    const handleActivity = () => get().updateActivity();

    activityEvents.forEach(event => {
      window.addEventListener(event, handleActivity);
    });

    // Setup cleanup when tab/window is closed
    const cleanup = () => {
      clearInterval(interval);
      const currentLock = get().currentLock;
      const token = Cookies.get('token');

      // Remove activity listeners
      activityEvents.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });

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

    // Store cleanup function
    const removeListeners = () => {
      clearInterval(interval);
      window.removeEventListener('beforeunload', cleanup);
      document.removeEventListener('visibilitychange', cleanup);
      // Remove activity listeners
      activityEvents.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
    };

    set({ cleanup: removeListeners });
  },

  acquireLock: async (appointmentId: string) => {
    try {
      await api.post(`/appointments/${appointmentId}/acquire-lock`);

      // Persist lock in localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('currentLock', appointmentId);
      }

      set({
        currentLock: appointmentId,
        lastActivity: Date.now()
      });

      // Setup auto-extend
      get().setupAutoExtend();
    } catch (error) {
      console.error('Failed to acquire lock:', error);
      throw error;
    }
  },

  releaseLock: async () => {
    const currentLock = get().currentLock;
    const cleanup = get().cleanup;

    if (currentLock) {
      try {
        await api.delete(`/appointments/${currentLock}/release-lock`);
        if (typeof cleanup === 'function') {
          cleanup();
        }

        // Clear persisted lock
        if (typeof window !== 'undefined') {
          localStorage.removeItem('currentLock');
        }

        set({ currentLock: null, cleanup: null, lastActivity: null });
      } catch (error) {
        console.error('Failed to release lock:', error);
        throw error;
      }
    } else {
      console.log('No current lock to release');
    }
  },
}));