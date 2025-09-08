import React, { useEffect } from 'react';

interface Notification {
  message: string;
  type: 'error' | 'success' | 'info';
}

interface ErrorToastProps {
  notification: Notification;
  onClose: () => void;
}

const ICONS: Record<Notification['type'], string> = {
  error: 'fas fa-exclamation-circle',
  success: 'fas fa-check-circle',
  info: 'fas fa-info-circle',
};

const TITLES: Record<Notification['type'], string> = {
  error: 'Error',
  success: 'Éxito',
  info: 'Información',
};

const ErrorToast: React.FC<ErrorToastProps> = ({ notification, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000); // Auto-dismiss after 5 seconds

    return () => {
      clearTimeout(timer);
    };
  }, [onClose]);
  
  const baseClasses = "fixed top-5 right-5 z-[9999] w-[350px] max-w-[90vw] p-4 rounded-lg border flex items-start shadow-2xl shadow-black/50";
  const typeClasses: Record<Notification['type'], string> = {
    error: "bg-red-900/80 backdrop-blur-md border-red-500/50 text-red-200",
    success: "bg-green-900/80 backdrop-blur-md border-green-500/50 text-green-200",
    info: "bg-blue-900/80 backdrop-blur-md border-blue-500/50 text-blue-200",
  }
  const animationClass = "animate-[slide-in-right_0.4s_cubic-bezier(0.25,0.46,0.45,0.94)_both]";

  return (
    <div className={`${baseClasses} ${typeClasses[notification.type]} ${animationClass}`} role="alert">
      <div className="flex-shrink-0 w-6 text-center mr-3 text-xl mt-1">
        <i className={ICONS[notification.type]}></i>
      </div>
      <div className="flex-grow">
        <h3 className="font-bold font-orbitron">{TITLES[notification.type]}</h3>
        <p className="text-sm mt-1">{notification.message}</p>
      </div>
      <button
        onClick={onClose}
        className="ml-4 flex-shrink-0 bg-transparent border-none text-current opacity-70 hover:opacity-100 text-2xl"
        aria-label="Cerrar notificación"
      >
        &times;
      </button>
    </div>
  );
};

export default ErrorToast;
