import React from 'react';

interface SessionTimeoutModalProps {
  isOpen: boolean;
  onConfirm: () => void;
}

const SessionTimeoutModal: React.FC<SessionTimeoutModalProps> = ({ isOpen, onConfirm }) => {
  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
  };

  // Prevent closing by clicking outside or ESC key - force user acknowledgment
  const handleBackdropClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-75 transition-opacity"
        onClick={handleBackdropClick}
      />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-md transform overflow-hidden rounded-lg bg-gray-800 border border-gray-600 shadow-xl transition-all">
          {/* Header */}
          <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-4">
            <div className="flex items-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-white">
                  🔒 Session Expired
                </h3>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-6">
            <div className="text-center">
              <p className="text-gray-300 text-base mb-2">
                Your session has timed out for security reasons.
              </p>
              <p className="text-gray-400 text-sm">
                Please log in again to continue using the application.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-700 px-6 py-4">
            <div className="flex justify-center">
              <button
                type="button"
                className="inline-flex w-full justify-center rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 transition-colors"
                onClick={handleConfirm}
              >
                OK - Return to Login
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionTimeoutModal;