// frontend/src/api/market.ts
// API client for market chart data

import axios from 'axios';
import { API_BASE_URL } from '../config/api';
import type { ChartResponse, SymbolsResponse } from '../types/Market';

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
  (error) => Promise.reject(error)
);

export const marketApi = {
  /**
   * Fetch OHLCV chart data for a symbol.
   * @param symbol    Ticker symbol (e.g., 'AAPL')
   * @param interval  Bar interval: '1m', '5m', '15m', '1h' (default: '5m')
   * @param range     Date range: '1d', '5d', '1mo' (default: '1d')
   * @param entryDate ISO date from trade row (for freshness warning)
   */
  getChart: async (
    symbol: string,
    interval: string = '5m',
    range: string = '1d',
    entryDate?: string
  ): Promise<ChartResponse> => {
    const params = new URLSearchParams({ interval, range });
    if (entryDate) params.set('entryDate', entryDate);

    const response = await api.get(`/market/chart/${symbol}?${params}`);
    return response.data;
  },

  /**
   * Get unique symbols from the user's trades for the symbol dropdown.
   */
  getSymbols: async (): Promise<SymbolsResponse> => {
    const response = await api.get('/market/symbols');
    return response.data;
  },
};