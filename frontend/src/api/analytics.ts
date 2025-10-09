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

export const analyticsApi = {
  // Get analytics summary
  getSummary: async () => {
    const response = await api.get('/trades/analytics/summary');
    return response.data;
  },

  // Get daily analytics
  getDaily: async (date: string) => {
    const response = await api.get(`/trades/analytics/daily/${date}`);
    return response.data;
  },

  // Get weekly analytics
  getWeekly: async (date: string) => {
    const response = await api.get(`/trades/analytics/weekly/${date}`);
    return response.data;
  },

  // Get monthly analytics
  getMonthly: async (date: string) => {
    const response = await api.get(`/trades/analytics/monthly/${date}`);
    return response.data;
  },

  // Get year-to-date analytics
  getYTD: async (year: number) => {
    const response = await api.get(`/trades/analytics/ytd/${year}`);
    return response.data;
  },

  // Get previous year analytics
  getPreviousYear: async (year: number) => {
    const response = await api.get(`/trades/analytics/previous-year/${year}`);
    return response.data;
  },
};

export default analyticsApi;