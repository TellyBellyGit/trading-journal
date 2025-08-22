import React from 'react';

interface AnalysisProgressModalProps {
  isOpen: boolean;
  status: 'sending' | 'analyzing' | 'formatting' | 'completed' | 'error';
  tradeCount?: number;
  errorMessage?: string;
  onClose: () => void;
}

const AnalysisProgressModal: React.FC<AnalysisProgressModalProps> = ({
  isOpen,
  status,
  tradeCount,
  errorMessage,
  onClose
}) => {
  if (!isOpen) return null;

  const getStatusContent = () => {
    switch (status) {
      case 'sending':
        return {
          title: '📤 Sending for Analysis',
          message: `${tradeCount} trades sent for AI analysis`,
          showSpinner: true
        };
      case 'analyzing':
        return {
          title: '🧠 Awaiting Analysis',
          message: 'DeepSeek AI is analyzing your trading patterns...',
          showSpinner: true
        };
      case 'formatting':
        return {
          title: '📝 Formatting Note',
          message: 'Preparing analysis results for your notes section...',
          showSpinner: true
        };
      case 'completed':
        return {
          title: '✅ Analysis Complete',
          message: 'Analysis has been saved to your notes section!',
          showSpinner: false
        };
      case 'error':
        return {
          title: '❌ Analysis Failed',
          message: errorMessage || 'Failed to analyze trades. Please try again.',
          showSpinner: false
        };
      default:
        return {
          title: '🔄 Processing',
          message: 'Processing your request...',
          showSpinner: true
        };
    }
  };

  const { title, message, showSpinner } = getStatusContent();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black bg-opacity-50" />
      
      {/* Modal */}
      <div className="relative bg-gray-800 border border-gray-700 rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
        <div className="text-center">
          {/* Title */}
          <h3 className="text-lg font-semibold text-white mb-4">
            {title}
          </h3>
          
          {/* Spinner */}
          {showSpinner && (
            <div className="flex justify-center mb-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          )}
          
          {/* Message */}
          <p className="text-gray-300 mb-6">
            {message}
          </p>
          
          {/* Close button (only show when completed or error) */}
          {(status === 'completed' || status === 'error') && (
            <button
              onClick={onClose}
              className={`px-4 py-2 rounded font-medium transition-colors ${
                status === 'completed'
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-red-600 hover:bg-red-700 text-white'
              }`}
            >
              {status === 'completed' ? 'View Notes' : 'Close'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalysisProgressModal;