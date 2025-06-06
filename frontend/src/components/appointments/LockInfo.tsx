import { useState } from 'react';
import { Lock } from '@/types';
import { useAuthStore } from '@/store/auth';
import { toast } from 'sonner';
import api from '@/lib/axios';

interface LockInfoProps {
  lock: Lock;
  onLockReleased: () => void;
}

export default function LockInfo({ lock, onLockReleased }: LockInfoProps) {
  const [isConfirmingForceRelease, setIsConfirmingForceRelease] = useState(false);
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';
  const isOwnLock = user?.id === lock.userId;

  const handleForceRelease = async () => {
    try {
      await api.delete(`/appointments/${lock.appointmentId}/force-release-lock`);
      toast.success('Lock forcefully released');
      onLockReleased();
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message || 'Failed to force release lock');
      } else {
        toast.error('Failed to force release lock');
      }
    } finally {
      setIsConfirmingForceRelease(false);
    }
  };

  return (
    <div className="bg-yellow-50 p-4 rounded-md">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-yellow-700">
            Currently being edited by <span className="font-semibold">{lock.user.name}</span>
          </p>
          <p className="text-xs text-yellow-600 mt-1">
            Lock expires at {new Date(lock.expiresAt).toLocaleTimeString()}
          </p>
        </div>
        {isAdmin && !isOwnLock && (
          <div>
            {isConfirmingForceRelease ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleForceRelease}
                  className="text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                >
                  Confirm Force Release
                </button>
                <button
                  onClick={() => setIsConfirmingForceRelease(false)}
                  className="text-xs bg-gray-500 text-white px-2 py-1 rounded hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsConfirmingForceRelease(true)}
                className="text-xs bg-yellow-500 text-white px-2 py-1 rounded hover:bg-yellow-600"
              >
                Force Release Lock
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}