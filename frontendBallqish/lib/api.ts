import axios from 'axios';
import { buildLoginRedirectPath } from '@/lib/auth';

export type ApiEnvelope<T> = {
  success: boolean;
  message: string;
  data: T;
  meta?: Record<string, unknown>;
  errors?: Record<string, string[]>;
};

const TOKEN_KEY = 'token';
const USER_KEY = 'user';
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? '/api';

export function resolveApiAssetUrl(path?: string | null) {
  const fallback = `${API_BASE_URL.replace(/\/api\/?$/, '')}/product-images/default-product.webp`;

  if (!path) {
    return fallback;
  }

  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  return `${API_BASE_URL.replace(/\/api\/?$/, '')}${path.startsWith('/') ? path : `/${path}`}`;
}

export function getStoredToken() {
  if (typeof window === 'undefined') {
    return null;
  }

  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser<T>() {
  if (typeof window === 'undefined') {
    return null;
  }

  const raw = localStorage.getItem(USER_KEY);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    localStorage.removeItem(USER_KEY);
    return null;
  }
}

export function storeAuthSession(token: string, user: unknown) {
  if (typeof window === 'undefined') {
    return;
  }

  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearAuthSession() {
  if (typeof window === 'undefined') {
    return;
  }

  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function extractApiErrorMessage(error: unknown, fallback = 'Terjadi kesalahan saat terhubung ke server.') {
  if (axios.isAxiosError<ApiEnvelope<unknown>>(error)) {
    const payload = error.response?.data;

    if (payload?.errors) {
      const firstError = Object.values(payload.errors)[0]?.[0];
      if (firstError) {
        return firstError;
      }
    }

    if (payload?.message) {
      return payload.message;
    }

    if (error.message) {
      return error.message;
    }
  }

  return fallback;
}

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = getStoredToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearAuthSession();

      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.href = buildLoginRedirectPath(window.location.pathname, window.location.search);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
