import axios from 'axios';

const AUTH_API_URL = import.meta.env.VITE_AUTH_API_URL || 'http://localhost:8080';
const WASH_API_URL = import.meta.env.VITE_WASH_API_URL || 'http://localhost:8082';
const CLIENT_ID = import.meta.env.VITE_CLIENT_ID || '';

let accessToken = null;

export function setAccessToken(token) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

// Auth client (login, register, refresh)
export const authClient = axios.create({
  baseURL: AUTH_API_URL,
  withCredentials: true,
});

// Main API client for wash-service
export const apiClient = axios.create({
  baseURL: WASH_API_URL,
  withCredentials: true,
});

// Public client (no auth required, sends X-Client-ID)
export const publicClient = axios.create({
  baseURL: WASH_API_URL,
});

publicClient.interceptors.request.use((config) => {
  if (CLIENT_ID) {
    config.headers['X-Client-ID'] = CLIENT_ID;
  }
  return config;
});

// Attach token to apiClient requests
apiClient.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers['Authorization'] = `Bearer ${accessToken}`;
  }
  if (CLIENT_ID) {
    config.headers['X-Client-ID'] = CLIENT_ID;
  }
  return config;
});

// Setup 401 interceptor for auto-refresh
export function setupInterceptors(refreshFn, logoutFn) {
  apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;

      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;
        try {
          const newToken = await refreshFn();
          if (newToken) {
            originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
            return apiClient(originalRequest);
          }
        } catch (refreshError) {
          logoutFn();
          return Promise.reject(refreshError);
        }
      }

      return Promise.reject(error);
    }
  );
}
