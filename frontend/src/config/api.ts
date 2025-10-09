// API Configuration
export const API_CONFIG = {
  // Prefer env-provided backend URL; fallback to local dev
  BASE_URL: (import.meta as any).env?.VITE_API_URL || 'http://localhost:3003',

  // API endpoints
  get API_BASE_URL() {
    return `${this.BASE_URL}/api`;
  }
};

// Backward compatibility - export the URL directly
export const API_BASE_URL = API_CONFIG.API_BASE_URL;