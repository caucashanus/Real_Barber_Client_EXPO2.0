import '../global.css';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack } from 'expo-router';
import { NativeWindStyleSheet } from 'nativewind';
import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { AccentColorProvider } from './contexts/AccentColorContext';
import { AuthProvider } from './contexts/AuthContext';
import { BranchFilterProvider } from './contexts/BranchFilterContext';
import { FavoritesSyncProvider } from './contexts/FavoritesSyncContext';
import { LanguageProvider } from './contexts/LanguageContext';
import PushNotificationsProvider from './contexts/PushNotificationsProvider';
import { SelectedPurchaseProvider } from './contexts/SelectedPurchaseContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { TransferRecipientProvider } from './contexts/TransferRecipientContext';
import useThemedNavigation from './hooks/useThemedNavigation';

import AuthGuard from '@/components/AuthGuard';

export const APP_OPENS_KEY = '@app_opens_count';

async function incrementAppOpens(): Promise<void> {
  const raw = await AsyncStorage.getItem(APP_OPENS_KEY).catch(() => null);
  const current = parseInt(raw ?? '0', 10) || 0;
  await AsyncStorage.setItem(APP_OPENS_KEY, String(current + 1)).catch(() => {});
}

NativeWindStyleSheet.setOutput({
  default: 'native',
});

function ThemedLayout() {
  const { ThemedStatusBar, screenOptions } = useThemedNavigation();

  useEffect(() => {
    incrementAppOpens();
  }, []);

  return (
    <>
      <ThemedStatusBar />
      <Stack screenOptions={screenOptions} />
    </>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView
      className={`bg-light-primary dark:bg-dark-primary ${Platform.OS === 'ios' ? 'pb-0 ' : ''}`}
      style={{ flex: 1 }}>
      <LanguageProvider>
        <ThemeProvider>
          <AccentColorProvider>
            <AuthProvider>
              <TransferRecipientProvider>
                <SelectedPurchaseProvider>
                  <BranchFilterProvider>
                    <FavoritesSyncProvider>
                      <PushNotificationsProvider>
                        <AuthGuard>
                          <ThemedLayout />
                        </AuthGuard>
                      </PushNotificationsProvider>
                    </FavoritesSyncProvider>
                  </BranchFilterProvider>
                </SelectedPurchaseProvider>
              </TransferRecipientProvider>
            </AuthProvider>
          </AccentColorProvider>
        </ThemeProvider>
      </LanguageProvider>
    </GestureHandlerRootView>
  );
}
