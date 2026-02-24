import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { CrmClient } from '@/api/auth';

const TOKEN_KEY = '@crm_token';
const API_TOKEN_KEY = '@crm_api_token';

interface AuthState {
  token: string | null;
  apiToken: string | null;
  client: CrmClient | null;
  isLoading: boolean;
}

interface AuthContextValue extends AuthState {
  setAuth: (token: string, apiToken: string, client: CrmClient) => Promise<void>;
  clearAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setTokenState] = useState<string | null>(null);
  const [apiToken, setApiTokenState] = useState<string | null>(null);
  const [client, setClient] = useState<CrmClient | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [storedToken, storedApiToken] = await Promise.all([
          AsyncStorage.getItem(TOKEN_KEY),
          AsyncStorage.getItem(API_TOKEN_KEY),
        ]);
        if (storedToken) setTokenState(storedToken);
        if (storedApiToken) setApiTokenState(storedApiToken);
      } catch {
        // AsyncStorage unavailable (e.g. native module null in some environments)
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const setAuth = async (newToken: string, newApiToken: string, newClient: CrmClient) => {
    setTokenState(newToken);
    setApiTokenState(newApiToken);
    setClient(newClient);
    try {
      await Promise.all([
        AsyncStorage.setItem(TOKEN_KEY, newToken),
        AsyncStorage.setItem(API_TOKEN_KEY, newApiToken),
      ]);
    } catch {
      // AsyncStorage unavailable; in-memory state is still updated
    }
  };

  const clearAuth = async () => {
    setTokenState(null);
    setApiTokenState(null);
    setClient(null);
    try {
      await Promise.all([
        AsyncStorage.removeItem(TOKEN_KEY),
        AsyncStorage.removeItem(API_TOKEN_KEY),
      ]);
    } catch {
      // AsyncStorage unavailable; in-memory state is still updated
    }
  };

  const value: AuthContextValue = {
    token,
    apiToken,
    client,
    isLoading,
    setAuth,
    clearAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
