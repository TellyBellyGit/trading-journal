import React, { useState, useEffect } from 'react';
import { subscriptionsApi, SubscriptionPlan, SubscriptionStatus } from '../api/subscriptions';
import PaymentForm from './PaymentForm';

interface SubscriptionPricingProps {
  onClose?: () => void;
  currentPlan?: string;
}

const SubscriptionPricing: React.FC<SubscriptionPricingProps> = ({ onClose, currentPlan = 'free' }) => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const handlePlanSelect = (planId: string) => {
    if (planId === 'free') {
      return; // Cannot "upgrade" to free plan
    }
    
    if (planId === currentPlan) {
      return; // Already on this plan
    }

    setSelectedPlan(planId);
    setShowPaymentForm(true);
  };

  const handlePaymentSuccess = () => {
    setShowPaymentForm(false);
    setSelectedPlan(null);
    loadData(); // Refresh data
    if (onClose) onClose();
  };

  const getPlanButtonText = (plan: SubscriptionPlan) => {
    if (plan.id === currentPlan) {
      return 'Current Plan';
    }
    if (plan.id === 'free') {
      return 'Free Plan';
    }
    return `Upgrade to ${plan.name}`;
  };

  const getPlanButtonStyle = (plan: SubscriptionPlan) => {
    if (plan.id === currentPlan) {
      return 'bg-gray-600 text-gray-300 cursor-not-allowed';
    }
    if (plan.id === 'free') {
      return 'bg-gray-600 text-gray-300 cursor-not-allowed';
    }
    return plan.id === 'premium' 
      ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white'
      : 'bg-blue-600 hover:bg-blue-700 text-white';
  };

  if (loading) {
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-8 text-center">
        <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-gray-400">Loading subscription plans...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-800 border border-red-600 rounded-lg p-8 text-center">
        <div className="text-4xl mb-4">⚠️</div>
        <h3 className="text-xl font-semibold text-white mb-2">Error</h3>
        <p className="text-gray-400 mb-6">{error}</p>
        <div className="flex space-x-4 justify-center">
          <button
            onClick={loadData}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="px-6 py-3 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    );
  }

  if (showPaymentForm && selectedPlan) {
    const plan = plans.find(p => p.id === selectedPlan);
    if (!plan) return null;

    return (
      <PaymentForm
        plan={plan}
        onSuccess={handlePaymentSuccess}
        onCancel={() => {
          setShowPaymentForm(false);
          setSelectedPlan(null);
        }}
      />
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-white mb-4">
          Choose Your Trading Plan
        </h1>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto">
          Unlock the full potential of your trading journal with advanced analytics, unlimited trades, and powerful insights.
        </p>
      </div>

      {/* Current Usage */}
      {subscriptionStatus && (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 mb-8">
          <h3 className="text-lg font-semibold text-white mb-4">Current Usage</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-gray-400">Current Plan</p>
              <p className="text-xl font-semibold text-white capitalize">{subscriptionStatus.plan}</p>
            </div>
            <div>
              <p className="text-gray-400">Trades This Month</p>
              <p className="text-xl font-semibold text-white">
                {subscriptionStatus.tradeCount}
                {subscriptionStatus.maxTrades > 0 && ` / ${subscriptionStatus.maxTrades}`}
              </p>
            </div>
            <div>
              <p className="text-gray-400">Usage</p>
              <div className="flex items-center space-x-2">
                <div className="flex-1 bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all"
                    style={{ width: `${Math.min(subscriptionStatus.usagePercentage, 100)}%` }}
                  />
                </div>
                <span className="text-sm text-gray-400">
                  {subscriptionStatus.usagePercentage.toFixed(0)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pricing Plans */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`
              relative bg-gray-800 border rounded-xl p-8 transition-all duration-300
              ${plan.id === 'premium' 
                ? 'border-purple-500 ring-2 ring-purple-500/20 shadow-lg shadow-purple-500/10' 
                : 'border-gray-700 hover:border-gray-600'
              }
              ${plan.id === currentPlan ? 'ring-2 ring-blue-500/20' : ''}
            `}
          >
            {/* Popular badge for premium */}
            {plan.id === 'premium' && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                  Most Popular
                </span>
              </div>
            )}

            {/* Current plan badge */}
            {plan.id === currentPlan && (
              <div className="absolute -top-3 right-4">
                <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                  Current
                </span>
              </div>
            )}

            {/* Plan header */}
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
              <div className="mb-4">
                {plan.price === 0 ? (
                  <span className="text-4xl font-bold text-white">Free</span>
                ) : (
                  <div>
                    <span className="text-4xl font-bold text-white">${plan.price}</span>
                    <span className="text-gray-400">/month</span>
                  </div>
                )}
              </div>
              <p className="text-gray-400">
                {plan.maxTrades === -1 ? 'Unlimited trades' : `${plan.maxTrades} trades per month`}
              </p>
            </div>

            {/* Features */}
            <ul className="space-y-3 mb-8">
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-center text-gray-300">
                  <span className="text-green-400 mr-3">✓</span>
                  {feature}
                </li>
              ))}
            </ul>

            {/* Action button */}
            <button
              onClick={() => handlePlanSelect(plan.id)}
              disabled={plan.id === currentPlan || plan.id === 'free'}
              className={`
                w-full py-3 px-6 rounded-lg font-medium transition-all duration-200
                ${getPlanButtonStyle(plan)}
                disabled:cursor-not-allowed
              `}
            >
              {getPlanButtonText(plan)}
            </button>
          </div>
        ))}
      </div>

      {/* Close button */}
      {onClose && (
        <div className="text-center mt-8">
          <button
            onClick={onClose}
            className="px-6 py-2 text-gray-400 hover:text-white transition-colors"
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
};

export default SubscriptionPricing;