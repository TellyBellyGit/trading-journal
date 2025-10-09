import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import AdminStats from '../components/admin/AdminStats';
import UserList from '../components/admin/UserList';
import UserDetail from '../components/admin/UserDetail';
import BrokerManagement from '../components/admin/BrokerManagement';
import AdminHealth from '../components/admin/AdminHealth';
import { AdminUser } from '../api/admin';

const Admin: React.FC = () => {
  const { user } = useAuth();
  const [currentView, setCurrentView] = useState<'overview' | 'users' | 'brokers' | 'health' | 'user-detail'>('overview');
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);

  // Redirect non-admin users
  if (!user?.isAdmin) {
    return (
      <div className="p-6">
        <div className="bg-red-900 border border-red-700 rounded-lg p-4">
          <h2 className="text-red-400 font-semibold mb-2">Access Denied</h2>
          <p className="text-red-300">You don't have permission to access this area.</p>
        </div>
      </div>
    );
  }

  const handleUserSelect = (user: AdminUser) => {
    setSelectedUser(user);
    setCurrentView('user-detail');
  };

  const handleBackToUsers = () => {
    setCurrentView('users');
    setSelectedUser(null);
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-2">Admin Dashboard</h1>
        <p className="text-gray-400">System administration and user management</p>
      </div>

      {/* Navigation Tabs */}
      <div className="mb-6">
        <div className="flex space-x-1 bg-gray-800 p-1 rounded-lg w-fit">
          <button
            onClick={() => setCurrentView('overview')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              currentView === 'overview'
                ? 'bg-blue-600 text-white'
                : 'text-gray-300 hover:text-white hover:bg-gray-700'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setCurrentView('users')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              currentView === 'users'
                ? 'bg-blue-600 text-white'
                : 'text-gray-300 hover:text-white hover:bg-gray-700'
            }`}
          >
            Users
          </button>
          <button
            onClick={() => setCurrentView('brokers')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              currentView === 'brokers'
                ? 'bg-blue-600 text-white'
                : 'text-gray-300 hover:text-white hover:bg-gray-700'
            }`}
          >
            Brokers
          </button>
          <button
            onClick={() => setCurrentView('health')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              currentView === 'health'
                ? 'bg-blue-600 text-white'
                : 'text-gray-300 hover:text-white hover:bg-gray-700'
            }`}
          >
            Health
          </button>
        </div>
      </div>

      {/* Content */}
      {currentView === 'overview' && <AdminStats />}
      
      {currentView === 'users' && <UserList onUserSelect={handleUserSelect} />}
      
      {currentView === 'brokers' && <BrokerManagement />}

      {currentView === 'health' && <AdminHealth />}
      
      {currentView === 'user-detail' && selectedUser && (
        <UserDetail 
          userId={selectedUser.id} 
          onBack={handleBackToUsers}
        />
      )}
    </div>
  );
};

export default Admin;