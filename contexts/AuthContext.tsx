import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

import type { CrmClient } from '@/api/auth';
import { setUnauthorizedHandler } from '@/api/session';
import { LOGIN_PATH } from '@/constants/authRoutes';

const TOKEN_KEY = '@crm_token';
const API_TOKEN_KEY = '@crm_api_token';
const CLIENT_KEY = '@crm_client';

interface AuthState {
  token: string | null;
  apiToken: string | null;
  client: CrmClient | null;
  isLoading: boolean;
}

interface AuthContextValue extends AuthState {
  setAuth: (token: string, apiToken: string, client: CrmClient) => Promise<void>;
  clearAuth: () => Promise<void>;
  signOutToLogin: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setTokenState] = useState<string | null>(null);
  const [apiToken, setApiTokenState] = useState<string | null>(null);
  const [client, setClient] = useState<CrmClient | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const clearAuth = useCallback(async () => {
    setTokenState(null);
    setApiTokenState(null);
    setClient(null);
    try {
      await Promise.all([
        AsyncStorage.removeItem(TOKEN_KEY),
        AsyncStorage.removeItem(API_TOKEN_KEY),
        AsyncStorage.removeItem(CLIENT_KEY),
      ]);
    } catch {
      // AsyncStorage unavailable; in-memory state is still updated
    }
  }, []);

  const signOutToLogin = useCallback(async () => {
    await clearAuth();
    router.replace(LOGIN_PATH);
  }, [clearAuth]);

  useEffect(() => {
    const load = async () => {
      try {
        const [storedToken, storedApiToken, storedClient] = await Promise.all([
          AsyncStorage.getItem(TOKEN_KEY),
          AsyncStorage.getItem(API_TOKEN_KEY),
          AsyncStorage.getItem(CLIENT_KEY),
        ]);
        if (storedToken) setTokenState(storedToken);
        if (storedApiToken) setApiTokenState(storedApiToken);
        if (storedClient) {
          try {
            setClient(JSON.parse(storedClient));
          } catch {
            /* ignore */
          }
        }
      } catch {
        // AsyncStorage unavailable (e.g. native module null in some environments)
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      signOutToLogin().catch(() => {});
    });
    return () => setUnauthorizedHandler(null);
  }, [signOutToLogin]);

  const setAuth = async (newToken: string, newApiToken: string, newClient: CrmClient) => {
    setTokenState(newToken);
    setApiTokenState(newApiToken);
    setClient(newClient);
    try {
      await Promise.all([
        AsyncStorage.setItem(TOKEN_KEY, newToken),
        AsyncStorage.setItem(API_TOKEN_KEY, newApiToken),
        AsyncStorage.setItem(CLIENT_KEY, JSON.stringify(newClient)),
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
    signOutToLogin,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
