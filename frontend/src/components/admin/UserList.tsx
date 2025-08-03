import React, { useState, useEffect } from 'react';
import { adminAPI, AdminUser } from '../../api/admin';
import DeleteUserModal from './DeleteUserModal';
import SubscriptionModal from './SubscriptionModal';

interface UserListProps {
  onUserSelect?: (user: AdminUser) => void;
}

const UserList: React.FC<UserListProps> = ({ onUserSelect }) => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [updating, setUpdating] = useState<number | null>(null);
  
  // Modal states
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    user: AdminUser | null;
    tradeCount: number;
    noteCount: number;
    brokerCount: number;
  }>({
    isOpen: false,
    user: null,
    tradeCount: 0,
    noteCount: 0,
    brokerCount: 0
  });
  
  const [subscriptionModal, setSubscriptionModal] = useState<{
    isOpen: boolean;
    user: AdminUser | null;
  }>({
    isOpen: false,
    user: null
  });
  
  const [modalLoading, setModalLoading] = useState(false);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await adminAPI.getUsers({
        page: currentPage,
        limit: 10,
        search: search.trim() || undefined,
        status: statusFilter
      });
      
      setUsers(data.users);
      setTotalPages(data.pagination.totalPages);
      setTotalCount(data.pagination.totalCount);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [currentPage, statusFilter]);

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (currentPage === 1) {
        loadUsers();
      } else {
        setCurrentPage(1);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [search]);

  const handleStatusToggle = async (userId: number, currentStatus: boolean) => {
    try {
      setUpdating(userId);
      await adminAPI.updateUser(userId, { isActive: !currentStatus });
      await loadUsers(); // Refresh the list
    } catch (err) {
      alert(`Failed to update user: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setUpdating(null);
    }
  };

  const handleAdminToggle = async (userId: number, currentAdmin: boolean) => {
    try {
      setUpdating(userId);
      await adminAPI.updateUser(userId, { isAdmin: !currentAdmin });
      await loadUsers(); // Refresh the list
    } catch (err) {
      alert(`Failed to update user: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setUpdating(null);
    }
  };

  // 🔥 NEW: Toggle email verification
  const handleEmailVerificationToggle = async (userId: number, currentStatus: boolean) => {
    try {
      setUpdating(userId);
      await adminAPI.toggleEmailVerification(userId, !currentStatus);
      await loadUsers(); // Refresh the list
    } catch (err) {
      alert(`Failed to toggle email verification: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setUpdating(null);
    }
  };

  // 🔥 NEW: Toggle account status (using new API)
  const handleAccountStatusToggle = async (userId: number, currentStatus: boolean) => {
    try {
      setUpdating(userId);
      await adminAPI.toggleAccountStatus(userId, !currentStatus);
      await loadUsers(); // Refresh the list
    } catch (err) {
      alert(`Failed to toggle account status: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setUpdating(null);
    }
  };

  // 🔥 NEW: Reset password
  const handlePasswordReset = async (userId: number, userEmail: string) => {
    if (!confirm(`Generate a password reset link for ${userEmail}?`)) {
      return;
    }

    try {
      setUpdating(userId);
      const result = await adminAPI.resetPassword(userId);
      
      // Show the reset link in a modal or copy to clipboard
      const message = `Password reset link generated for ${result.user.email}:\n\n${result.resetLink}\n\nToken expires: ${new Date(result.expiresAt).toLocaleString()}`;
      
      // Try to copy to clipboard
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(result.resetLink);
        alert(`${message}\n\n✅ Reset link copied to clipboard!`);
      } else {
        alert(message);
      }
    } catch (err) {
      alert(`Failed to reset password: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setUpdating(null);
    }
  };

  // 🔥 NEW: Handle user deletion
  const handleDeleteUser = async (user: AdminUser) => {
    try {
      setModalLoading(true);
      
      // Check if user has data before showing delete confirmation
      const deletionCheck = await adminAPI.checkUserDeletion(user.id);
      
      setDeleteModal({
        isOpen: true,
        user,
        tradeCount: deletionCheck.tradeCount,
        noteCount: deletionCheck.noteCount,
        brokerCount: deletionCheck.brokerCount
      });
    } catch (err) {
      alert(`Failed to check user data: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setModalLoading(false);
    }
  };

  // Handle confirmed user deletion
  const handleConfirmDeleteUser = async (force: boolean) => {
    if (!deleteModal.user) return;
    
    try {
      setModalLoading(true);
      const result = await adminAPI.deleteUser(deleteModal.user.id, force);
      
      // Close modal and refresh users list
      setDeleteModal({ isOpen: false, user: null, tradeCount: 0, noteCount: 0, brokerCount: 0 });
      await loadUsers();
      
      alert(`✅ User deleted successfully!\n\nDeleted:\n• User account\n• ${result.deletedData.trades} trades\n• ${result.deletedData.notes} notes\n• ${result.deletedData.brokers} brokers\n• ${result.deletedData.loginHistory} login records`);
    } catch (err) {
      alert(`Failed to delete user: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setModalLoading(false);
    }
  };

  // 🔥 NEW: Handle subscription management
  const handleManageSubscription = (user: AdminUser) => {
    setSubscriptionModal({
      isOpen: true,
      user
    });
  };

  // Handle subscription update
  const handleUpdateSubscription = async (subscriptionData: {
    plan?: 'free' | 'pro';
    status?: 'active' | 'inactive' | 'cancelled';
    maxTrades?: number;
  }) => {
    if (!subscriptionModal.user) return;
    
    try {
      setModalLoading(true);
      await adminAPI.updateSubscription(subscriptionModal.user.id, subscriptionData);
      
      // Close modal and refresh users list
      setSubscriptionModal({ isOpen: false, user: null });
      await loadUsers();
      
      alert('✅ Subscription updated successfully!');
    } catch (err) {
      alert(`Failed to update subscription: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setModalLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading && users.length === 0) {
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-white mb-4">User Management</h2>
        
        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search users by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
            className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Users</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </div>

        {/* Results Info */}
        <p className="text-sm text-gray-400">
          Showing {users.length} of {totalCount} users
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-900 border border-red-700 rounded-lg text-red-300">
          {error}
        </div>
      )}

      {/* User Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="text-left text-gray-300 font-medium py-3 px-2">User</th>
              <th className="text-left text-gray-300 font-medium py-3 px-2">Status</th>
              <th className="text-left text-gray-300 font-medium py-3 px-2">Email</th>
              <th className="text-left text-gray-300 font-medium py-3 px-2">Subscription</th>
              <th className="text-left text-gray-300 font-medium py-3 px-2">Last Login</th>
              <th className="text-left text-gray-300 font-medium py-3 px-2">Activity</th>
              <th className="text-left text-gray-300 font-medium py-3 px-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b border-gray-700 hover:bg-gray-750">
                <td className="py-3 px-2">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-semibold">
                        {user.firstName[0]?.toUpperCase() || user.email[0]?.toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <p className="text-white font-medium">
                          {user.firstName} {user.lastName}
                        </p>
                        {user.isAdmin && (
                          <button
                            onClick={() => handleAdminToggle(user.id, user.isAdmin)}
                            disabled={updating === user.id}
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium transition-colors bg-purple-900 text-purple-300 hover:bg-purple-800 ${
                              updating === user.id ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                            }`}
                          >
                            Admin
                          </button>
                        )}
                      </div>
                      <p className="text-gray-400 text-sm">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-2">
                  <button
                    onClick={() => handleAccountStatusToggle(user.id, user.isActive)}
                    disabled={updating === user.id}
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors ${
                      user.isActive
                        ? 'bg-green-900 text-green-300 hover:bg-green-800'
                        : 'bg-red-900 text-red-300 hover:bg-red-800'
                    } ${updating === user.id ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    {updating === user.id ? '...' : user.isActive ? 'Active' : 'Suspended'}
                  </button>
                </td>
                <td className="py-3 px-2">
                  <button
                    onClick={() => handleEmailVerificationToggle(user.id, user.emailVerified)}
                    disabled={updating === user.id}
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors ${
                      user.emailVerified
                        ? 'bg-blue-900 text-blue-300 hover:bg-blue-800'
                        : 'bg-orange-900 text-orange-300 hover:bg-orange-800'
                    } ${updating === user.id ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    {updating === user.id ? '...' : user.emailVerified ? 'Verified' : 'Pending'}
                  </button>
                </td>
                <td className="py-3 px-2">
                  {user.subscription ? (
                    <div className="text-sm">
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                          user.subscription.plan === 'free' 
                            ? 'bg-gray-700 text-gray-300' 
                            : user.subscription.plan === 'pro'
                            ? 'bg-blue-900 text-blue-300'
                            : 'bg-purple-900 text-purple-300'
                        }`}>
                          {user.subscription.plan}
                        </span>
                        {user.subscription.plan === 'free' && (
                          <span className={`text-xs ${
                            user.subscription.tradeCount >= user.subscription.maxTrades * 0.8
                              ? 'text-red-400 font-medium'
                              : user.subscription.tradeCount >= user.subscription.maxTrades * 0.7
                              ? 'text-yellow-400'
                              : 'text-gray-400'
                          }`}>
                            {user.subscription.tradeCount}/{user.subscription.maxTrades}
                          </span>
                        )}
                      </div>
                      {user.subscription.plan === 'free' && user.subscription.tradeCount > user.subscription.maxTrades && (
                        <div className="text-xs text-red-400 mt-1">
                          Grace: {user.subscription.tradeCount - user.subscription.maxTrades}/2
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-red-400">No subscription</span>
                  )}
                </td>
                <td className="py-3 px-2">
                  <div className="text-sm text-gray-300">
                    {user.lastLogin ? (
                      <div className="flex flex-col">
                        <span>{formatDate(user.lastLogin)}</span>
                        <span className="text-xs text-gray-500">
                          {new Date(user.lastLogin).toLocaleTimeString()}
                        </span>
                      </div>
                    ) : (
                      <span className="text-gray-500 italic">Never</span>
                    )}
                  </div>
                </td>
                <td className="py-3 px-2">
                  <div className="text-sm text-gray-300">
                    <div>{user._count.trades} trades</div>
                    <div className="text-gray-500">{user._count.notes} notes</div>
                    <div className="text-gray-500">{user._count.loginHistory} logins</div>
                  </div>
                </td>
                <td className="py-3 px-2">
                  <div className="flex flex-col space-y-1">
                    <button
                      onClick={() => onUserSelect?.(user)}
                      className="text-blue-400 hover:text-blue-300 text-sm transition-colors"
                    >
                      View Details
                    </button>
                    <button
                      onClick={() => handleManageSubscription(user)}
                      disabled={updating === user.id}
                      className="text-green-400 hover:text-green-300 text-sm transition-colors disabled:opacity-50"
                    >
                      Subscription
                    </button>
                    <button
                      onClick={() => handlePasswordReset(user.id, user.email)}
                      disabled={updating === user.id}
                      className="text-orange-400 hover:text-orange-300 text-sm transition-colors disabled:opacity-50"
                    >
                      Reset Password
                    </button>
                    <button
                      onClick={() => handleDeleteUser(user)}
                      disabled={updating === user.id || modalLoading}
                      className="text-red-400 hover:text-red-300 text-sm transition-colors disabled:opacity-50"
                    >
                      Delete User
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1 || loading}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
          >
            Previous
          </button>
          
          <span className="text-gray-300 text-sm">
            Page {currentPage} of {totalPages}
          </span>
          
          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages || loading}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
          >
            Next
          </button>
        </div>
      )}

      {/* Delete User Modal */}
      <DeleteUserModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, user: null, tradeCount: 0, noteCount: 0, brokerCount: 0 })}
        onConfirm={handleConfirmDeleteUser}
        user={deleteModal.user}
        tradeCount={deleteModal.tradeCount}
        noteCount={deleteModal.noteCount}
        brokerCount={deleteModal.brokerCount}
        loading={modalLoading}
      />

      {/* Subscription Modal */}
      <SubscriptionModal
        isOpen={subscriptionModal.isOpen}
        onClose={() => setSubscriptionModal({ isOpen: false, user: null })}
        onSave={handleUpdateSubscription}
        user={subscriptionModal.user}
        loading={modalLoading}
      />
    </div>
  );
};

export default UserList;