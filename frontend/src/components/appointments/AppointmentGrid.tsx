/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import { Appointment, WebSocketMessage } from '@/types';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/auth';
import { useLockStore } from '@/store/lock';
import { toast } from 'sonner';
import LockInfo from './LockInfo';
import AppointmentForm from './AppointmentForm';
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
  }, [currentLock, releaseLock]);

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

      // Clear currentLock if this appointment's lock was released
      if (message.type === 'LOCK_RELEASED' && message.appointmentId === currentLock) {
        console.log('Lock was released for current appointment, clearing state');
        if (typeof window !== 'undefined') {
          localStorage.removeItem('currentLock');
        }
        useLockStore.setState({ currentLock: null });
      }

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
  }, [user?.id, appointments, currentLock]);

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
            className="p-4 bg-white rounded-lg shadow space-y-4"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold">{appointment.title}</h3>
                <p className="text-sm text-gray-500">{appointment.description}</p>
                <div className="mt-2 text-xs text-gray-400">
                  {dayjs(appointment.startTime).format('MMM D, YYYY h:mm A')} -{' '}
                  {dayjs(appointment.endTime).format('h:mm A')}
                </div>
              </div>
            </div>

            {appointment.lock ? (
              <>
                <LockInfo
                  lock={appointment.lock}
                  onLockReleased={fetchAppointments}
                />
                <div className="mt-4">
                  <AppointmentForm
                    appointment={appointment}
                    isLocked={appointment.lock.userId === user?.id}
                    onSaved={fetchAppointments}
                  />
                </div>
              </>
            ) : (
              <button
                onClick={() => handleRequestControl(appointment.id)}
                disabled={!!currentLock || actionLoading === appointment.id}
                className={`w-full py-2 px-4 rounded text-sm font-medium ${
                  currentLock || actionLoading === appointment.id
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
              >
                {actionLoading === appointment.id ? (
                  <span className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Loading...
                  </span>
                ) : (
                  'Request Control'
                )}
              </button>
            )}

            {currentLock === appointment.id && (
              <button
                onClick={handleReleaseLock}
                disabled={actionLoading === appointment.id}
                className={`w-full mt-2 py-2 px-4 rounded text-sm font-medium ${
                  actionLoading === appointment.id
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-red-500 hover:bg-red-600 text-white'
                }`}
              >
                {actionLoading === appointment.id ? (
                  <span className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Loading...
                  </span>
                ) : (
                  'Release Control'
                )}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}