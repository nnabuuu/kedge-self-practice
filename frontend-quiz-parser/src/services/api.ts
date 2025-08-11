// API configuration and utilities
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8718/api/v1';

// Store JWT token in memory (you might want to use localStorage in production)
let authToken: string | null = null;

export const setAuthToken = (token: string) => {
  authToken = token;
};

export const getAuthToken = () => authToken;

export const clearAuthToken = () => {
  authToken = null;
};

// Base fetch wrapper with authentication
export const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const headers: HeadersInit = {
    ...options.headers,
  };
  
  // Add auth token if available
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }
  
  // Add content-type for JSON requests
  if (options.body && typeof options.body === 'string') {
    headers['Content-Type'] = 'application/json';
  }
  
  const response = await fetch(url, {
    ...options,
    headers,
  });
  
  if (!response.ok) {
    // Handle authentication errors
    if (response.status === 401) {
      clearAuthToken();
      throw new Error('Authentication required. Please login.');
    }
    
    // Try to get error message from response
    let errorMessage = `Request failed: ${response.statusText}`;
    try {
      const errorData = await response.json();
      if (errorData.message) {
        errorMessage = errorData.message;
      }
    } catch {
      // Ignore JSON parsing errors
    }
    
    throw new Error(errorMessage);
  }
  
  return response;
};

// Authentication APIs
export const login = async (email: string, password: string) => {
  const response = await apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  
  const data = await response.json();
  if (data.token) {
    setAuthToken(data.token);
  }
  return data;
};

export const register = async (email: string, password: string, role: 'student' | 'teacher' = 'teacher') => {
  const response = await apiFetch('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, role }),
  });
  
  const data = await response.json();
  if (data.token) {
    setAuthToken(data.token);
  }
  return data;
};