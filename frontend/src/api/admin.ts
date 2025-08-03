// Admin API service
import { API_BASE_URL } from '../config/api';

// Types for admin API
export interface AdminUser {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  isAdmin: boolean;
  emailVerified: boolean;
  lastLogin: string | null;
  timezone: string;
  createdAt: string;
  updatedAt: string;
  subscription?: {
    plan: string;
    status: string;
    tradeCount: number;
    maxTrades: number;
    currentPeriodEnd: string;
  };
  _count: {
    trades: number;
    notes: number;
    brokers: number;
    loginHistory: number;
  };
}

export interface AdminUserDetail extends AdminUser {
  subscription?: {
    plan: string;
    status: string;
    currentPeriodEnd: string;
    tradeCount: number;
    maxTrades: number;
  };
  recentActivity: {
    trades: Array<{
      id: number;
      symbol: string;
      direction: string;
      entryDate: string;
      exitDate: string;
      pnl: number;
      percentChange: number;
      status: string;
      createdAt: string;
      broker: {
        name: string;
      };
    }>;
    notes: Array<{
      id: string;
      title: string;
      category: string | null;
      createdAt: string;
      updatedAt: string;
    }>;
  };
  tradingStats: {
    totalPnL: number;
    winningTrades: number;
    losingTrades: number;
    totalClosedTrades: number;
    winRate: number;
  };
}

export interface AdminStats {
  overview: {
    totalUsers: number;
    activeUsers: number;
    inactiveUsers: number;
    adminUsers: number;
    totalTrades: number;
    totalNotes: number;
    totalBrokers: number;
  };
  subscriptions: Record<string, number>;
  recentRegistrations: Array<{
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    createdAt: string;
  }>;
}

export interface UsersPagination {
  users: AdminUser[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    limit: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

class AdminAPI {
  private getAuthHeaders() {
    const token = sessionStorage.getItem('auth_token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }

  async getUsers(params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: 'all' | 'active' | 'inactive';
  } = {}): Promise<UsersPagination> {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.search) queryParams.append('search', params.search);
    if (params.status && params.status !== 'all') queryParams.append('status', params.status);

    const response = await fetch(`${API_BASE_URL}/admin/users?${queryParams}`, {
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch users: ${response.statusText}`);
    }

    return response.json();
  }

  async getUserDetail(userId: number): Promise<AdminUserDetail> {
    const response = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch user details: ${response.statusText}`);
    }

    const data = await response.json();
    return data.user ? { ...data.user, ...data } : data;
  }

  async updateUser(userId: number, updates: {
    isActive?: boolean;
    isAdmin?: boolean;
  }): Promise<AdminUser> {
    const response = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(updates)
    });

    if (!response.ok) {
      throw new Error(`Failed to update user: ${response.statusText}`);
    }

    const data = await response.json();
    return data.user;
  }

  async getStats(): Promise<AdminStats> {
    const response = await fetch(`${API_BASE_URL}/admin/stats`, {
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch admin stats: ${response.statusText}`);
    }

    return response.json();
  }

  // 🔥 NEW: Toggle email verification status
  async toggleEmailVerification(userId: number, emailVerified: boolean): Promise<{
    message: string;
    user: {
      id: number;
      email: string;
      emailVerified: boolean;
      updatedAt: string;
    };
  }> {
    const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/email-verification`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ emailVerified })
    });

    if (!response.ok) {
      throw new Error(`Failed to toggle email verification: ${response.statusText}`);
    }

    return response.json();
  }

  // 🔥 NEW: Toggle account status (suspend/activate)
  async toggleAccountStatus(userId: number, isActive: boolean): Promise<{
    message: string;
    user: {
      id: number;
      email: string;
      isActive: boolean;
      updatedAt: string;
    };
  }> {
    const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/account-status`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ isActive })
    });

    if (!response.ok) {
      throw new Error(`Failed to toggle account status: ${response.statusText}`);
    }

    return response.json();
  }

  // 🔥 NEW: Generate password reset token
  async resetPassword(userId: number): Promise<{
    message: string;
    user: {
      id: number;
      email: string;
      name: string;
    };
    resetToken: string;
    resetLink: string;
    expiresAt: string;
  }> {
    const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/reset-password`, {
      method: 'POST',
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error(`Failed to reset password: ${response.statusText}`);
    }

    return response.json();
  }

  // Reset user's trade count
  async resetUserTradeCount(userId: number): Promise<{
    success: boolean;
    message: string;
    resetData: {
      userId: number;
      userEmail: string;
      previousCount: number;
      newCount: number;
    };
  }> {
    const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/reset-trade-count`, {
      method: 'POST',
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to reset trade count');
    }

    return response.json();
  }
}

export const adminAPI = new AdminAPI();