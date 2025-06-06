'use client';

import AppointmentGrid from '@/components/appointments/AppointmentGrid';
import { Toaster } from 'sonner';
import { useAuthStore } from '@/store/auth';

export default function HomePage() {
  const { user, logout } = useAuthStore();

  return (
    <>
      <Toaster position="top-center" />
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold">Appointment System</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Welcome, {user?.name}</span>
              <button
                onClick={logout}
                className="text-sm bg-gray-100 text-gray-700 px-4 py-2 rounded hover:bg-gray-200 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>
      <AppointmentGrid />
    </>
  );
}
