import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import { Appointment } from '@/types';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/auth';
import { useLockStore } from '@/store/lock';
import { toast } from 'sonner';

export default function AppointmentGrid() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
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
    }
  };

  const handleReleaseLock = async () => {
    try {
      console.log('Handling release lock, current lock:', currentLock);
      await releaseLock();
      console.log('Lock released, refreshing appointments');
      await fetchAppointments(); // Refresh the list
      toast.success('Successfully released control');
    } catch (error) {
      console.error(error);
      toast.error('Failed to release control');
    }
  };

  if (loading) {
    return <div>Loading...</div>;
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

            <div className="flex justify-between items-center">
              {appointment.lock ? (
                appointment.lock.userId === user?.id ? (
                  <button
                    onClick={handleReleaseLock}
                    className="text-sm bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors"
                  >
                    Release Lock
                  </button>
                ) : user?.role === 'admin' ? (
                  <button
                    onClick={() => handleRequestControl(appointment.id)}
                    className="text-sm bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
                  >
                    Take Control
                  </button>
                ) : (
                  <span className="text-red-600 text-sm">
                    Locked by {appointment.lock.user.name}
                  </span>
                )
              ) : (
                <button
                  onClick={() => handleRequestControl(appointment.id)}
                  className="text-sm bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition-colors"
                >
                  Edit
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}