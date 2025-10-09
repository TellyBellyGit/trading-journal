import axios from 'axios';
import { API_BASE_URL } from '../config/api';

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

export const analysisApi = {
  // Analyze single trade
  analyzeTrade: async (tradeData: any): Promise<{ analysis: string; timestamp: string; model: string }> => {
    const response = await api.post('/analysis/analyze-trade', tradeData);
    return response.data;
  },

  // Analyze multiple trades for portfolio insights
  analyzeTrades: async (trades: any[]): Promise<{ analysis: string; timestamp: string; model: string }> => {
    const response = await api.post('/analysis/analyze-trades', { trades });
    return response.data;
  },
};

export default analysisApi;