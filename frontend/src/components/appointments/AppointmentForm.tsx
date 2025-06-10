import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Appointment } from '@/types';
import { toast } from 'sonner';
import api from '@/lib/axios';
import dayjs from 'dayjs';

const appointmentSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required')
}).refine((data) => {
  const start = new Date(data.startTime);
  const end = new Date(data.endTime);
  return start < end;
}, {
  message: "End time must be after start time",
  path: ["endTime"]
});

type FormData = z.infer<typeof appointmentSchema>;

interface AppointmentFormProps {
  appointment: Appointment;
  isLocked: boolean;
  onSaved?: () => void;
}

export default function AppointmentForm({
  appointment,
  isLocked,
  onSaved,
}: AppointmentFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
    watch
  } = useForm<FormData>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      title: appointment.title,
      description: appointment.description || '',
      startTime: dayjs(appointment.startTime).format('YYYY-MM-DDTHH:mm'),
      endTime: dayjs(appointment.endTime).format('YYYY-MM-DDTHH:mm')
    }
  });

  // Watch form changes for auto-save
  const formValues = watch();

  useEffect(() => {
    reset({
      title: appointment.title,
      description: appointment.description || '',
      startTime: dayjs(appointment.startTime).format('YYYY-MM-DDTHH:mm'),
      endTime: dayjs(appointment.endTime).format('YYYY-MM-DDTHH:mm')
    });
  }, [appointment, reset]);

  // Auto-save when form is dirty and not locked
  useEffect(() => {
    if (!isLocked || !isDirty) return;

    const timeoutId = setTimeout(async () => {
      try {
        await handleSave(formValues);
        toast.success('Changes saved automatically');
      } catch (error) {
        if (error instanceof Error) {
          toast.error(error.message);
        } else {
          toast.error('Auto-save failed');
        }
      }
    }, 2000); // Auto-save after 2 seconds of no changes

    return () => clearTimeout(timeoutId);
  }, [formValues, isLocked, isDirty]);

  const handleSave = async (data: FormData) => {
    try {
      await api.put(`/appointments/${appointment.id}`, {
        ...data,
        startTime: new Date(data.startTime).toISOString(),
        endTime: new Date(data.endTime).toISOString()
      });

      reset(data);
      onSaved?.();
    } catch (error) {
      if (error instanceof Error) {
        console.error('Failed to save appointment:', error.message);
        throw new Error('Failed to save changes');
      }
      throw new Error('Failed to save changes');
    }
  };

  const onSubmit = async (data: FormData) => {
    try {
      await handleSave(data);
      toast.success('Changes saved successfully');
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('Failed to save changes');
      }
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700">
          Title
        </label>
        <input
          type="text"
          id="title"
          {...register('title')}
          disabled={!isLocked}
          className={`block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6 ${
            !isLocked ? 'bg-gray-100 cursor-not-allowed' : ''
          }`}
        />
        {errors.title && (
          <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
          Description
        </label>
        <textarea
          id="description"
          rows={3}
          {...register('description')}
          disabled={!isLocked}
          className={`block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6 ${
            !isLocked ? 'bg-gray-100 cursor-not-allowed' : ''
          }`}
        />
        {errors.description && (
          <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="startTime" className="block text-sm font-medium text-gray-700">
            Start Time
          </label>
          <input
            type="datetime-local"
            id="startTime"
            {...register('startTime')}
            disabled={!isLocked}
            className={`block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6 ${
              !isLocked ? 'bg-gray-100 cursor-not-allowed' : ''
            }`}
          />
          {errors.startTime && (
            <p className="mt-1 text-sm text-red-600">{errors.startTime.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="endTime" className="block text-sm font-medium text-gray-700">
            End Time
          </label>
          <input
            type="datetime-local"
            id="endTime"
            {...register('endTime')}
            disabled={!isLocked}
            className={`block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6 ${
              !isLocked ? 'bg-gray-100 cursor-not-allowed' : ''
            }`}
          />
          {errors.endTime && (
            <p className="mt-1 text-sm text-red-600">{errors.endTime.message}</p>
          )}
        </div>
      </div>

      {isLocked && isDirty && (
        <div className="flex justify-end">
          <button
            type="submit"
            className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            Save Changes
          </button>
        </div>
      )}
    </form>
  );
}