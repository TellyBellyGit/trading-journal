import React, { useState } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { SubscriptionPlan, subscriptionsApi } from '../api/subscriptions';

interface PaymentFormProps {
  plan: SubscriptionPlan;
  onSuccess: () => void;
  onCancel: () => void;
}

const PaymentForm: React.FC<PaymentFormProps> = ({ plan, onSuccess, onCancel }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cardComplete, setCardComplete] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      setError('Stripe has not loaded yet. Please try again.');
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setError('Card element not found');
      return;
    }

    if (!cardComplete) {
      setError('Please complete your card information');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Create payment method
      const { error: cardError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
      });

      if (cardError) {
        setError(cardError.message || 'An error occurred with your card');
        setLoading(false);
        return;
      }

      if (!paymentMethod) {
        setError('Failed to create payment method');
        setLoading(false);
        return;
      }

      // Upgrade subscription
      const result = await subscriptionsApi.upgrade(plan.id, paymentMethod.id);

      if (result.clientSecret) {
        // Confirm payment if needed
        const { error: confirmError } = await stripe.confirmCardPayment(result.clientSecret);
        
        if (confirmError) {
          setError(confirmError.message || 'Payment confirmation failed');
          setLoading(false);
          return;
        }
      }

      // Success!
      onSuccess();
    } catch (err: any) {
      console.error('Payment error:', err);
      setError(err.message || 'An error occurred during payment');
    } finally {
      setLoading(false);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#ffffff',
        '::placeholder': {
          color: '#9ca3af',
        },
        backgroundColor: '#374151',
        padding: '12px',
      },
      invalid: {
        color: '#ef4444',
      },
    },
    hidePostalCode: false,
  };

  return (
    <div className="max-w-md mx-auto bg-gray-800 border border-gray-700 rounded-xl p-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">
          Upgrade to {plan.name}
        </h2>
        <p className="text-gray-400">
          ${plan.price}/month • {plan.maxTrades === -1 ? 'Unlimited' : plan.maxTrades} trades
        </p>
      </div>

      {/* Payment Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Card Element */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Card Information
          </label>
          <div className="bg-gray-700 border border-gray-600 rounded-lg p-4">
            <CardElement
              options={cardElementOptions}
              onChange={(event) => {
                setCardComplete(event.complete);
                if (event.error) {
                  setError(event.error.message);
                } else {
                  setError(null);
                }
              }}
            />
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Features Reminder */}
        <div className="bg-gray-700/50 rounded-lg p-4">
          <h4 className="font-medium text-white mb-2">What you'll get:</h4>
          <ul className="space-y-1">
            {plan.features.map((feature, index) => (
              <li key={index} className="text-sm text-gray-300 flex items-center">
                <span className="text-green-400 mr-2">✓</span>
                {feature}
              </li>
            ))}
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-4">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="flex-1 py-3 px-4 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!stripe || !cardComplete || loading}
            className={`
              flex-1 py-3 px-4 rounded-lg font-medium transition-all
              ${plan.id === 'premium'
                ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700'
                : 'bg-blue-600 hover:bg-blue-700'
              }
              text-white disabled:opacity-50 disabled:cursor-not-allowed
              flex items-center justify-center
            `}
          >
            {loading ? (
              <>
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                Processing...
              </>
            ) : (
              `Subscribe for $${plan.price}/month`
            )}
          </button>
        </div>
      </form>

      {/* Security Notice */}
      <div className="mt-6 text-center">
        <p className="text-xs text-gray-500">
          🔒 Your payment information is secure and encrypted
        </p>
      </div>
    </div>
  );
};

export default PaymentForm;