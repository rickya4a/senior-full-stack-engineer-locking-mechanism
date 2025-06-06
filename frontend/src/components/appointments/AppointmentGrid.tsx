import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import { Appointment, WebSocketMessage } from '@/types';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/auth';
import { useLockStore } from '@/store/lock';
import { toast } from 'sonner';
import LockInfo from './LockInfo';
import { wsService } from '@/lib/websocket';

export default function AppointmentGrid() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const { user } = useAuthStore();
  const { acquireLock, releaseLock, currentLock, initializeLock } = useLockStore();

  // Initialize lock state
  useEffect(() => {
    initializeLock();
  }, []);

  // Handle appointments and cleanup
  useEffect(() => {
    fetchAppointments();

    console.log('Current lock in effect:', currentLock);

    return () => {
      if (currentLock) {
        console.log('Cleaning up lock:', currentLock);
        releaseLock().catch(console.error);
      }
    };
  }, [currentLock]);

  // Subscribe to WebSocket updates
  useEffect(() => {
    const handleMessage = (message: WebSocketMessage) => {
      console.log('WebSocket message received:', message);

      setAppointments(prevAppointments =>
        prevAppointments.map(appointment => {
          if (appointment.id === message.appointmentId) {
            return {
              ...appointment,
              lock: message.data
            };
          }
          return appointment;
        })
      );

      // Show toast notification for other users' actions
      const appointment = appointments.find(a => a.id === message.appointmentId);
      if (!appointment) return;

      if (message.type === 'LOCK_ACQUIRED' && message.data && message.data.userId !== user?.id) {
        toast.info(`${message.data.user.name} has started editing "${appointment.title}"`);
      } else if (message.type === 'LOCK_RELEASED' && message.data === null && appointment.lock && appointment.lock.userId !== user?.id) {
        toast.info(`${appointment.lock.user.name} has finished editing "${appointment.title}"`);
      }
    };

    const unsubscribe = wsService.subscribe(handleMessage);
    return () => {
      unsubscribe();
    };
  }, [user?.id, appointments]);

  const fetchAppointments = async () => {
    try {
      const response = await api.get('/appointments');
      setAppointments(response.data);
    } catch (error) {
      console.error(error);
      toast.error('Failed to fetch appointments');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestControl = async (appointmentId: string) => {
    try {
      setActionLoading(appointmentId);
      console.log('Requesting control for:', appointmentId);
      // Release current lock if exists
      if (currentLock) {
        console.log('Releasing current lock before acquiring new one');
        await releaseLock();
      }

      await acquireLock(appointmentId);
      console.log('Control acquired for:', appointmentId);
      await fetchAppointments(); // Refresh the list
      toast.success('Successfully acquired control');
    } catch (error) {
      console.error(error);
      toast.error('Failed to acquire control');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReleaseLock = async () => {
    try {
      const appointmentId = currentLock;
      if (appointmentId) {
        setActionLoading(appointmentId);
      }
      console.log('Handling release lock, current lock:', currentLock);
      await releaseLock();
      console.log('Lock released, refreshing appointments');
      await fetchAppointments(); // Refresh the list
      toast.success('Successfully released control');
    } catch (error) {
      console.error(error);
      toast.error('Failed to release control');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {appointments.map((appointment) => (
          <div
            key={appointment.id}
            className="bg-white p-4 rounded-lg shadow space-y-4"
          >
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">
                {appointment.title}
              </h3>
              <p className="text-gray-600 mb-4">{appointment.description}</p>
              <p className="text-gray-600">
                {dayjs(appointment.startTime).format('MMM D, YYYY h:mm A')} - {dayjs(appointment.endTime).format('MMM D, YYYY h:mm A')}
              </p>
            </div>

            <div className="flex flex-col space-y-3">
              {appointment.lock && (
                <LockInfo editor={appointment.lock.user} expiresAt={appointment.lock.expiresAt} />
              )}

              <div className="flex justify-between items-center">
                {appointment.lock ? (
                  appointment.lock.userId === user?.id ? (
                    <button
                      onClick={handleReleaseLock}
                      disabled={actionLoading === appointment.id}
                      className={`text-sm bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2`}
                    >
                      {actionLoading === appointment.id ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Releasing...</span>
                        </>
                      ) : (
                        'Release Lock'
                      )}
                    </button>
                  ) : user?.role === 'ADMIN' ? (
                    <button
                      onClick={() => handleRequestControl(appointment.id)}
                      disabled={actionLoading === appointment.id}
                      className={`text-sm bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2`}
                    >
                      {actionLoading === appointment.id ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Taking Control...</span>
                        </>
                      ) : (
                        'Take Control'
                      )}
                    </button>
                  ) : (
                    <span className="text-red-600 text-sm">
                      Locked by {appointment.lock.user.name}
                    </span>
                  )
                ) : (
                  <button
                    onClick={() => handleRequestControl(appointment.id)}
                    disabled={actionLoading === appointment.id}
                    className={`text-sm bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2`}
                  >
                    {actionLoading === appointment.id ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Acquiring...</span>
                      </>
                    ) : (
                      'Edit'
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}