import axios from 'axios';

const getBaseURL = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:3000';
  }
  
  return 'https://credit-unionapi.onrender.com';
};

const API_CONFIG = {
  BASE_URL: getBaseURL(),
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000
};

console.log('🌐 API Base URL:', API_CONFIG.BASE_URL);

const api = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  timeout: API_CONFIG.TIMEOUT
});

const AUTH_KEY = 'nfcu_auth';

const authStorage = {
  get: () => {
    try {
      const data = sessionStorage.getItem(AUTH_KEY);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Auth storage get error:', error);
      return null;
    }
  },
  set: (data) => {
    try {
      sessionStorage.setItem(AUTH_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Auth storage set error:', error);
    }
  },
  clear: () => {
    try {
      sessionStorage.removeItem(AUTH_KEY);
    } catch (error) {
      console.error('Auth storage clear error:', error);
    }
  }
};

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.request.use(
  (config) => {
    config.retryCount = config.retryCount || 0;
    
    const authData = authStorage.get();
    if (authData?.token) {
      config.headers['Authorization'] = `Bearer ${authData.token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.code === 'ECONNABORTED' || (error.response && error.response.status >= 500)) {
      if (originalRequest.retryCount < API_CONFIG.RETRY_ATTEMPTS) {
        originalRequest.retryCount += 1;
        
        const delay = API_CONFIG.RETRY_DELAY * Math.pow(2, originalRequest.retryCount - 1);
        
        return new Promise(resolve => {
          setTimeout(() => resolve(api(originalRequest)), delay);
        });
      }
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        try {
          const token = await new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          });
          originalRequest.headers['Authorization'] = `Bearer ${token}`;
          return api(originalRequest);
        } catch (err) {
          return Promise.reject(err);
        }
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const authData = authStorage.get();
        if (!authData?.refreshToken) {
          throw new Error('No refresh token available');
        }

        const response = await api.post('/api/auth/refresh', {
          refreshToken: authData.refreshToken
        });

        const { token, refreshToken } = response.data;

        authStorage.set({
          ...authData,
          token,
          refreshToken
        });

        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        originalRequest.headers['Authorization'] = `Bearer ${token}`;

        processQueue(null, token);
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        authStorage.clear();
        
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    if (error.response?.status === 404) {
      console.warn(`Resource not found: ${originalRequest.url}`);
      return Promise.reject({
        ...error,
        message: 'The requested resource was not found'
      });
    }

    return Promise.reject(error);
  }
);

export const API_BASE_URL = API_CONFIG.BASE_URL;
export { api as default, API_CONFIG, authStorage };