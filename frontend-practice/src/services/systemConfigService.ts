// Use consistent API base URL with other services
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.endsWith('/v1')
  ? import.meta.env.VITE_API_BASE_URL
  : `${import.meta.env.VITE_API_BASE_URL || '/api'}/v1`;

export interface SystemConfig {
  key: string;
  value: {
    enabled: boolean;
  };
  description?: string;
  updatedAt?: string;
}

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

class SystemConfigService {
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('jwt_token');
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  }

  async getConfig(key: string): Promise<SystemConfig | null> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/system-config/${key}`,
        {
          method: 'GET',
          headers: this.getAuthHeaders()
        }
      );
      
      const data: ApiResponse<SystemConfig> = await response.json();
      
      if (data.success && data.data) {
        return data.data;
      }
      return null;
    } catch (error) {
      console.error('Failed to get system config:', error);
      // Return default value for demo accounts visibility
      if (key === 'show_demo_accounts') {
        return {
          key: 'show_demo_accounts',
          value: { enabled: true },
          description: 'Whether to show demo account quick login buttons'
        };
      }
      return null;
    }
  }

  async updateConfig(key: string, value: { enabled: boolean }): Promise<boolean> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/system-config/${key}`,
        {
          method: 'PUT',
          headers: this.getAuthHeaders(),
          body: JSON.stringify({ value })
        }
      );
      
      const data: ApiResponse = await response.json();
      return data.success === true;
    } catch (error) {
      console.error('Failed to update system config:', error);
      return false;
    }
  }

  async getAllConfigs(): Promise<SystemConfig[]> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/system-config`,
        {
          method: 'GET',
          headers: this.getAuthHeaders()
        }
      );
      
      const data: ApiResponse<SystemConfig[]> = await response.json();
      
      if (data.success && data.data) {
        return data.data;
      }
      return [];
    } catch (error) {
      console.error('Failed to get all system configs:', error);
      return [];
    }
  }

  // Check if demo accounts should be shown (public method, no auth required)
  async shouldShowDemoAccounts(): Promise<boolean> {
    try {
      // This endpoint doesn't require authentication
      const response = await fetch(
        `${API_BASE_URL}/system-config/show_demo_accounts`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      // Check if response is ok
      if (!response.ok) {
        // If backend is not available or endpoint doesn't exist, default to true
        return true;
      }

      const data: ApiResponse<SystemConfig> = await response.json();

      if (data.success && data.data?.value?.enabled !== undefined) {
        return data.data.value.enabled;
      }
      // Default to true if config not found
      return true;
    } catch (error) {
      // Network error or backend not running - default to true on error (for development convenience)
      return true;
    }
  }
}

export const systemConfigService = new SystemConfigService();