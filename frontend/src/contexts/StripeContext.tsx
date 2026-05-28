import React, { createContext, useContext, ReactNode } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';

// Check if Stripe bypass is enabled via environment variable
const BYPASS_STRIPE = (import.meta as any).env?.VITE_BYPASS_STRIPE === 'true';

// Only load Stripe.js when NOT bypassed (avoids viewport meta error & network requests)
const stripeKey = (import.meta as any).env?.VITE_STRIPE_PUBLIC_KEY || (import.meta as any).env?.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder';
const stripePromise = BYPASS_STRIPE ? null : loadStripe(stripeKey);

interface StripeProviderProps {
  children: ReactNode;
}

// Stripe context for accessing stripe instance if needed
const StripeContext = createContext<any>(null);

export const useStripe = () => {
  const context = useContext(StripeContext);
  return context;
};

// Main provider component
// When VITE_BYPASS_STRIPE=true, skips the Elements wrapper entirely
// ALL Stripe code is preserved - just not executed at runtime
export const StripeProvider: React.FC<StripeProviderProps> = ({ children }) => {
  // Stripe bypass: render children directly without Elements wrapper
  if (BYPASS_STRIPE || !stripePromise) {
    return (
      <StripeContext.Provider value={null}>
        {children}
      </StripeContext.Provider>
    );
  }

  // Normal Stripe path (all code preserved for later use)
  return (
    <Elements stripe={stripePromise}>
      <StripeContext.Provider value={stripePromise}>
        {children}
      </StripeContext.Provider>
    </Elements>
  );
};

export default StripeProvider;