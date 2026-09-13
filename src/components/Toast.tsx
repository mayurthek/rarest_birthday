import React from 'react';
import { CheckCircle2 } from 'lucide-react';

interface ToastProps {
  message: string | null;
}

export const Toast: React.FC<ToastProps> = ({ message }) => {
  if (!message) return null;

  return (
    <div className="toast-notification" role="status" aria-live="polite">
      <CheckCircle2 size={16} color="#4ADE80" />
      <span>{message}</span>
    </div>
  );
};
