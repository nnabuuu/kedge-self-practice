interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

interface LoginRequest {
  email: string;
  password: string;
}

interface LoginResponse {
  token: string;
  user: {
    id: string;
    account_id?: string;  // Backend uses account_id instead of email
    email?: string;       // Keep for compatibility
    name?: string;
    role?: 'student' | 'teacher' | 'admin';
    isAdmin?: boolean;    // Admin flag
    created_at?: string;
    updated_at?: string;
  };
}

interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  role: 'student' | 'teacher';
}

// Direct connection to backend - add /v1 if not already present
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.endsWith('/v1')
  ? import.meta.env.VITE_API_BASE_URL
  : `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8718'}/v1`;

class AuthService {
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('jwt_token');
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  }

  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    try {
      const url = `${API_BASE_URL}${endpoint}`;
      const response = await fetch(url, {
        ...options,
        headers: {
          ...this.getAuthHeaders(),
          ...options.headers,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.message || `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      return {
        success: true,
        data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error occurred',
      };
    }
  }

  async login(credentials: LoginRequest): Promise<ApiResponse<LoginResponse>> {
    const response = await this.makeRequest<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    if (response.success && response.data?.token) {
      const token = response.data.token;
      localStorage.setItem('jwt_token', token);
      
      // Extract role from JWT token payload
      try {
        const tokenPayload = JSON.parse(atob(token.split('.')[1]));
        
        const userWithRole = {
          ...response.data.user,
          role: tokenPayload.role || response.data.user.role,
          email: response.data.user.account_id || response.data.user.email || tokenPayload.email || credentials.email,
          name: response.data.user.name || tokenPayload.name || tokenPayload.userName || 'User',
          id: response.data.user.id || tokenPayload.sub || tokenPayload.userId
        };
        localStorage.setItem('user_data', JSON.stringify(userWithRole));
        
        // Update response data to include the role
        response.data.user = userWithRole;
      } catch (error) {
        console.error('Failed to decode JWT token:', error);
        // Still try to use what we have from the response
        const fallbackUser = {
          ...response.data.user,
          name: response.data.user.name || credentials.email.split('@')[0] || 'User'
        };
        localStorage.setItem('user_data', JSON.stringify(fallbackUser));
        response.data.user = fallbackUser;
      }

      // Fetch and cache quick options availability after successful login
      this.fetchAndCacheQuickOptionsAvailability();
    }

    return response;
  }

  async register(userData: RegisterRequest): Promise<ApiResponse<LoginResponse>> {
    const response = await this.makeRequest<LoginResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });

    if (response.success && response.data?.token) {
      const token = response.data.token;
      localStorage.setItem('jwt_token', token);
      
      // Normalize user data for consistent handling
      const normalizedUser = {
        ...response.data.user,
        email: response.data.user.account_id || response.data.user.email || userData.email,
        name: response.data.user.name || userData.name,
        role: response.data.user.role || userData.role
      };
      localStorage.setItem('user_data', JSON.stringify(normalizedUser));
      
      // Update response data
      response.data.user = normalizedUser;

      // Fetch and cache quick options availability after successful registration
      this.fetchAndCacheQuickOptionsAvailability();
    }

    return response;
  }

  async getUserProfile(): Promise<ApiResponse<any>> {
    const token = this.getToken();
    if (!token) {
      return {
        success: false,
        error: 'No authentication token found'
      };
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/profile`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Update stored user data with fresh profile including preferences
      if (data.success && data.data) {
        const currentUser = this.getCurrentUser();
        const updatedUser = {
          ...currentUser,
          ...data.data,
          name: data.data.name || data.data.username || currentUser?.email?.split('@')[0] || 'User',
          preferences: data.data.preferences || {}
        };
        localStorage.setItem('user_data', JSON.stringify(updatedUser));
        
        return {
          success: true,
          data: updatedUser
        };
      }
      
      return data;
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch profile'
      };
    }
  }

  async updatePreferences(preferences: Record<string, any>): Promise<ApiResponse<any>> {
    return this.makeRequest('/auth/preferences', {
      method: 'PUT',
      body: JSON.stringify({ preferences })
    });
  }

  async updatePreference(key: string, value: any): Promise<ApiResponse<any>> {
    return this.makeRequest(`/auth/preferences/${key}`, {
      method: 'PUT',
      body: JSON.stringify({ value })
    });
  }

  logout(): void {
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('user_data');
    localStorage.removeItem('quick_options_availability');
  }

  getCurrentUser(): any | null {
    const userData = localStorage.getItem('user_data');
    return userData ? JSON.parse(userData) : null;
  }

  getToken(): string | null {
    return localStorage.getItem('jwt_token');
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  // Fetch and cache quick options availability
  async fetchAndCacheQuickOptionsAvailability(): Promise<void> {
    try {
      const token = this.getToken();
      if (!token) return;

      const response = await fetch(`${API_BASE_URL}/practice/quick-options-availability`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        // Cache with timestamp for potential future expiry logic
        const cacheData = {
          data: data,
          timestamp: Date.now()
        };
        localStorage.setItem('quick_options_availability', JSON.stringify(cacheData));
      }
    } catch (error) {
      console.error('Failed to fetch quick options availability:', error);
      // Non-critical failure, don't block login flow
    }
  }

  // Get cached quick options availability
  getCachedQuickOptionsAvailability(): any | null {
    const cached = localStorage.getItem('quick_options_availability');
    if (!cached) return null;

    try {
      const cacheData = JSON.parse(cached);
      // Optional: Add cache expiry logic here if needed
      // For now, return cached data as-is
      return cacheData.data;
    } catch (error) {
      console.error('Failed to parse cached quick options:', error);
      return null;
    }
  }

  // Share token with other frontend applications
  shareTokenWithQuizParser(): void {
    const token = this.getToken();
    const userData = this.getCurrentUser();
    
    if (token && userData) {
      // Store shared authentication data
      localStorage.setItem('shared_jwt_token', token);
      localStorage.setItem('shared_user_data', JSON.stringify(userData));
    }
  }

  // Navigate to quiz parser with shared token
  navigateToQuizParser(): void {
    const token = this.getToken();
    const userData = this.getCurrentUser();
    
    if (token && userData?.role === 'teacher') {
      this.shareTokenWithQuizParser();
      
      // Open quiz parser in new tab with token and user data parameters
      // Note: localStorage is not shared across different ports, so we pass user data via URL
      const params = new URLSearchParams({
        token: token,
        user: JSON.stringify({
          name: userData.name || 'Teacher',
          email: userData.email || userData.account_id,
          role: userData.role
        })
      });
      
      // Use environment variable for quiz parser URL, fallback to localhost:5174
      const baseUrl = import.meta.env.VITE_QUIZ_PARSER_URL || 'http://localhost:5174';
      const quizParserUrl = `${baseUrl}/?${params.toString()}`;
      window.open(quizParserUrl, '_blank');
    }
  }

  // Admin user management methods
  async adminCreateUser(userData: {
    email: string;
    password: string;
    name: string;
    role: 'student' | 'teacher' | 'admin';
    class?: string;
  }): Promise<ApiResponse<any>> {
    // Convert email field to account field for backend compatibility
    const formattedData = {
      account: String(userData.email), // Backend expects 'account' not 'email'
      password: String(userData.password),
      name: String(userData.name),
      role: userData.role,
      class: userData.class ? String(userData.class) : undefined
    };
    
    // This method does NOT log in as the new user - it just creates them
    return await this.makeRequest('/admin/users', {
      method: 'POST',
      body: JSON.stringify(formattedData),
    });
  }

  async adminBulkCreateUsers(users: Array<{
    email: string;
    password: string;
    name: string;
    role: 'student' | 'teacher' | 'admin';
    class?: string;
  }>): Promise<ApiResponse<any>> {
    // Convert email field to account field for backend compatibility
    const formattedUsers = users.map(user => ({
      account: String(user.email), // Backend expects 'account' not 'email', ensure it's a string
      password: String(user.password),
      name: String(user.name),
      role: user.role,
      class: user.class ? String(user.class) : undefined
    }));
    
    // Bulk create users without changing the current session
    return await this.makeRequest('/admin/users/bulk', {
      method: 'POST',
      body: JSON.stringify(formattedUsers),
    });
  }

  async getAllUsers(params?: { 
    search?: string; 
    role?: string; 
    page?: number; 
    limit?: number; 
  }): Promise<ApiResponse<any[]> & { 
    pagination?: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }> {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.role) queryParams.append('role', params.role);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    
    const queryString = queryParams.toString();
    const url = '/admin/users' + (queryString ? `?${queryString}` : '');
    
    const response = await this.makeRequest<any>(url, {
      method: 'GET',
      headers: this.getAuthHeaders()
    });

    // The backend returns { success: true, data: [...], pagination: {...} }
    // But makeRequest wraps it as { success: true, data: { success: true, data: [...], pagination: {...} } }
    // So we need to unwrap it properly
    if (response.success && response.data) {
      const backendResponse = response.data as any;
      return {
        success: backendResponse.success,
        data: backendResponse.data,
        pagination: backendResponse.pagination
      };
    }
    
    return response as any;
  }

  async updateUserPassword(userId: string, newPassword: string): Promise<ApiResponse> {
    return this.makeRequest('/admin/users/' + userId + '/password', {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ password: newPassword })
    });
  }

  async deleteUser(userId: string): Promise<ApiResponse> {
    return this.makeRequest('/admin/users/' + userId, {
      method: 'DELETE',
      headers: this.getAuthHeaders()
    });
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<ApiResponse> {
    return this.makeRequest('/auth/change-password', {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ currentPassword, newPassword })
    });
  }
}

export const authService = new AuthService();