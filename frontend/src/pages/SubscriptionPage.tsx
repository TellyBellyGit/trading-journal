import React, { useState, useEffect } from 'react';
import { subscriptionsApi, SubscriptionPlan, SubscriptionStatus } from '../api/subscriptions';
import PaymentForm from '../components/PaymentForm';

const SubscriptionPage: React.FC = () => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState<{
    type: 'cancel' | 'downgrade';
    targetPlan?: string;
    message: string;
  } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [plansData, statusData] = await Promise.all([
        subscriptionsApi.getPlans(),
        subscriptionsApi.getStatus()
      ]);
      setPlans(plansData);
      setSubscriptionStatus(statusData);
    } catch (err) {
      console.error('Error loading subscription data:', err);
      setError('Failed to load subscription information');
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = (planId: string) => {
    if (planId === 'free' || planId === subscriptionStatus?.plan) {
      return;
    }
    setSelectedPlan(planId);
    setShowPaymentForm(true);
  };

  const handleCancel = () => {
    if (!subscriptionStatus || subscriptionStatus.plan === 'free') return;
    
    const endDate = subscriptionStatus.currentPeriodEnd 
      ? new Date(subscriptionStatus.currentPeriodEnd).toLocaleDateString()
      : 'the end of your billing period';
    
    setShowConfirmModal({
      type: 'cancel',
      message: `Cancel your ${subscriptionStatus.plan} plan? Your subscription will be canceled but you'll keep all current features and access until ${endDate}. After that, your account will revert to the free plan.`
    });
  };

  const handleDowngrade = (targetPlan: string) => {
    if (!subscriptionStatus || subscriptionStatus.plan === 'free') return;
    
    const targetPlanName = plans.find(p => p.id === targetPlan)?.name || targetPlan;
    const endDate = subscriptionStatus.currentPeriodEnd 
      ? new Date(subscriptionStatus.currentPeriodEnd).toLocaleDateString()
      : 'the end of your billing period';
    
    setShowConfirmModal({
      type: 'downgrade',
      targetPlan,
      message: `Downgrade to ${targetPlanName}? You'll keep your current ${subscriptionStatus.plan} features until ${endDate}, then your account will switch to the ${targetPlanName} plan with its limits and features.`
    });
  };

  const handleReactivate = async () => {
    try {
      setActionLoading('reactivate');
      await subscriptionsApi.reactivate();
      await loadData();
    } catch (error) {
      console.error('Error reactivating subscription:', error);
      setError('Failed to reactivate subscription');
    } finally {
      setActionLoading(null);
    }
  };

  // Development only: Reset trade count for testing
  const handleResetTradeCount = async () => {
    try {
      setActionLoading('reset');
      await subscriptionsApi.resetTradeCount();
      await loadData();
      
      // Notify other components that subscription status has been updated
      console.log('🚀 Dispatching subscriptionUpdated event...');
      window.dispatchEvent(new CustomEvent('subscriptionUpdated'));
      
      alert('Trade count reset to 0 for testing!');
    } catch (error) {
      console.error('Error resetting trade count:', error);
      setError('Failed to reset trade count');
    } finally {
      setActionLoading(null);
    }
  };

  const confirmAction = async () => {
    if (!showConfirmModal) return;

    try {
      setActionLoading(showConfirmModal.type);
      
      if (showConfirmModal.type === 'cancel') {
        await subscriptionsApi.cancel();
      } else if (showConfirmModal.type === 'downgrade' && showConfirmModal.targetPlan) {
        await subscriptionsApi.downgrade(showConfirmModal.targetPlan);
      }
      
      setShowConfirmModal(null);
      await loadData();
    } catch (error) {
      console.error(`Error ${showConfirmModal.type}ing subscription:`, error);
      setError(`Failed to ${showConfirmModal.type} subscription`);
    } finally {
      setActionLoading(null);
    }
  };

  const handlePaymentSuccess = () => {
    setShowPaymentForm(false);
    setSelectedPlan(null);
    loadData();
  };

  const getAvailableActions = () => {
    if (!subscriptionStatus) return [];
    
    const currentPlan = subscriptionStatus.plan;
    const actions = [];

    // If currently canceling, show reactivate option
    if (subscriptionStatus.cancelAtPeriodEnd) {
      actions.push({
        id: 'reactivate',
        label: 'Keep Current Plan',
        type: 'primary' as const,
        action: handleReactivate
      });
    } else if (currentPlan !== 'free') {
      // Show cancel option for paid plans
      actions.push({
        id: 'cancel',
        label: 'Cancel Subscription',
        type: 'danger' as const,
        action: handleCancel
      });

      // Show downgrade options
      if (currentPlan === 'premium') {
        actions.push({
          id: 'downgrade-pro',
          label: 'Downgrade to Pro',
          type: 'secondary' as const,
          action: () => handleDowngrade('pro')
        });
      }
      
      if (currentPlan !== 'free') {
        actions.push({
          id: 'downgrade-free',
          label: 'Downgrade to Free',
          type: 'secondary' as const,
          action: () => handleDowngrade('free')
        });
      }
    }

    return actions;
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-8 text-center">
          <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-400">Loading subscription information...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-gray-800 border border-red-600 rounded-lg p-8 text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <h3 className="text-xl font-semibold text-white mb-2">Error</h3>
          <p className="text-gray-400 mb-6">{error}</p>
          <button
            onClick={() => {
              setError(null);
              loadData();
            }}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (showPaymentForm && selectedPlan) {
    const plan = plans.find(p => p.id === selectedPlan);
    if (!plan) return null;

    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="mb-6">
          <button
            onClick={() => {
              setShowPaymentForm(false);
              setSelectedPlan(null);
            }}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ← Back to Subscription Management
          </button>
        </div>
        <PaymentForm
          plan={plan}
          onSuccess={handlePaymentSuccess}
          onCancel={() => {
            setShowPaymentForm(false);
            setSelectedPlan(null);
          }}
        />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Subscription Management</h1>
        <p className="text-gray-400">Manage your trading journal subscription and billing</p>
      </div>

      {/* Current Subscription Status */}
      {subscriptionStatus && (
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Current Subscription</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Plan Info */}
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <h3 className="text-lg font-medium text-white capitalize">
                  {subscriptionStatus.plan} Plan
                </h3>
                {subscriptionStatus.plan !== 'free' && (
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    subscriptionStatus.status === 'active' && !subscriptionStatus.cancelAtPeriodEnd
                      ? 'bg-green-600 text-white'
                      : subscriptionStatus.cancelAtPeriodEnd
                      ? 'bg-yellow-600 text-white'
                      : 'bg-red-600 text-white'
                  }`}>
                    {subscriptionStatus.cancelAtPeriodEnd ? 'Canceling' : subscriptionStatus.status}
                  </span>
                )}
              </div>
              
              {subscriptionStatus.cancelAtPeriodEnd && (
                <div className="text-yellow-400 text-sm">
                  <p className="font-medium">
                    {subscriptionStatus.plan === 'free' ? 'Cancellation Requested' : 'Downgrade/Cancellation Scheduled'}. 
                    {subscriptionStatus.currentPeriodEnd 
                      ? ` You'll keep your current benefits until ${new Date(subscriptionStatus.currentPeriodEnd).toLocaleDateString()}`
                      : ' You\'ll keep your current benefits until the end of your current billing period'
                    }
                  </p>
                </div>
              )}
              
              {subscriptionStatus.currentPeriodEnd && !subscriptionStatus.cancelAtPeriodEnd && (
                <p className="text-gray-400 text-sm">
                  {subscriptionStatus.plan === 'free' 
                    ? `Active since ${new Date(subscriptionStatus.currentPeriodStart || Date.now()).toLocaleDateString()}`
                    : `Renews on ${new Date(subscriptionStatus.currentPeriodEnd).toLocaleDateString()}`
                  }
                </p>
              )}
            </div>

            {/* Usage */}
            <div>
              <h4 className="text-gray-400 text-sm mb-2">Monthly Usage</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-white">Trades</span>
                  <span className="text-white">
                    {subscriptionStatus.tradeCount}
                    {subscriptionStatus.maxTrades > 0 && ` / ${subscriptionStatus.maxTrades}`}
                  </span>
                </div>
                {subscriptionStatus.maxTrades > 0 && (
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all ${
                        subscriptionStatus.usagePercentage >= 90 ? 'bg-red-500' :
                        subscriptionStatus.usagePercentage >= 70 ? 'bg-yellow-500' : 'bg-blue-500'
                      }`}
                      style={{ width: `${Math.min(subscriptionStatus.usagePercentage, 100)}%` }}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div>
              <h4 className="text-gray-400 text-sm mb-2">Actions</h4>
              <div className="space-y-2">
                {getAvailableActions().map((action) => (
                  <button
                    key={action.id}
                    onClick={action.action}
                    disabled={actionLoading === action.type}
                    className={`w-full px-3 py-2 rounded text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                      action.type === 'primary'
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : action.type === 'danger'
                        ? 'bg-red-600 hover:bg-red-700 text-white'
                        : 'bg-gray-600 hover:bg-gray-700 text-white'
                    }`}
                  >
                    {actionLoading === action.type ? 'Loading...' : action.label}
                  </button>
                ))}
                
                {/* Development Only: Reset Trade Count */}
                {(import.meta as any).env?.MODE !== 'production' && subscriptionStatus?.maxTrades > 0 && (
                  <button
                    onClick={handleResetTradeCount}
                    disabled={actionLoading === 'reset'}
                    className="w-full px-3 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded text-sm font-medium transition-colors disabled:opacity-50"
                    title="Development only: Reset trade count to 0"
                  >
                    {actionLoading === 'reset' ? 'Resetting...' : '🔄 Reset Trade Count (Dev)'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Available Plans */}
      <div>
        <h2 className="text-xl font-semibold text-white mb-6">Available Plans</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const isCurrent = plan.id === subscriptionStatus?.plan;
            const canUpgrade = !isCurrent && 
              ((subscriptionStatus?.plan === 'free' && plan.id !== 'free') ||
               (subscriptionStatus?.plan === 'pro' && plan.id === 'premium'));

            return (
              <div
                key={plan.id}
                className={`bg-gray-800 border rounded-xl p-6 transition-all ${
                  isCurrent 
                    ? 'border-blue-500 ring-2 ring-blue-500/20' 
                    : 'border-gray-700 hover:border-gray-600'
                } ${plan.id === 'premium' ? 'relative' : ''}`}
              >
                {plan.id === 'premium' && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                      Most Popular
                    </span>
                  </div>
                )}

                {isCurrent && (
                  <div className="absolute -top-3 right-4">
                    <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                      Current
                    </span>
                  </div>
                )}

                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                  <div className="mb-4">
                    {plan.price === 0 ? (
                      <span className="text-3xl font-bold text-white">Free</span>
                    ) : (
                      <div>
                        <span className="text-3xl font-bold text-white">${plan.price}</span>
                        <span className="text-gray-400">/month</span>
                      </div>
                    )}
                  </div>
                  <p className="text-gray-400">
                    {plan.maxTrades === -1 ? 'Unlimited trades' : `${plan.maxTrades} trades per month`}
                  </p>
                </div>

                <ul className="space-y-2 mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center text-gray-300 text-sm">
                      <span className="text-green-400 mr-2">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>

                {canUpgrade && (
                  <button
                    onClick={() => handleUpgrade(plan.id)}
                    className={`w-full py-3 px-4 rounded-lg font-medium transition-all ${
                      plan.id === 'premium'
                        ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    Upgrade to {plan.name}
                  </button>
                )}

                {isCurrent && (
                  <div className="w-full py-3 px-4 bg-gray-600 text-gray-300 rounded-lg text-center font-medium">
                    Current Plan
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-white mb-4">
              Confirm {showConfirmModal.type === 'cancel' ? 'Cancellation' : 'Downgrade'}
            </h3>
            <p className="text-gray-300 mb-6">{showConfirmModal.message}</p>
            <div className="flex space-x-3">
              <button
                onClick={confirmAction}
                disabled={actionLoading !== null}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {actionLoading ? 'Processing...' : 'Confirm'}
              </button>
              <button
                onClick={() => setShowConfirmModal(null)}
                disabled={actionLoading !== null}
                className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionPage;