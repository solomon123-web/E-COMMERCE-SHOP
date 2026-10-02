import { createContext, useContext, useEffect, useMemo, useState } from 'react';

import type { User } from '../types';
import { apiFetch, getAuthenticatedUser } from '../lib/api';

type AuthContextValue = {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('lumora-token'));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadSession = async () => {
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const currentUser = await getAuthenticatedUser(token);
        setUser(currentUser);
      } catch (error) {
        localStorage.removeItem('lumora-token');
        localStorage.removeItem('lumora-user');
        setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    void loadSession();
  }, [token]);

  useEffect(() => {
    if (user) {
      localStorage.setItem('lumora-user', JSON.stringify(user));
    } else {
      localStorage.removeItem('lumora-user');
    }
  }, [user]);

  useEffect(() => {
    if (token) {
      localStorage.setItem('lumora-token', token);
    } else {
      localStorage.removeItem('lumora-token');
    }
  }, [token]);

  const login = async (email: string, password: string) => {
    const response = await apiFetch<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    setToken(response.token);
    setUser(response.user);
  };

  const register = async (name: string, email: string, password: string) => {
    const response = await apiFetch<{ token: string; user: User }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });

    setToken(response.token);
    setUser(response.user);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
  };

  const value = useMemo<AuthContextValue>(
    () => ({ user, token, isAuthenticated: Boolean(user), isLoading, login, register, logout }),
    [user, token, isLoading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
}
