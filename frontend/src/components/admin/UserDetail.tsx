import React, { useState, useEffect } from 'react';
import { adminAPI, AdminUserDetail } from '../../api/admin';

interface UserDetailProps {
  userId: number;
  onBack: () => void;
}

const UserDetail: React.FC<UserDetailProps> = ({ userId, onBack }) => {
  const [userDetail, setUserDetail] = useState<AdminUserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  const loadUserDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminAPI.getUserDetail(userId);
      setUserDetail(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load user details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUserDetail();
  }, [userId]);

  const handleStatusToggle = async () => {
    if (!userDetail) return;
    
    try {
      setUpdating(true);
      await adminAPI.updateUser(userId, { isActive: !userDetail.isActive });
      await loadUserDetail(); // Refresh data
    } catch (err) {
      alert(`Failed to update user: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setUpdating(false);
    }
  };

  const handleAdminToggle = async () => {
    if (!userDetail) return;
    
    try {
      setUpdating(true);
      await adminAPI.updateUser(userId, { isAdmin: !userDetail.isAdmin });
      await loadUserDetail(); // Refresh data
    } catch (err) {
      alert(`Failed to update user: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setUpdating(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-blue-400 hover:text-blue-300 transition-colors"
        >
          <span>←</span>
          <span>Back to Users</span>
        </button>
        
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 animate-pulse">
          <div className="h-20 bg-gray-700 rounded mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !userDetail) {
    return (
      <div className="space-y-6">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-blue-400 hover:text-blue-300 transition-colors"
        >
          <span>←</span>
          <span>Back to Users</span>
        </button>
        
        <div className="bg-red-900 border border-red-700 rounded-lg p-4">
          <p className="text-red-300">Error: {error || 'User not found'}</p>
          <button
            onClick={loadUserDetail}
            className="mt-2 px-4 py-2 bg-red-800 hover:bg-red-700 text-white rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="flex items-center space-x-2 text-blue-400 hover:text-blue-300 transition-colors"
      >
        <span>←</span>
        <span>Back to Users</span>
      </button>

      {/* User Profile Card */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white text-2xl font-semibold">
                {userDetail.firstName[0]?.toUpperCase() || userDetail.email[0]?.toUpperCase()}
              </span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">
                {userDetail.firstName} {userDetail.lastName}
              </h1>
              <p className="text-gray-400 text-lg">{userDetail.email}</p>
              <p className="text-gray-500 text-sm">
                Joined {formatDate(userDetail.createdAt)} • Timezone: {userDetail.timezone}
              </p>
              <div className="flex items-center space-x-3 mt-3">
                <button
                  onClick={handleStatusToggle}
                  disabled={updating}
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    userDetail.isActive
                      ? 'bg-green-900 text-green-300 hover:bg-green-800'
                      : 'bg-red-900 text-red-300 hover:bg-red-800'
                  } ${updating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  {userDetail.isActive ? '✓ Active' : '✗ Inactive'}
                </button>
                <button
                  onClick={handleAdminToggle}
                  disabled={updating}
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    userDetail.isAdmin
                      ? 'bg-purple-900 text-purple-300 hover:bg-purple-800'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  } ${updating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  {userDetail.isAdmin ? '👑 Admin' : '👤 User'}
                </button>
              </div>
            </div>
          </div>
          <button
            onClick={loadUserDetail}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            🔄 Refresh
          </button>
        </div>

        {/* Subscription Info */}
        {userDetail.subscription && (
          <div className="mb-6 p-4 bg-gray-700 rounded-lg">
            <h3 className="text-lg font-semibold text-white mb-3">Subscription</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <p className="text-gray-400 text-sm">Plan</p>
                <p className="text-white font-medium capitalize">{userDetail.subscription.plan}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Status</p>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  userDetail.subscription.status === 'active' 
                    ? 'bg-green-900 text-green-300'
                    : 'bg-yellow-900 text-yellow-300'
                }`}>
                  {userDetail.subscription.status}
                </span>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Usage</p>
                <p className="text-white font-medium">
                  {userDetail.subscription.tradeCount}/{userDetail.subscription.maxTrades} trades
                </p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Period End</p>
                <p className="text-white font-medium">
                  {formatDate(userDetail.subscription.currentPeriodEnd)}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <h4 className="text-gray-300 text-sm mb-2">Total Activity</h4>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-400">Trades:</span>
              <span className="text-white font-medium">{userDetail._count.trades}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Notes:</span>
              <span className="text-white font-medium">{userDetail._count.notes}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Brokers:</span>
              <span className="text-white font-medium">{userDetail._count.brokers}</span>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <h4 className="text-gray-300 text-sm mb-2">Trading P&L</h4>
          <p className={`text-2xl font-bold ${
            userDetail.tradingStats.totalPnL >= 0 ? 'text-green-400' : 'text-red-400'
          }`}>
            {formatCurrency(userDetail.tradingStats.totalPnL)}
          </p>
          <p className="text-gray-400 text-sm mt-1">
            {userDetail.tradingStats.totalClosedTrades} closed trades
          </p>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <h4 className="text-gray-300 text-sm mb-2">Win Rate</h4>
          <p className="text-2xl font-bold text-blue-400">
            {userDetail.tradingStats.winRate}%
          </p>
          <p className="text-gray-400 text-sm mt-1">
            {userDetail.tradingStats.winningTrades}W / {userDetail.tradingStats.losingTrades}L
          </p>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <h4 className="text-gray-300 text-sm mb-2">Account Status</h4>
          <p className="text-lg font-semibold text-white">
            {userDetail.isActive ? 'Active' : 'Inactive'}
          </p>
          <p className="text-gray-400 text-sm mt-1">
            {userDetail.isAdmin ? 'Administrator' : 'Regular User'}
          </p>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Trades */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Recent Trades</h3>
          <div className="space-y-3">
            {userDetail.recentActivity.trades.length > 0 ? (
              userDetail.recentActivity.trades.map((trade) => (
                <div key={trade.id} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      trade.direction === 'Long' ? 'bg-green-500' : 'bg-red-500'
                    }`}></div>
                    <div>
                      <p className="text-white font-medium">{trade.symbol}</p>
                      <p className="text-gray-400 text-sm">
                        {trade.broker.name} • {formatDate(trade.entryDate)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-medium ${
                      trade.pnl >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {formatCurrency(trade.pnl)}
                    </p>
                    <p className="text-gray-400 text-sm">{trade.status}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-400 text-center py-4">No trades yet</p>
            )}
          </div>
        </div>

        {/* Recent Notes */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Recent Notes</h3>
          <div className="space-y-3">
            {userDetail.recentActivity.notes.length > 0 ? (
              userDetail.recentActivity.notes.map((note) => (
                <div key={note.id} className="p-3 bg-gray-700 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-white font-medium truncate">{note.title}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        {note.category && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-blue-900 text-blue-300">
                            {note.category}
                          </span>
                        )}
                        <span className="text-gray-400 text-xs">
                          {formatDate(note.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-400 text-center py-4">No notes yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDetail;