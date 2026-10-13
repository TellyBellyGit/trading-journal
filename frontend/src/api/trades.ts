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
// Export function for AI analysis
const exportTrades = async (startDate: string, endDate: string, status?: string): Promise<Trade[]> => {
  const params = new URLSearchParams({
    startDate,
    endDate,
    ...(status && { status })
  });
  
  const response = await api.get(`/trades/export?${params}`);
  return response.data.trades || response.data;
};

// Read paths are cached briefly (see ./cache.ts) so that switching views does
// not re-request identical data.
import { cachedApi, clearApiCache, DEFAULT_TTL_MS } from './cache';

// The API caps every page at 500 rows, so scoped queries page through instead
// of asking the Worker for the entire trade history in one request.
const RANGE_PAGE_SIZE = 500;
const RANGE_MAX_ROWS = 2000;

// Shared search fetch. Defined outside the object literal so that `searchRange`
// can page through results without referencing the literal it is declared in.
const fetchSearchPage = (
  filters: TradeFilters,
  page: number,
  limit: number,
  sortBy: string,
  sortOrder: 'asc' | 'desc'
): Promise<PaginatedResponse<Trade> & { sorting?: any }> => {
  const params = { ...filters, page, limit, sortBy, sortOrder };
  return cachedApi(`trades:search:${JSON.stringify(params)}`, async () => {
    const response = await api.get('/trades/search', { params });
    return response.data;
  });
};

export const tradesApi = {
  // Get all trades (with optional broker filter, pagination, and sorting)
  getAll: async (
    brokerId?: number, 
    page: number = 1, 
    limit: number = 20,
    sortBy: string = 'entryDate',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Promise<PaginatedResponse<Trade> & { sorting?: any }> => {
    const params: any = { page, limit, sortBy, sortOrder };
    if (brokerId) params.brokerId = brokerId;
    return cachedApi(
      `trades:list:${brokerId ?? 'all'}:${page}:${limit}:${sortBy}:${sortOrder}`,
      async () => {
        const response = await api.get('/trades', { params });
        return response.data;
      },
      DEFAULT_TTL_MS
    );
  },

  // Fetches every page of a date/broker scoped query, up to a hard ceiling.
  // Replaces the old "getAllLegacy" pattern that asked the Worker for 10,000
  // rows in a single request.
  searchRange: async (filters: TradeFilters, maxRows: number = RANGE_MAX_ROWS): Promise<Trade[]> => {
    const rows: Trade[] = [];
    let page = 1;
    while (rows.length < maxRows) {
      const response = await fetchSearchPage(filters, page, RANGE_PAGE_SIZE, 'entryDate', 'asc');
      const batch = response.trades || [];
      rows.push(...batch);
      if (batch.length === 0 || !response.pagination?.hasNextPage) {
        break;
      }
      page += 1;
    }
    return rows.slice(0, maxRows);
  },

  // Get single trade with full details
  getById: async (id: number): Promise<Trade> => {
    const response = await api.get(`/trades/${id}`);
    return response.data;
  },

  // Create new trade
  create: async (trade: NewTrade): Promise<Trade> => {
    const response = await api.post('/trades', trade);
    clearApiCache('trades:');
    return response.data;
  },

  // Update trade
  update: async (id: number, trade: Partial<NewTrade>): Promise<Trade> => {
    const response = await api.put(`/trades/${id}`, trade);
    clearApiCache('trades:');
    return response.data;
  },

  // 🔥 NEW: Update only trade notes (for auto-save)
  updateNotes: async (id: number, notes: string): Promise<{ success: boolean; updatedAt: string }> => {
    const response = await api.patch(`/trades/${id}/notes`, { notes });
    clearApiCache('trades:');
    return response.data;
  },

  // 🔥 NEW: Update only trade assessment (for auto-save)
  updateAssessment: async (id: number, assessment: string): Promise<{ success: boolean; updatedAt: string }> => {
    const response = await api.patch(`/trades/${id}/assessment`, { assessment });
    clearApiCache('trades:');
    return response.data;
  },

  // 🔥 NEW: Update only trade strategy (for auto-save)
  updateStrategy: async (id: number, strategy: string): Promise<{ success: boolean; updatedAt: string }> => {
    const response = await api.patch(`/trades/${id}/strategy`, { strategy });
    clearApiCache('trades:');
    return response.data;
  },

  // 🔥 NEW: Search trades with advanced filtering, pagination, and sorting
  search: async (
    filters: TradeFilters, 
    page: number = 1, 
    limit: number = 20,
    sortBy: string = 'entryDate',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Promise<PaginatedResponse<Trade> & { sorting?: any }> =>
    fetchSearchPage(filters, page, limit, sortBy, sortOrder),

  // 🔥 NEW: Get trade statistics
  getStats: async (brokerId?: number): Promise<TradeStats> => {
    const params = brokerId ? { brokerId } : {};
    return cachedApi(
      `trades:stats:${brokerId ?? 'all'}`,
      async () => {
        const response = await api.get('/trades/stats', { params });
        return response.data;
      },
      DEFAULT_TTL_MS
    );
  },

  // 🔥 NEW: Get dashboard data (combines stats, recent trades, and server-calculated streak)
  getDashboard: async (brokerId?: number): Promise<{
    stats: TradeStats;
    recentTrades: Trade[];
    streak: { type: string; count: number; display: string };
    timestamp: string;
  }> => {
    const params = brokerId ? { brokerId } : {};
    return cachedApi(
      `trades:dashboard:${brokerId ?? 'all'}`,
      async () => {
        const response = await api.get('/trades/dashboard', { params });
        return response.data;
      },
      DEFAULT_TTL_MS
    );
  },

  // Delete trade
  delete: async (id: number): Promise<void> => {
    await api.delete(`/trades/${id}`);
    clearApiCache('trades:');
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
      clearApiCache('trades:');
      
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

// Export function for the tradesApi
export { exportTrades };

// Export types
export type { PaginationInfo, PaginatedResponse, DateContext };

// Export default API object for convenience
export default {
  trades: { ...tradesApi, exportForAI: exportTrades },
  brokers: brokersApi,
  health: healthApi,
};