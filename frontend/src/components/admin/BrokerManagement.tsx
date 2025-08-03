import React, { useState, useEffect } from 'react';
import { brokersApi } from '../../api/trades';

interface GlobalBroker {
  id: number;
  name: string;
  displayName: string;
  isActive: boolean;
  defaultCommission: number | null;
  commissionType: string | null;
  createdAt: string;
  updatedAt: string;
  _count: {
    trades: number;
    userBrokerAccounts: number;
  };
}

interface BrokerFormData {
  name: string;
  displayName: string;
  defaultCommission: string;
  commissionType: string;
  isActive: boolean;
}

const BrokerManagement: React.FC = () => {
  const [brokers, setBrokers] = useState<GlobalBroker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingBroker, setEditingBroker] = useState<GlobalBroker | null>(null);
  const [formData, setFormData] = useState<BrokerFormData>({
    name: '',
    displayName: '',
    defaultCommission: '',
    commissionType: '',
    isActive: true
  });
  const [saving, setSaving] = useState(false);

  const loadBrokers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await brokersApi.getAllGlobal();
      setBrokers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load brokers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBrokers();
  }, []);

  const handleCreateBroker = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;

    try {
      setSaving(true);
      setError(null);

      const payload = {
        name: formData.name.trim(),
        displayName: formData.displayName.trim() || formData.name.trim(),
        defaultCommission: formData.defaultCommission ? parseFloat(formData.defaultCommission) : null,
        commissionType: formData.commissionType || null,
        isActive: formData.isActive
      };

      await brokersApi.createGlobal(payload);

      // Reset form and reload brokers
      setFormData({
        name: '',
        displayName: '',
        defaultCommission: '',
        commissionType: '',
        isActive: true
      });
      setShowCreateForm(false);
      await loadBrokers();
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create broker');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateBroker = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving || !editingBroker) return;

    try {
      setSaving(true);
      setError(null);

      const payload = {
        name: formData.name.trim(),
        displayName: formData.displayName.trim() || formData.name.trim(),
        defaultCommission: formData.defaultCommission ? parseFloat(formData.defaultCommission) : null,
        commissionType: formData.commissionType || null,
        isActive: formData.isActive
      };

      await brokersApi.updateGlobal(editingBroker.id, payload);

      // Reset form and reload brokers
      setEditingBroker(null);
      setFormData({
        name: '',
        displayName: '',
        defaultCommission: '',
        commissionType: '',
        isActive: true
      });
      await loadBrokers();
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update broker');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (broker: GlobalBroker) => {
    setEditingBroker(broker);
    setFormData({
      name: broker.name,
      displayName: broker.displayName,
      defaultCommission: broker.defaultCommission?.toString() || '',
      commissionType: broker.commissionType || '',
      isActive: broker.isActive
    });
    setShowCreateForm(false);
  };

  const handleCancel = () => {
    setEditingBroker(null);
    setShowCreateForm(false);
    setFormData({
      name: '',
      displayName: '',
      defaultCommission: '',
      commissionType: '',
      isActive: true
    });
    setError(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-white">Global Broker Management</h2>
        <button
          onClick={() => setShowCreateForm(true)}
          disabled={showCreateForm || editingBroker}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg transition-colors"
        >
          Add New Broker
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-900 border border-red-700 rounded-lg text-red-300">
          {error}
        </div>
      )}

      {/* Create/Edit Form */}
      {(showCreateForm || editingBroker) && (
        <div className="mb-6 p-4 bg-gray-700 rounded-lg">
          <h3 className="text-lg font-medium text-white mb-4">
            {editingBroker ? 'Edit Broker' : 'Create New Broker'}
          </h3>
          
          <form onSubmit={editingBroker ? handleUpdateBroker : handleCreateBroker} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Broker Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., TD Ameritrade"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Display Name
                </label>
                <input
                  type="text"
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Defaults to broker name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Default Commission
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.defaultCommission}
                  onChange={(e) => setFormData({ ...formData, defaultCommission: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Commission Type
                </label>
                <select
                  value={formData.commissionType}
                  onChange={(e) => setFormData({ ...formData, commissionType: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select type</option>
                  <option value="per_trade">Per Trade</option>
                  <option value="per_share">Per Share</option>
                  <option value="percentage">Percentage</option>
                </select>
              </div>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-4 h-4 text-blue-600 bg-gray-600 border-gray-500 rounded focus:ring-blue-500"
              />
              <label htmlFor="isActive" className="ml-2 text-sm text-gray-300">
                Active (visible to users)
              </label>
            </div>
            
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={handleCancel}
                disabled={saving}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:opacity-50 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || !formData.name.trim()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg transition-colors"
              >
                {saving ? 'Saving...' : editingBroker ? 'Update Broker' : 'Create Broker'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Brokers Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="text-left text-gray-300 font-medium py-3 px-2">Broker</th>
              <th className="text-left text-gray-300 font-medium py-3 px-2">Status</th>
              <th className="text-left text-gray-300 font-medium py-3 px-2">Commission</th>
              <th className="text-left text-gray-300 font-medium py-3 px-2">Usage</th>
              <th className="text-left text-gray-300 font-medium py-3 px-2">Created</th>
              <th className="text-left text-gray-300 font-medium py-3 px-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {brokers.map((broker) => (
              <tr key={broker.id} className="border-b border-gray-700 hover:bg-gray-750">
                <td className="py-3 px-2">
                  <div>
                    <div className="text-white font-medium">{broker.name}</div>
                    {broker.displayName !== broker.name && (
                      <div className="text-gray-400 text-sm">{broker.displayName}</div>
                    )}
                  </div>
                </td>
                <td className="py-3 px-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    broker.isActive
                      ? 'bg-green-900 text-green-300'
                      : 'bg-red-900 text-red-300'
                  }`}>
                    {broker.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="py-3 px-2">
                  <div className="text-sm text-gray-300">
                    {broker.defaultCommission ? (
                      <div>
                        <span>${broker.defaultCommission}</span>
                        {broker.commissionType && (
                          <div className="text-gray-500 text-xs capitalize">
                            {broker.commissionType.replace('_', ' ')}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-500">Not set</span>
                    )}
                  </div>
                </td>
                <td className="py-3 px-2">
                  <div className="text-sm text-gray-300">
                    <div>{broker._count.trades} trades</div>
                    <div className="text-gray-500">{broker._count.userBrokerAccounts} users</div>
                  </div>
                </td>
                <td className="py-3 px-2">
                  <div className="text-sm text-gray-300">
                    {formatDate(broker.createdAt)}
                  </div>
                </td>
                <td className="py-3 px-2">
                  <button
                    onClick={() => handleEdit(broker)}
                    disabled={saving || showCreateForm || editingBroker}
                    className="text-blue-400 hover:text-blue-300 text-sm transition-colors disabled:opacity-50"
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {brokers.length === 0 && !loading && (
        <div className="text-center py-8 text-gray-400">
          No brokers found. Create the first one to get started.
        </div>
      )}
    </div>
  );
};

export default BrokerManagement;