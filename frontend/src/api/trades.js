import axios from 'axios';
const API_BASE_URL = 'http://localhost:3002/api'; // Updated to match your backend port
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});
// Enhanced Trades API
export const tradesApi = {
    // Get all trades (with optional broker filter and pagination)
    getAll: async (brokerId, page = 1, limit = 20) => {
        const params = { page, limit };
        if (brokerId)
            params.brokerId = brokerId;
        const response = await api.get('/trades', { params });
        return response.data;
    },
    // Legacy method for backward compatibility (returns all trades without pagination)
    getAllLegacy: async (brokerId) => {
        const params = brokerId ? { brokerId, limit: 10000 } : { limit: 10000 };
        const response = await api.get('/trades', { params });
        return response.data.trades || response.data;
    },
    // Get single trade with full details
    getById: async (id) => {
        const response = await api.get(`/trades/${id}`);
        return response.data;
    },
    // Create new trade
    create: async (trade) => {
        const response = await api.post('/trades', trade);
        return response.data;
    },
    // Update trade
    update: async (id, trade) => {
        const response = await api.put(`/trades/${id}`, trade);
        return response.data;
    },
    // 🔥 NEW: Update only trade notes (for auto-save)
    updateNotes: async (id, notes) => {
        const response = await api.patch(`/trades/${id}/notes`, { notes });
        return response.data;
    },
    // 🔥 NEW: Search trades with advanced filtering and pagination
    search: async (filters, page = 1, limit = 20) => {
        const params = { ...filters, page, limit };
        const response = await api.get('/trades/search', { params });
        return response.data;
    },
    // Legacy search method for backward compatibility
    searchLegacy: async (filters) => {
        const params = { ...filters, limit: 10000 };
        const response = await api.get('/trades/search', { params });
        return response.data.trades || response.data;
    },
    // 🔥 NEW: Get trade statistics
    getStats: async (brokerId) => {
        const params = brokerId ? { brokerId } : {};
        const response = await api.get('/trades/stats', { params });
        return response.data;
    },
    // Delete trade
    delete: async (id) => {
        await api.delete(`/trades/${id}`);
    },
    import: {
        process: async (file) => {
            const formData = new FormData();
            formData.append('csvFile', file);
            try {
                const response = await api.post('/trades/import/process', formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                });
                // Log the response for debugging
                console.log('🔍 Backend response:', response.data);
                return response.data;
            }
            catch (error) {
                console.error('❌ Import process error:', error);
                if (axios.isAxiosError(error) && error.response) {
                    return error.response.data;
                }
                throw error;
            }
        },
        save: async (trades, brokerId) => {
            try {
                const response = await api.post('/trades/import/save', {
                    trades,
                    brokerId
                });
                console.log('💾 Save response:', response.data);
                return response.data;
            }
            catch (error) {
                console.error('❌ Import save error:', error);
                if (axios.isAxiosError(error) && error.response) {
                    return error.response.data;
                }
                throw error;
            }
        }
    }
};
// 🔥 NEW: Brokers API
export const brokersApi = {
    // Get all brokers
    getAll: async () => {
        const response = await api.get('/brokers');
        return response.data;
    },
    // Get single broker with trade count
    getById: async (id) => {
        const response = await api.get(`/brokers/${id}`);
        return response.data;
    },
    // Create new broker
    create: async (broker) => {
        const response = await api.post('/brokers', broker);
        return response.data;
    },
    // Update broker
    update: async (id, broker) => {
        const response = await api.put(`/brokers/${id}`, broker);
        return response.data;
    },
    // Get broker performance stats
    getStats: async (id) => {
        const response = await api.get(`/brokers/${id}/stats`);
        return response.data;
    },
    // Delete broker (only if no trades)
    delete: async (id) => {
        await api.delete(`/brokers/${id}`);
    },
};
// 🔥 NEW: Health check
export const healthApi = {
    check: async () => {
        const response = await api.get('/health');
        return response.data;
    },
};
// Export default API object for convenience
export default {
    trades: tradesApi,
    brokers: brokersApi,
    health: healthApi,
};
