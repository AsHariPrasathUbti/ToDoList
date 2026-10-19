import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Request interceptor: Attach JWT token if stored
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('taskflow_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: Extract clean error messages and handle 401
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !error.config?.url?.includes('/auth/login')) {
      // Clear token on 401 unauthorized
      localStorage.removeItem('taskflow_token');
      localStorage.removeItem('taskflow_user');
      // Trigger a custom event or allow AuthContext to react
      window.dispatchEvent(new Event('auth:unauthorized'));
    }
    
    // Provide a standardized error message
    let message = 'An unexpected error occurred. Please try again.';
    if (error.response?.data?.detail) {
      if (typeof error.response.data.detail === 'string') {
        message = error.response.data.detail;
      } else if (Array.isArray(error.response.data.detail)) {
        // Pydantic validation errors list
        message = error.response.data.detail
          .map((err: { msg?: string; loc?: string[] }) => `${err.loc?.slice(-1)[0] || 'Field'}: ${err.msg}`)
          .join(', ');
      }
    } else if (error.message === 'Network Error') {
      message = 'Unable to connect to the backend server. Please verify FastAPI is running.';
    }

    return Promise.reject(new Error(message));
  }
);

export default apiClient;
