import React, { useState, useEffect } from 'react';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (subscriptionData: {
    plan?: 'free' | 'pro';
    status?: 'active' | 'inactive' | 'cancelled';
    maxTrades?: number;
  }) => void;
  user: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    subscription?: {
      plan: string;
      status: string;
      maxTrades: number;
      tradeCount: number;
    };
  } | null;
  loading?: boolean;
}

const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  user,
  loading = false
}) => {
  const [plan, setPlan] = useState<'free' | 'pro'>('free');
  const [status, setStatus] = useState<'active' | 'inactive' | 'cancelled'>('active');
  const [maxTrades, setMaxTrades] = useState<number>(50);

  useEffect(() => {
    if (user?.subscription) {
      setPlan(user.subscription.plan as 'free' | 'pro');
      setStatus(user.subscription.status as 'active' | 'inactive' | 'cancelled');
      setMaxTrades(user.subscription.maxTrades);
    }
  }, [user]);

  if (!isOpen || !user) return null;

  const handleSave = () => {
    onSave({
      plan,
      status,
      maxTrades: plan === 'free' ? (maxTrades || 50) : -1
    });
  };

  const handleClose = () => {
    // Reset to original values
    if (user?.subscription) {
      setPlan(user.subscription.plan as 'free' | 'pro');
      setStatus(user.subscription.status as 'active' | 'inactive' | 'cancelled');
      setMaxTrades(user.subscription.maxTrades);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center mb-4">
          <div className="text-3xl mr-3">💳</div>
          <h2 className="text-xl font-bold text-white">Manage Subscription</h2>
        </div>

        <div className="mb-4">
          <p className="text-gray-300 mb-2">
            Managing subscription for:
          </p>
          <p className="text-white font-semibold">
            {user.firstName} {user.lastName} ({user.email})
          </p>
        </div>

        {user.subscription && (
          <div className="bg-gray-700 rounded-lg p-3 mb-4">
            <p className="text-sm text-gray-300">Current Usage:</p>
            <p className="text-white">
              {user.subscription.tradeCount} / {user.subscription.maxTrades === -1 ? '∞' : user.subscription.maxTrades} trades this period
            </p>
          </div>
        )}

        <div className="space-y-4">
          {/* Plan Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Subscription Plan
            </label>
            <select
              value={plan}
              onChange={(e) => setPlan(e.target.value as 'free' | 'pro')}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="free">Free Plan</option>
              <option value="pro">Pro Plan</option>
            </select>
          </div>

          {/* Status Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as 'active' | 'inactive' | 'cancelled')}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Max Trades (only for free plan) */}
          {plan === 'free' && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Max Trades per Month
              </label>
              <input
                type="number"
                value={maxTrades}
                onChange={(e) => setMaxTrades(parseInt(e.target.value) || 50)}
                min="0"
                max="1000"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-400 mt-1">
                Set to 0 to block all trading. Pro plan has unlimited trades.
              </p>
            </div>
          )}

          {plan === 'pro' && (
            <div className="bg-blue-900 bg-opacity-30 border border-blue-600 rounded-lg p-3">
              <p className="text-blue-200 text-sm">
                <strong>Pro Plan:</strong> Unlimited trades and access to advanced features.
              </p>
            </div>
          )}
        </div>

        <div className="flex space-x-3 mt-6">
          <button
            onClick={handleClose}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Saving...
              </div>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionModal;