import Stripe from 'stripe';

// Initialize Stripe with secret key (fallback to dummy key for development)
const stripeKey = process.env.STRIPE_SECRET_KEY || 'sk_test_dummy_key_for_development';

export const stripe = new Stripe(stripeKey, {
  apiVersion: '2025-06-30.basil',
  typescript: true,
});

// Subscription plan configurations
export const SUBSCRIPTION_PLANS = {
  free: {
    name: 'Free',
    maxTrades: 25,
    price: 0,
    stripePriceId: null,
    features: [
      '25 trades per month',
      'Basic analytics',
      'Trade journaling',
      'Basic export'
    ]
  },
  pro: {
    name: 'Pro',
    maxTrades: -1, // unlimited
    price: 9.99,
    stripePriceId: process.env.STRIPE_PRO_PRICE_ID,
    features: [
      'Unlimited trades',
      'Advanced analytics',
      'Rich text journaling',
      'CSV import/export',
      'Performance indicators',
      'Email support'
    ]
  },
  premium: {
    name: 'Premium',
    maxTrades: -1, // unlimited
    price: 19.99,
    stripePriceId: process.env.STRIPE_PREMIUM_PRICE_ID,
    features: [
      'Everything in Pro',
      'AI-powered trade analysis',
      'Advanced reporting',
      'Priority support',
      'Custom integrations',
      'Trading recommendations'
    ]
  }
} as const;

export type SubscriptionPlan = keyof typeof SUBSCRIPTION_PLANS;

// Helper function to get plan limits
export const getPlanLimits = (plan: SubscriptionPlan) => {
  return SUBSCRIPTION_PLANS[plan];
};

// Helper function to check if plan allows unlimited trades
export const isUnlimitedPlan = (plan: SubscriptionPlan): boolean => {
  return SUBSCRIPTION_PLANS[plan].maxTrades === -1;
};