// API Configuration
export const API_CONFIG = {
  // Use environment variable if available, otherwise default to production
  BASE_URL: (import.meta as any).env?.VITE_API_URL || 'https://trading-journal-backend-5fi2.onrender.com',
  
  // API endpoints
  get API_BASE_URL() {
    return `${this.BASE_URL}/api`;
  }
};

// For backward compatibility - export the URL directly
export const API_BASE_URL = API_CONFIG.API_BASE_URL;