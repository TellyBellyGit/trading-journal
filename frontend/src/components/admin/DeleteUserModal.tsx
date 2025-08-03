import React, { useState } from 'react';

interface DeleteUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (force: boolean) => void;
  user: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
  } | null;
  tradeCount?: number;
  noteCount?: number;
  brokerCount?: number;
  loading?: boolean;
}

const DeleteUserModal: React.FC<DeleteUserModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  user,
  tradeCount = 0,
  noteCount = 0,
  brokerCount = 0,
  loading = false
}) => {
  const [confirmed, setConfirmed] = useState(false);

  if (!isOpen || !user) return null;

  const hasData = tradeCount > 0 || noteCount > 0 || brokerCount > 0;

  const handleConfirm = () => {
    onConfirm(true); // Force deletion
    setConfirmed(false);
  };

  const handleClose = () => {
    setConfirmed(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center mb-4">
          <div className="text-3xl mr-3">⚠️</div>
          <h2 className="text-xl font-bold text-white">Delete User Account</h2>
        </div>

        <div className="mb-4">
          <p className="text-gray-300 mb-2">
            You are about to delete the account for:
          </p>
          <p className="text-white font-semibold">
            {user.firstName} {user.lastName} ({user.email})
          </p>
        </div>

        {hasData && (
          <div className="bg-red-900 bg-opacity-30 border border-red-600 rounded-lg p-4 mb-4">
            <p className="text-red-300 font-semibold mb-2">
              ⚠️ This user has associated data that will also be deleted:
            </p>
            <ul className="text-red-200 space-y-1">
              {tradeCount > 0 && <li>• {tradeCount} trade{tradeCount !== 1 ? 's' : ''}</li>}
              {noteCount > 0 && <li>• {noteCount} note{noteCount !== 1 ? 's' : ''}</li>}
              {brokerCount > 0 && <li>• {brokerCount} broker account{brokerCount !== 1 ? 's' : ''}</li>}
              <li>• All login history</li>
              <li>• Subscription data</li>
            </ul>
          </div>
        )}

        <div className="bg-yellow-900 bg-opacity-30 border border-yellow-600 rounded-lg p-4 mb-4">
          <p className="text-yellow-200 text-sm">
            <strong>Warning:</strong> This action cannot be undone. All user data will be permanently deleted from the database.
          </p>
        </div>

        {!confirmed ? (
          <div className="space-y-3">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                className="w-4 h-4 text-red-600 bg-gray-700 border-gray-600 rounded focus:ring-red-500"
              />
              <span className="text-sm text-gray-300">
                I understand this action cannot be undone
              </span>
            </label>
          </div>
        ) : null}

        <div className="flex space-x-3 mt-6">
          <button
            onClick={handleClose}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!confirmed || loading}
            className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Deleting...
              </div>
            ) : (
              'Delete User'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteUserModal;