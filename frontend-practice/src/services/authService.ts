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
  access_token: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: 'student' | 'teacher' | 'admin';
  };
}

interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  role: 'student' | 'teacher';
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8718/api/v1';

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

    if (response.success && response.data?.access_token) {
      localStorage.setItem('jwt_token', response.data.access_token);
      localStorage.setItem('user_data', JSON.stringify(response.data.user));
    }

    return response;
  }

  async register(userData: RegisterRequest): Promise<ApiResponse<LoginResponse>> {
    const response = await this.makeRequest<LoginResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });

    if (response.success && response.data?.access_token) {
      localStorage.setItem('jwt_token', response.data.access_token);
      localStorage.setItem('user_data', JSON.stringify(response.data.user));
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
      
      // Open quiz parser in new tab with token parameter
      const quizParserUrl = 'http://localhost:5173/?token=' + encodeURIComponent(token);
      window.open(quizParserUrl, '_blank');
    }
  }
}

export const authService = new AuthService();