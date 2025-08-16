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

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8718/v1';

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
          role: tokenPayload.role,
          email: response.data.user.account_id || response.data.user.email || credentials.email,
          name: response.data.user.name || 'User'
        };
        localStorage.setItem('user_data', JSON.stringify(userWithRole));
        
        // Update response data to include the role
        response.data.user = userWithRole;
      } catch (error) {
        console.error('Failed to decode JWT token:', error);
        localStorage.setItem('user_data', JSON.stringify(response.data.user));
      }
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
    }

    return response;
  }

  logout(): void {
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('user_data');
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
      
      // Try port 5174 first (common Vite dev server port when 5173 is taken)
      const quizParserUrl = `http://localhost:5174/?${params.toString()}`;
      window.open(quizParserUrl, '_blank');
    }
  }
}

export const authService = new AuthService();