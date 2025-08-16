import { authService } from './authService';

interface TeacherDashboardStats {
  totalStudents: number;
  activeStudents: number;
  totalKnowledgePoints: number;
  totalQuizzes: number;
  monthlyPracticeSessions: number;
}

interface StatisticsResponse {
  success: boolean;
  data: TeacherDashboardStats;
  metadata?: {
    lastUpdated: string;
    period: {
      month: string;
      activeStudentsPeriod: string;
    };
  };
}

class StatisticsService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8718/v1';
  }

  private async fetchWithAuth(endpoint: string, options: RequestInit = {}) {
    const token = localStorage.getItem('jwt_token');
    if (!token) {
      throw new Error('Authentication token not found');
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Token expired, redirect to login
        authService.logout();
        throw new Error('Authentication expired');
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  async getTeacherDashboardStats(): Promise<TeacherDashboardStats> {
    try {
      const response: StatisticsResponse = await this.fetchWithAuth('/statistics/teacher-dashboard');
      
      if (!response.success) {
        throw new Error('Failed to fetch statistics');
      }

      return response.data;
    } catch (error) {
      console.error('Error fetching teacher dashboard statistics:', error);
      
      // Return default/fallback statistics for better UX
      return {
        totalStudents: 0,
        activeStudents: 0,
        totalKnowledgePoints: 0,
        totalQuizzes: 0,
        monthlyPracticeSessions: 0,
      };
    }
  }

  async getStudentStats() {
    try {
      return await this.fetchWithAuth('/statistics/students');
    } catch (error) {
      console.error('Error fetching student statistics:', error);
      return {
        success: false,
        data: { total: 0, active: 0, newThisMonth: 0 }
      };
    }
  }

  async getPracticeSessionStats() {
    try {
      return await this.fetchWithAuth('/statistics/practice-sessions');
    } catch (error) {
      console.error('Error fetching practice session statistics:', error);
      return {
        success: false,
        data: {
          thisMonth: { total: 0, completed: 0, abandoned: 0, averageScore: 0 },
          today: 0
        }
      };
    }
  }
}

export const statisticsService = new StatisticsService();