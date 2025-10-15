import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthContextType } from '../types';
import { authAPI } from '../services/api';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.debug('[AuthProvider] initialization start');
    try {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      console.debug('[AuthProvider] localStorage read', {
        tokenPresent: Boolean(storedToken),
        userPresent: Boolean(storedUser),
      });

      if (storedToken) {
        // only show a short prefix to avoid leaking the whole token in logs
        console.debug('[AuthProvider] token prefix', storedToken.slice ? storedToken.slice(0, 6) + '...' : true);

        setToken(storedToken);
      }

      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser);
          console.debug('[AuthProvider] parsed stored user', { id: parsed?.id, role: parsed?.role });
          setUser(parsed);
        } catch (err) {
          // If parsing fails, clear the corrupted value and continue.
          console.warn('[AuthProvider] Failed to parse stored user from localStorage, clearing value.', err);
          localStorage.removeItem('user');
        }
      }
    } catch (err) {
      // Defensive: if reading localStorage itself throws (e.g. blocked), log and continue.
      console.error('[AuthProvider] Error reading auth from localStorage', err);
    } finally {
      setLoading(false);
      console.debug('[AuthProvider] initialization complete', { loading: false });
    }
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    console.debug('[AuthProvider] login start', { email });
    try {
      const response = await authAPI.login(email, password);
      console.debug('[AuthProvider] login response', { status: response?.status });
      const payload = response?.data?.data;

      if (!payload || !payload.token || !payload.user) {
        // Defensive: if API response shape is unexpected, surface a clear error.
        throw new Error('Invalid login response from server');
      }

      const newToken = payload.token;
      const newUser = payload.user;

      setToken(newToken);
      setUser(newUser);
      try {
        localStorage.setItem('token', newToken);
        localStorage.setItem('user', JSON.stringify(newUser));
        console.debug('[AuthProvider] login persisted to localStorage', { tokenPrefix: newToken.slice ? newToken.slice(0, 6) + '...' : true });
      } catch (err) {
        // If localStorage is unavailable, continue but log.
        console.warn('[AuthProvider] Unable to persist auth to localStorage', err);
      }
      console.debug('[AuthProvider] login complete', { userId: newUser?.id, role: newUser?.role });
    } catch (error: any) {
      // Normalise and rethrow so callers (UI) can show messages.
      const message = error?.response?.data?.message || error?.message || 'Login failed';
      console.error('[AuthProvider] Login error:', message, error);
      throw new Error(message);
    }
  };

  const register = async (name: string, email: string, password: string, role: 'student' | 'recruiter'): Promise<void> => {
    console.debug('[AuthProvider] register start', { name, email, role });
    try {
      const response = await authAPI.register(name, email, password, role);
      console.debug('[AuthProvider] register response', { status: response?.status });
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || 'Registration failed';
      console.error('[AuthProvider] Registration error:', message, error);
      throw new Error(message);
    }
  };

  const logout = (): void => {
    console.debug('[AuthProvider] logout');
    setUser(null);
    setToken(null);
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    } catch (err) {
      console.warn('[AuthProvider] Failed to clear localStorage during logout', err);
    }
  };

  const value: AuthContextType = {
    user,
    token,
    login,
    register,
    logout,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
