import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';

interface NotificationToastProps {
  title: string;
  message: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  onClose: () => void;
}

const NotificationToast: React.FC<NotificationToastProps> = ({ title, message, severity, onClose }) => {
  const severityStyles = {
    critical: {
      bg: 'bg-red-500',
      iconBg: 'bg-red-700',
      text: 'text-white',
    },
    high: {
      bg: 'bg-orange-500',
      iconBg: 'bg-orange-700',
      text: 'text-white',
    },
    medium: {
      bg: 'bg-yellow-500',
      iconBg: 'bg-yellow-700',
      text: 'text-black',
    },
    low: {
      bg: 'bg-blue-500',
      iconBg: 'bg-blue-700',
      text: 'text-white',
    },
  };

  const styles = severityStyles[severity];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.3 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
        className={`fixed bottom-0 sm:bottom-5 left-0 sm:left-auto right-0 sm:right-5 mx-auto sm:mx-0 w-full sm:max-w-sm rounded-none sm:rounded-xl shadow-2xl ${styles.bg} ${styles.text} overflow-hidden z-50`}
      >
        <div className="flex items-start p-3 sm:p-4">
          <div className={`flex-shrink-0 p-1.5 sm:p-2 rounded-full ${styles.iconBg} mr-3 sm:mr-4`}>
            <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-sm sm:text-base truncate">{title}</h3>
            <p className="text-xs sm:text-sm mt-0.5 sm:mt-1 line-clamp-2">{message}</p>
          </div>
          <button 
            onClick={onClose} 
            className="ml-3 sm:ml-4 p-1 rounded-full hover:bg-white/20 transition-colors focus:outline-none focus:ring-2 focus:ring-white/50"
            aria-label="Close notification"
          >
            <X className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
        </div>
        <div className="h-1 w-full bg-white/20">
          <motion.div
            initial={{ width: "100%" }}
            animate={{ width: "0%" }}
            transition={{ duration: 5 }}
            className={`h-full ${styles.iconBg}`}
            onAnimationComplete={onClose}
          />
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default NotificationToast;
