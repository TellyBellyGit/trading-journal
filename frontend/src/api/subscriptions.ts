import axios from 'axios';

import { API_BASE_URL } from '../config/api';

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

// Subscription API
export const subscriptionsApi = {
  // Get current subscription status
  getStatus: async (): Promise<SubscriptionStatus> => {
    const response = await api.get('/subscriptions/status');
    return response.data;
  },

  // Get available plans
  getPlans: async (): Promise<SubscriptionPlan[]> => {
    const response = await api.get('/subscriptions/plans');
    return response.data;
  },

  // Upgrade to paid plan
  upgrade: async (plan: string, paymentMethodId: string) => {
    const response = await api.post('/subscriptions/upgrade', {
      plan,
      paymentMethodId
    });
    return response.data;
  },

  // Cancel subscription
  cancel: async () => {
    const response = await api.post('/subscriptions/cancel');
    return response.data;
  },

  // Reactivate subscription
  reactivate: async () => {
    const response = await api.post('/subscriptions/reactivate');
    return response.data;
  },

  // Downgrade subscription
  downgrade: async (targetPlan: string) => {
    const response = await api.post('/subscriptions/downgrade', {
      targetPlan
    });
    return response.data;
  },

  // Check if user can add trade
  canAddTrade: async (): Promise<{ canAdd: boolean; reason?: string; remaining?: number }> => {
    const response = await api.get('/subscriptions/can-add-trade');
    return response.data;
  },

  // Development only: Reset trade count for testing
  resetTradeCount: async () => {
    const response = await api.post('/subscriptions/reset-trade-count');
    return response.data;
  }
};

export default subscriptionsApi;