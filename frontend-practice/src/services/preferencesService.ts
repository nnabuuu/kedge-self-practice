interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

interface UserPreferences {
  lastAccessedSubject?: string;
  uiSettings?: {
    theme?: 'light' | 'dark';
    language?: string;
  };
  quizSettings?: {
    autoAdvanceDelay?: number;
    shuffleQuestions?: boolean;
    showExplanation?: boolean;
  };
  [key: string]: any;
}

const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8718';
const API_BASE_URL = baseUrl.endsWith('/v1') ? baseUrl : `${baseUrl}/v1`;

class PreferencesService {
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

  async getPreferences(): Promise<UserPreferences> {
    const response = await this.makeRequest<{ preferences: UserPreferences }>('/auth/preferences');
    return response.data?.preferences || {};
  }

  async updatePreferences(preferences: UserPreferences): Promise<boolean> {
    const response = await this.makeRequest('/auth/preferences', {
      method: 'PUT',
      body: JSON.stringify({ preferences }),
    });
    return response.success;
  }

  async updatePreference(key: string, value: any): Promise<boolean> {
    const response = await this.makeRequest(`/auth/preferences/${key}`, {
      method: 'PUT',
      body: JSON.stringify({ value }),
    });
    return response.success;
  }

  // Convenience methods for specific preferences
  async getLastAccessedSubject(): Promise<string | null> {
    const preferences = await this.getPreferences();
    return preferences.lastAccessedSubject || null;
  }

  async setLastAccessedSubject(subjectId: string): Promise<boolean> {
    return this.updatePreference('lastAccessedSubject', subjectId);
  }

  async getQuizSettings(): Promise<UserPreferences['quizSettings']> {
    const preferences = await this.getPreferences();
    return preferences.quizSettings || {
      autoAdvanceDelay: 3,
      shuffleQuestions: true,
      showExplanation: true
    };
  }

  async updateQuizSettings(settings: Partial<UserPreferences['quizSettings']>): Promise<boolean> {
    const current = await this.getQuizSettings();
    return this.updatePreference('quizSettings', { ...current, ...settings });
  }
}

export const preferencesService = new PreferencesService();
export type { UserPreferences };