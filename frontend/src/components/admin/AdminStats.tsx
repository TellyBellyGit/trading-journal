import React, { useState, useEffect } from 'react';
import { adminAPI, AdminStats as AdminStatsType } from '../../api/admin';

const AdminStats: React.FC = () => {
  const [stats, setStats] = useState<AdminStatsType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminAPI.getStats();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load stats');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-gray-800 border border-gray-700 rounded-lg p-6 animate-pulse">
            <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
            <div className="h-8 bg-gray-700 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900 border border-red-700 rounded-lg p-4">
        <p className="text-red-300">Error loading stats: {error}</p>
        <button
          onClick={loadStats}
          className="mt-2 px-4 py-2 bg-red-800 hover:bg-red-700 text-white rounded-lg transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-6">
      {/* Overview Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <div>
            <p className="text-gray-400 text-sm">Total Users</p>
            <p className="text-2xl font-bold text-white">{stats.overview.totalUsers}</p>
          </div>
          <div className="mt-2">
            <span className="text-green-400 text-sm">
              {stats.overview.activeUsers} active ({Math.round((stats.overview.activeUsers / stats.overview.totalUsers) * 100)}%)
            </span>
          </div>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <div>
            <p className="text-gray-400 text-sm">Total Trades</p>
            <p className="text-2xl font-bold text-white">{stats.overview.totalTrades.toLocaleString()}</p>
          </div>
          <div className="mt-2">
            <span className="text-gray-400 text-sm">
              {Math.round(stats.overview.totalTrades / stats.overview.activeUsers)} avg per user
            </span>
          </div>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <div>
            <p className="text-gray-400 text-sm">Trading Notes</p>
            <p className="text-2xl font-bold text-white">{stats.overview.totalNotes.toLocaleString()}</p>
          </div>
          <div className="mt-2">
            <span className="text-gray-400 text-sm">
              Knowledge base growing
            </span>
          </div>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <div>
            <p className="text-gray-400 text-sm">Admin Users</p>
            <p className="text-2xl font-bold text-white">{stats.overview.adminUsers}</p>
          </div>
          <div className="mt-2">
            <span className="text-gray-400 text-sm">
              System administrators
            </span>
          </div>
        </div>
      </div>

      {/* Subscription Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Subscription Plans</h3>
          <div className="space-y-3">
            {Object.entries(stats.subscriptions).map(([plan, count]) => (
              <div key={plan} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${
                    plan === 'free' ? 'bg-gray-500' :
                    plan === 'pro' ? 'bg-blue-500' :
                    plan === 'premium' ? 'bg-purple-500' : 'bg-green-500'
                  }`}></div>
                  <span className="text-gray-300 capitalize">{plan}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-white font-medium">{count}</span>
                  <span className="text-gray-400 text-sm">
                    ({Math.round((count / stats.overview.totalUsers) * 100)}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Registrations */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Recent Registrations</h3>
          <div className="space-y-3">
            {stats.recentRegistrations.length > 0 ? (
              stats.recentRegistrations.map((user) => (
                <div key={user.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-semibold">
                        {user.firstName[0]?.toUpperCase() || user.email[0]?.toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-gray-400 text-xs">{user.email}</p>
                    </div>
                  </div>
                  <span className="text-gray-400 text-xs">
                    {formatDate(user.createdAt)}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-gray-400 text-sm">No recent registrations</p>
            )}
          </div>
        </div>
      </div>

      {/* Refresh Button */}
      <div className="flex justify-end">
        <button
          onClick={loadStats}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg transition-colors"
        >
          {loading ? 'Refreshing...' : 'Refresh Stats'}
        </button>
      </div>
    </div>
  );
};

export default AdminStats;