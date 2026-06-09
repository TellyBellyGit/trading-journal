import React, { useEffect, useState } from 'react';

interface DatabaseWakeModalProps {
  isOpen: boolean;
}

const DatabaseWakeModal: React.FC<DatabaseWakeModalProps> = ({ isOpen }) => {
  const [dots, setDots] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setDots('');
      return;
    }
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);
    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative bg-gray-800 rounded-xl shadow-2xl p-8 max-w-md w-full mx-4 border border-gray-700 animate-in fade-in zoom-in">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-full bg-blue-600/20 flex items-center justify-center">
            <svg className="w-8 h-8 text-blue-400 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125v-3.75" />
            </svg>
          </div>
        </div>

        {/* Title */}
        <h3 className="text-xl font-semibold text-white text-center mb-2">
          Establishing Secure Connection
        </h3>

        {/* Subtitle */}
        <p className="text-sm text-gray-400 text-center mb-6">
          The database is waking up from sleep mode.
          This usually takes just a few seconds{dots}
        </p>

        {/* Progress Bar */}
        <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-blue-500 via-blue-400 to-blue-500 rounded-full animate-progress-indeterminate" />
        </div>

        <p className="text-xs text-gray-500 text-center mt-4">
          Please wait while we establish a secure connection to the server
        </p>
      </div>
    </div>
  );
};

export default DatabaseWakeModal;