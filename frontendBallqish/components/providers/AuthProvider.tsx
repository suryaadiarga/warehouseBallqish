'use client';

import api, {
  ApiEnvelope,
  clearAuthSession,
  getStoredToken,
  getStoredUser,
  storeAuthSession,
} from '@/lib/api';
import { AuthUser } from '@/lib/auth';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';

type LoginPayload = {
  email: string;
  password: string;
};

type LoginResult = {
  user: AuthUser;
  access_token: string;
  token_type: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isBootstrapping: boolean;
  login: (payload: LoginPayload) => Promise<AuthUser>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<AuthUser | null>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  useEffect(() => {
    const storedToken = getStoredToken();
    const storedUser = getStoredUser<AuthUser>();

    if (!storedToken) {
      setIsBootstrapping(false);
      return;
    }

    setToken(storedToken);
    if (storedUser) {
      setUser(storedUser);
    }

    api
      .get<ApiEnvelope<AuthUser>>('/me')
      .then((response) => {
        if (response.data.success) {
          setUser(response.data.data);
          storeAuthSession(storedToken, response.data.data);
        }
      })
      .catch(() => {
        clearAuthSession();
        setToken(null);
        setUser(null);
      })
      .finally(() => {
        setIsBootstrapping(false);
      });
  }, []);

  const login = async (payload: LoginPayload) => {
    const response = await api.post<ApiEnvelope<LoginResult>>('/login', payload);
    const result = response.data.data;

    storeAuthSession(result.access_token, result.user);
    setToken(result.access_token);
    setUser(result.user);

    return result.user;
  };

  const logout = async () => {
    try {
      await api.post('/logout');
    } finally {
      clearAuthSession();
      setUser(null);
      setToken(null);
    }
  };

  const refreshUser = async () => {
    if (!getStoredToken()) {
      setUser(null);
      setToken(null);
      return null;
    }

    const response = await api.get<ApiEnvelope<AuthUser>>('/me');
    const freshUser = response.data.data;
    const activeToken = getStoredToken();

    setUser(freshUser);
    setToken(activeToken);

    if (activeToken) {
      storeAuthSession(activeToken, freshUser);
    }

    return freshUser;
  };

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(token),
      isBootstrapping,
      login,
      logout,
      refreshUser,
    }),
    [user, token, isBootstrapping]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth harus dipakai di dalam AuthProvider.');
  }

  return context;
}
