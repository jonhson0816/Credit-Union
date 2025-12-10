import React, { createContext, useReducer, useContext, useCallback, useEffect } from 'react';
import axios from 'axios';

const AUTH_KEY = 'nfcu_auth';

const getEnvVar = (key, defaultValue) => {
  if (typeof window !== 'undefined' && import.meta?.env) {
    return import.meta.env[key] || defaultValue;
  }
  return defaultValue;
};

const authStorage = {
  get: () => {
    try {
      const data = sessionStorage.getItem(AUTH_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
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

const initialState = {
  user: authStorage.get()?.user || null,
  token: authStorage.get()?.token || null,
  refreshToken: authStorage.get()?.refreshToken || null,
  isAuthenticated: !!authStorage.get()?.token,
  isLoading: false,
  error: null
};

const ACTION_TYPES = {
  AUTH_START: 'AUTH_START',
  AUTH_SUCCESS: 'AUTH_SUCCESS',
  AUTH_FAILURE: 'AUTH_FAILURE',
  LOGOUT: 'LOGOUT',
  CLEAR_ERROR: 'CLEAR_ERROR',
  RESTORE_SESSION: 'RESTORE_SESSION',
  UPDATE_USER: 'UPDATE_USER',
  REFRESH_TOKEN: 'REFRESH_TOKEN'
};

const authReducer = (state, action) => {
  switch (action.type) {
    case ACTION_TYPES.AUTH_START:
      return {
        ...state,
        isLoading: true,
        error: null
      };

    case ACTION_TYPES.AUTH_SUCCESS:
      authStorage.set({
        token: action.payload.token,
        refreshToken: action.payload.refreshToken,
        user: action.payload.user
      });
      return {
        ...state,
        isAuthenticated: true,
        isLoading: false,
        user: action.payload.user,
        token: action.payload.token,
        refreshToken: action.payload.refreshToken,
        error: null
      };

    case ACTION_TYPES.AUTH_FAILURE:
      authStorage.clear();
      return {
        ...state,
        isAuthenticated: false,
        isLoading: false,
        user: null,
        token: null,
        refreshToken: null,
        error: action.payload
      };

    case ACTION_TYPES.LOGOUT:
      authStorage.clear();
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        token: null,
        refreshToken: null,
        isLoading: false,
        error: null
      };

    case ACTION_TYPES.CLEAR_ERROR:
      return {
        ...state,
        error: null
      };

    case ACTION_TYPES.RESTORE_SESSION:
      return {
        ...state,
        isLoading: false,
        isAuthenticated: action.payload.isAuthenticated,
        user: action.payload.user,
        token: action.payload.token,
        refreshToken: action.payload.refreshToken
      };

    case ACTION_TYPES.UPDATE_USER:
      const updatedStorage = authStorage.get();
      authStorage.set({
        ...updatedStorage,
        user: action.payload
      });
      return {
        ...state,
        user: action.payload
      };

    case ACTION_TYPES.REFRESH_TOKEN:
      const currentStorage = authStorage.get();
      authStorage.set({
        ...currentStorage,
        token: action.payload.token,
        refreshToken: action.payload.refreshToken
      });
      return {
        ...state,
        token: action.payload.token,
        refreshToken: action.payload.refreshToken
      };

    default:
      return state;
  }
};

const AuthContext = createContext();

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

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  const authAxios = axios.create({
    baseURL: getEnvVar('VITE_API_URL', 'https://credit-unionapi.onrender.com/api'),
    headers: {
      'Content-Type': 'application/json'
    },
    withCredentials: true,
    timeout: 10000
  });

  // Add token to all requests
  authAxios.interceptors.request.use(
    config => {
      if (state.token) {
        config.headers['Authorization'] = `Bearer ${state.token}`;
      }
      return config;
    },
    error => Promise.reject(error)
  );

  // Handle response interceptor with refresh token logic
  authAxios.interceptors.response.use(
    response => response,
    async error => {
      const originalRequest = error.config;

      if (!error.response || error.response.status !== 401 || originalRequest._retry) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        try {
          const token = await new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          });
          originalRequest.headers['Authorization'] = `Bearer ${token}`;
          return authAxios(originalRequest);
        } catch (err) {
          return Promise.reject(err);
        }
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        if (!state.refreshToken) {
          throw new Error('No refresh token available');
        }

        const response = await authAxios.post('/auth/refresh-token', {
          refreshToken: state.refreshToken
        });

        const { token, refreshToken } = response.data;

        dispatch({
          type: ACTION_TYPES.REFRESH_TOKEN,
          payload: { token, refreshToken }
        });

        originalRequest.headers['Authorization'] = `Bearer ${token}`;
        processQueue(null, token);
        return authAxios(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        dispatch({ type: ACTION_TYPES.LOGOUT });
        throw refreshError;
      } finally {
        isRefreshing = false;
      }
    }
  );

  const login = useCallback(async (email, password) => {
    try {
      dispatch({ type: ACTION_TYPES.AUTH_START });
      
      const response = await authAxios.post('/auth/login', {
        email: email.trim().toLowerCase(),
        password
      });

      dispatch({
        type: ACTION_TYPES.AUTH_SUCCESS,
        payload: {
          user: response.data.user,
          token: response.data.token,
          refreshToken: response.data.refreshToken
        }
      });

      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Login failed';
      dispatch({
        type: ACTION_TYPES.AUTH_FAILURE,
        payload: errorMessage
      });
      throw error;
    }
  }, []);

  const register = useCallback(async (userData) => {
    try {
      dispatch({ type: ACTION_TYPES.AUTH_START });
      
      const response = await authAxios.post('/auth/register', {
        ...userData,
        email: userData.email.trim().toLowerCase()
      });

      dispatch({
        type: ACTION_TYPES.AUTH_SUCCESS,
        payload: {
          user: response.data.user,
          token: response.data.token,
          refreshToken: response.data.refreshToken
        }
      });

      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Registration failed';
      dispatch({
        type: ACTION_TYPES.AUTH_FAILURE,
        payload: errorMessage
      });
      throw error;
    }
  }, []);

  const logout = useCallback(() => {
    dispatch({ type: ACTION_TYPES.LOGOUT });
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: ACTION_TYPES.CLEAR_ERROR });
  }, []);

  // Session restoration
  useEffect(() => {
    const restoreSession = async () => {
      const authData = authStorage.get();
      
      if (authData?.token) {
        try {
          // Verify token validity
          await authAxios.get('/auth/verify-token');
          
          dispatch({
            type: ACTION_TYPES.RESTORE_SESSION,
            payload: {
              isAuthenticated: true,
              user: authData.user,
              token: authData.token,
              refreshToken: authData.refreshToken
            }
          });
        } catch (error) {
          // Only attempt refresh if error is due to token expiration
          if (error.response?.status === 401) {
            try {
              const response = await authAxios.post('/auth/refresh-token', {
                refreshToken: authData.refreshToken
              });
              
              dispatch({
                type: ACTION_TYPES.AUTH_SUCCESS,
                payload: {
                  user: authData.user,
                  token: response.data.token,
                  refreshToken: response.data.refreshToken
                }
              });
            } catch (refreshError) {
              console.error('Session restoration failed:', refreshError);
              dispatch({ type: ACTION_TYPES.LOGOUT });
            }
          } else {
            console.error('Token verification failed:', error);
            dispatch({ type: ACTION_TYPES.LOGOUT });
          }
        }
      }
    };

    restoreSession();
  }, []);

  const contextValue = {
    ...state,
    register,
    login,
    logout,
    clearError,
    authAxios
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthProvider;