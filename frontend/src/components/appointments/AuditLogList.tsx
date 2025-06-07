import { useState, useEffect } from 'react';
import { LockAudit } from '@/types';
import api from '@/lib/axios';
import { toast } from 'sonner';
import dayjs from 'dayjs';

interface AuditLogListProps {
  appointmentId?: string;
}

export default function AuditLogList({ appointmentId }: AuditLogListProps) {
  const [logs, setLogs] = useState<LockAudit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, [appointmentId]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const url = appointmentId
        ? `/audit-logs?appointmentId=${appointmentId}`
        : '/audit-logs';
      const response = await api.get(url);
      setLogs(response.data);
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
      toast.error('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-600"></div>
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="text-center py-4 text-gray-500">
        No audit logs found
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {logs.map((log) => (
        <div
          key={log.id}
          className="bg-white p-4 rounded-lg shadow-sm border border-gray-100"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">
                {log.admin.name} ({log.admin.email})
              </p>
              <p className="text-sm text-gray-600">
                forced release from {log.targetUser.name} ({log.targetUser.email})
              </p>
              <p className="text-sm text-gray-600">
                Appointment: {log.appointment.title}
              </p>
              {log.reason && (
                <p className="text-sm text-gray-600 mt-2">
                  Reason: {log.reason}
                </p>
              )}
            </div>
            <span className="text-xs text-gray-500">
              {dayjs(log.createdAt).format('MMM D, YYYY h:mm A')}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}