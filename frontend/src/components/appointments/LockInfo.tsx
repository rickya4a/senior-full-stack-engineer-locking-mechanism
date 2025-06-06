import { useEffect, useState } from 'react';
import { User } from '@/types';

interface LockInfoProps {
  editor: User;
  expiresAt: Date;
}

export default function LockInfo({ editor, expiresAt }: LockInfoProps) {
  const [timeLeft, setTimeLeft] = useState<number>(0);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const expiry = new Date(expiresAt);
      const diff = expiry.getTime() - now.getTime();
      return Math.max(0, Math.floor(diff / 1000)); // in seconds
    };

    // Initial calculation
    setTimeLeft(calculateTimeLeft());

    // Update every second
    const timer = setInterval(() => {
      const remaining = calculateTimeLeft();
      setTimeLeft(remaining);

      // Clear interval when timer reaches 0
      if (remaining === 0) {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [expiresAt]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center space-x-2 text-sm">
      <div className="flex items-center">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2" />
        <span className="font-medium">{editor.name}</span>
      </div>
      <span className="text-gray-400">•</span>
      <div className={`font-mono ${timeLeft < 60 ? 'text-red-500' : 'text-gray-600'}`}>
        {formatTime(timeLeft)}
      </div>
    </div>
  );
}