import React, { createContext, useContext, ReactNode } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';

// Load Stripe with your publishable key
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

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
export const StripeProvider: React.FC<StripeProviderProps> = ({ children }) => {
  return (
    <Elements stripe={stripePromise}>
      <StripeContext.Provider value={stripePromise}>
        {children}
      </StripeContext.Provider>
    </Elements>
  );
};

export default StripeProvider;