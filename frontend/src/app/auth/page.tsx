'use client';

import AuthForm from '@/components/auth/AuthForm';
import { Toaster } from 'sonner';

export default function AuthPage() {
  return (
    <>
      <Toaster position="top-center" />
      <AuthForm />
    </>
  );
}