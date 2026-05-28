import axios from 'axios';
import { API_BASE_URL } from '../config/api';

// Check if Stripe/subscriptions should be bypassed
// Force bypass until Cloudflare Pages VITE_BYPASS_STRIPE env var or backend CORS is configured.
// Change to `=== 'true'` to use env var; `=== 'false'` to force disable bypass later.
const BYPASS_STRIPE = (import.meta as any).env?.VITE_BYPASS_STRIPE !== 'false';

// Create axios instance with authentication
const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Subscription types
export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  maxTrades: number;
  stripePriceId: string | null;
  features: string[];
}

export interface SubscriptionStatus {
  id: number;
  plan: string;
  status: string;
  maxTrades: number;
  tradeCount: number;
  usagePercentage: number;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd: boolean;
  planConfig: SubscriptionPlan;
}

// Mock data returned when VITE_BYPASS_STRIPE=true
// This prevents CORS/network errors from subscription status checks
const MOCK_SUBSCRIPTION_STATUS: SubscriptionStatus = {
  id: 1,
  plan: 'pro',
  status: 'active',
  maxTrades: -1, // unlimited
  tradeCount: 0,
  usagePercentage: 0,
  currentPeriodStart: new Date().toISOString(),
  currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  cancelAtPeriodEnd: false,
  planConfig: {
    id: 'pro',
    name: 'Pro',
    price: 19,
    maxTrades: -1,
    stripePriceId: null,
    features: ['Unlimited trades', 'Rich text notes', 'Advanced analytics', 'Priority support']
  }
};

const MOCK_PLANS: SubscriptionPlan[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    maxTrades: 10,
    stripePriceId: null,
    features: ['10 trades/month', 'Basic notes', 'Basic analytics']
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 19,
    maxTrades: -1,
    stripePriceId: null,
    features: ['Unlimited trades', 'Rich text notes', 'Advanced analytics', 'Priority support']
  }
];

// Subscription API
export const subscriptionsApi = {
  // Get current subscription status
  getStatus: async (): Promise<SubscriptionStatus> => {
    if (BYPASS_STRIPE) {
      console.log('🔧 [BYPASS] Skipping subscription status API call');
      return { ...MOCK_SUBSCRIPTION_STATUS };
    }
    const response = await api.get('/subscriptions/status');
    return response.data;
  },

  // Get available plans
  getPlans: async (): Promise<SubscriptionPlan[]> => {
    if (BYPASS_STRIPE) {
      console.log('🔧 [BYPASS] Skipping subscription plans API call');
      return [...MOCK_PLANS];
    }
    const response = await api.get('/subscriptions/plans');
    return response.data;
  },

  // Upgrade to paid plan
  upgrade: async (plan: string, paymentMethodId: string) => {
    if (BYPASS_STRIPE) {
      console.log('🔧 [BYPASS] Skipping subscription upgrade API call');
      return { success: true, message: 'Bypass mode - no actual upgrade performed' };
    }
    const response = await api.post('/subscriptions/upgrade', {
      plan,
      paymentMethodId
    });
    return response.data;
  },

  // Cancel subscription
  cancel: async () => {
    if (BYPASS_STRIPE) {
      console.log('🔧 [BYPASS] Skipping subscription cancel API call');
      return { success: true };
    }
    const response = await api.post('/subscriptions/cancel');
    return response.data;
  },

  // Reactivate subscription
  reactivate: async () => {
    if (BYPASS_STRIPE) {
      console.log('🔧 [BYPASS] Skipping subscription reactivate API call');
      return { success: true };
    }
    const response = await api.post('/subscriptions/reactivate');
    return response.data;
  },

  // Downgrade subscription
  downgrade: async (targetPlan: string) => {
    if (BYPASS_STRIPE) {
      console.log('🔧 [BYPASS] Skipping subscription downgrade API call');
      return { success: true };
    }
    const response = await api.post('/subscriptions/downgrade', {
      targetPlan
    });
    return response.data;
  },

  // Check if user can add trade
  canAddTrade: async (): Promise<{ canAdd: boolean; reason?: string; remaining?: number }> => {
    if (BYPASS_STRIPE) {
      console.log('🔧 [BYPASS] Skipping can-add-trade API call');
      return { canAdd: true, remaining: -1 };
    }
    const response = await api.get('/subscriptions/can-add-trade');
    return response.data;
  },

  // Development only: Reset trade count for testing
  resetTradeCount: async () => {
    if (BYPASS_STRIPE) {
      console.log('🔧 [BYPASS] Skipping reset-trade-count API call');
      return { success: true };
    }
    const response = await api.post('/subscriptions/reset-trade-count');
    return response.data;
  }
};

export default subscriptionsApi;