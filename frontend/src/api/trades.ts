import axios from 'axios';
import type { Trade, NewTrade, TradeFilters, TradeStats, Broker, BrokerStats } from '../types/Trade';

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

interface DateContext {
  pageStartDate: string;
  pageEndDate: string;
  totalInRange: number;
  isDateFiltered: boolean;
}

interface PaginatedResponse<T> {
  trades: T[];
  pagination: PaginationInfo;
  dateContext?: DateContext;
}

interface ImportSummary {
  totalImported: number;
  duplicatesRejected: number;
  longTrades: number;
  shortTrades: number;
  openLongs: number;
  openShorts: number;
}

interface ParsedTrade {
  symbol: string;
  direction: 'Long' | 'Short';
  quantity: number;
  entryDate: string;
  entryTime: string;
  entryPrice: number;
  exitDate: string;
  exitTime: string;
  exitPrice: number;
  duration: number;
  pnl: number;
  percentChange: number;
  orderType: string;
  status: 'Open' | 'Closed';
}

interface ImportProcessResponse {
  trades: ParsedTrade[];
  summary: ImportSummary;
  duplicateDetails?: {
    symbol: string;
    entryDate: string;
    entryTime: string;
    reason: string;
  }[];
}

interface ImportSaveResponse {
  message: string;
  summary: {
    saved: number;
    duplicatesRejected: number;
  };
}




import { API_BASE_URL } from '../config/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('auth_token'); // Fixed: correct key name
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // If sending FormData, remove Content-Type to let browser set it with boundary
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Enhanced Trades API
export const tradesApi = {
  // Get all trades (with optional broker filter and pagination)
  getAll: async (brokerId?: number, page: number = 1, limit: number = 20): Promise<PaginatedResponse<Trade>> => {
    const params: any = { page, limit };
    if (brokerId) params.brokerId = brokerId;
    const response = await api.get('/trades', { params });
    return response.data;
  },

  // Legacy method for backward compatibility (returns all trades without pagination)
  getAllLegacy: async (brokerId?: number): Promise<Trade[]> => {
    const params = brokerId ? { brokerId, limit: 10000 } : { limit: 10000 };
    const response = await api.get('/trades', { params });
    return response.data.trades || response.data;
  },

  // Get single trade with full details
  getById: async (id: number): Promise<Trade> => {
    const response = await api.get(`/trades/${id}`);
    return response.data;
  },

  // Create new trade
  create: async (trade: NewTrade): Promise<Trade> => {
    const response = await api.post('/trades', trade);
    return response.data;
  },

  // Update trade
  update: async (id: number, trade: Partial<NewTrade>): Promise<Trade> => {
    const response = await api.put(`/trades/${id}`, trade);
    return response.data;
  },

  // 🔥 NEW: Update only trade notes (for auto-save)
  updateNotes: async (id: number, notes: string): Promise<{ success: boolean; updatedAt: string }> => {
    const response = await api.patch(`/trades/${id}/notes`, { notes });
    return response.data;
  },

  // 🔥 NEW: Update only trade assessment (for auto-save)
  updateAssessment: async (id: number, assessment: string): Promise<{ success: boolean; updatedAt: string }> => {
    const response = await api.patch(`/trades/${id}/assessment`, { assessment });
    return response.data;
  },

  // 🔥 NEW: Update only trade strategy (for auto-save)
  updateStrategy: async (id: number, strategy: string): Promise<{ success: boolean; updatedAt: string }> => {
    const response = await api.patch(`/trades/${id}/strategy`, { strategy });
    return response.data;
  },

  // 🔥 NEW: Search trades with advanced filtering and pagination
  search: async (filters: TradeFilters, page: number = 1, limit: number = 20): Promise<PaginatedResponse<Trade>> => {
    const params = { ...filters, page, limit };
    const response = await api.get('/trades/search', { params });
    return response.data;
  },

  // Legacy search method for backward compatibility
  searchLegacy: async (filters: TradeFilters): Promise<Trade[]> => {
    const params = { ...filters, limit: 10000 };
    const response = await api.get('/trades/search', { params });
    return response.data.trades || response.data;
  },

  // 🔥 NEW: Get trade statistics
  getStats: async (brokerId?: number): Promise<TradeStats> => {
    const params = brokerId ? { brokerId } : {};
    const response = await api.get('/trades/stats', { params });
    return response.data;
  },

  // 🔥 NEW: Get dashboard data (combines stats, recent trades, and server-calculated streak)
  getDashboard: async (brokerId?: number): Promise<{
    stats: TradeStats;
    recentTrades: Trade[];
    streak: { type: string; count: number; display: string };
    timestamp: string;
  }> => {
    const params = brokerId ? { brokerId } : {};
    const response = await api.get('/trades/dashboard', { params });
    return response.data;
  },

  // Delete trade
  delete: async (id: number): Promise<void> => {
    await api.delete(`/trades/${id}`);
  },

import: {
  process: async (file: File) => {
    const formData = new FormData();
    formData.append('csvFile', file);
    
    try {
      // Don't set Content-Type for FormData - let the browser set it with boundary
      const response = await api.post('/trades/import/process', formData);
      
      // Log the response for debugging
      console.log('🔍 Backend response:', response.data);
      
      return response.data;
    } catch (error) {
      console.error('❌ Import process error:', error);
      if (axios.isAxiosError(error) && error.response) {
        return error.response.data;
      }
      throw error;
    }
  },

  save: async (trades: any[], brokerId: number) => {
    try {
      const response = await api.post('/trades/import/save', {
        trades,
        brokerId
      });
      
      console.log('💾 Save response:', response.data);
      
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        // Don't log scary errors for expected subscription limits
        if (error.response.status === 403 && error.response.data?.error?.includes('limit')) {
          console.log('📊 Subscription limit reached:', error.response.data.message);
        } else {
          console.error('❌ Import save error:', error);
        }
        return error.response.data;
      }
      console.error('❌ Import save error:', error);
      throw error;
    }
  }
}




};

// 🔥 UPDATED: Brokers API for Global Broker System
export const brokersApi = {
  // Get all available brokers (global list with user account info)
  getAll: async (): Promise<Broker[]> => {
    const response = await api.get('/brokers');
    return response.data;
  },

  // Get single broker with user account details
  getById: async (id: number): Promise<Broker> => {
    const response = await api.get(`/brokers/${id}`);
    return response.data;
  },

  // Create or update user's broker account for a global broker
  createAccount: async (id: number, accountData: {
    accountType?: string;
    accountId?: string;
    customCommission?: number;
    displayName?: string;
  }): Promise<Broker> => {
    const response = await api.post(`/brokers/${id}/account`, accountData);
    return response.data;
  },

  // Update user's broker account
  updateAccount: async (id: number, accountData: {
    accountType?: string;
    accountId?: string;
    customCommission?: number;
    displayName?: string;
    isActive?: boolean;
  }): Promise<Broker> => {
    const response = await api.put(`/brokers/${id}/account`, accountData);
    return response.data;
  },

  // Delete user's broker account (not the global broker)
  deleteAccount: async (id: number): Promise<void> => {
    await api.delete(`/brokers/${id}/account`);
  },

  // Admin-only: Get all global brokers
  getAllGlobal: async (): Promise<Broker[]> => {
    const response = await api.get('/brokers/admin/global');
    return response.data;
  },

  // Admin-only: Create new global broker
  createGlobal: async (broker: {
    name: string;
    displayName?: string;
    defaultCommission?: number;
    commissionType?: string;
    isActive?: boolean;
  }): Promise<Broker> => {
    const response = await api.post('/brokers/admin/global', broker);
    return response.data;
  },

  // Admin-only: Update global broker
  updateGlobal: async (id: number, broker: {
    name?: string;
    displayName?: string;
    defaultCommission?: number;
    commissionType?: string;
    isActive?: boolean;
  }): Promise<Broker> => {
    const response = await api.put(`/brokers/admin/global/${id}`, broker);
    return response.data;
  },
};

// 🔥 NEW: Health check
export const healthApi = {
  check: async (): Promise<{ status: string; message: string }> => {
    const response = await api.get('/health');
    return response.data;
  },
};

// Export types
export type { PaginationInfo, PaginatedResponse, DateContext };

// Export default API object for convenience
export default {
  trades: tradesApi,
  brokers: brokersApi,
  health: healthApi,
};