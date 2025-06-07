import { useState } from 'react';
import { Lock } from '@/types';
import { useAuthStore } from '@/store/auth';
import { toast } from 'sonner';
import api from '@/lib/axios';
import AuditLogList from './AuditLogList';

interface LockInfoProps {
  lock: Lock;
  onLockReleased: () => void;
}

export default function LockInfo({ lock, onLockReleased }: LockInfoProps) {
  const [isConfirmingForceRelease, setIsConfirmingForceRelease] = useState(false);
  const [showAuditLogs, setShowAuditLogs] = useState(false);
  const [reason, setReason] = useState('');
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';
  const isOwnLock = user?.id === lock.userId;

  const handleForceRelease = async () => {
    if (!reason.trim()) {
      toast.error('Please provide a reason for force release');
      return;
    }

    try {
      await api.delete(`/appointments/${lock.appointmentId}/force-release-lock`, {
        data: { reason: reason.trim() }
      });
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
      setReason('');
    }
  };

  return (
    <div className="space-y-4">
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
                <div className="space-y-2">
                  <input
                    type="text"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Reason for force release"
                    className="w-full text-xs border rounded px-2 py-1"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleForceRelease}
                      className="text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                    >
                      Confirm Force Release
                    </button>
                    <button
                      onClick={() => {
                        setIsConfirmingForceRelease(false);
                        setReason('');
                      }}
                      className="text-xs bg-gray-500 text-white px-2 py-1 rounded hover:bg-gray-600"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <button
                    onClick={() => setIsConfirmingForceRelease(true)}
                    className="text-xs bg-yellow-500 text-white px-2 py-1 rounded hover:bg-yellow-600"
                  >
                    Force Release Lock
                  </button>
                  <button
                    onClick={() => setShowAuditLogs(!showAuditLogs)}
                    className="text-xs block w-full bg-gray-100 text-gray-700 px-2 py-1 rounded hover:bg-gray-200"
                  >
                    {showAuditLogs ? 'Hide Audit Logs' : 'Show Audit Logs'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {isAdmin && showAuditLogs && (
        <div className="mt-4">
          <h3 className="text-sm font-medium text-gray-900 mb-2">Audit Logs</h3>
          <AuditLogList appointmentId={lock.appointmentId} />
        </div>
      )}
    </div>
  );
}