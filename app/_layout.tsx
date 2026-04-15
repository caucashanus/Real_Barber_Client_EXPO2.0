import '../global.css';
import { Stack } from 'expo-router';
import { NativeWindStyleSheet } from 'nativewind';
import React from 'react';
import { Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { AccentColorProvider } from './contexts/AccentColorContext';
import { AuthProvider } from './contexts/AuthContext';
import { BranchFilterProvider } from './contexts/BranchFilterContext';
import { BusinessModeProvider } from './contexts/BusinesModeContext';
import { FavoritesSyncProvider } from './contexts/FavoritesSyncContext';
import { LanguageProvider } from './contexts/LanguageContext';
import LiveActivityReconcileProvider from './contexts/LiveActivityReconcileProvider';
import PushNotificationsProvider from './contexts/PushNotificationsProvider';
import { SelectedPurchaseProvider } from './contexts/SelectedPurchaseContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { TransferRecipientProvider } from './contexts/TransferRecipientContext';
import useThemedNavigation from './hooks/useThemedNavigation';

NativeWindStyleSheet.setOutput({
  default: 'native',
});

function ThemedLayout() {
  const { ThemedStatusBar, screenOptions } = useThemedNavigation();

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
      <BusinessModeProvider>
        <LanguageProvider>
          <ThemeProvider>
            <AccentColorProvider>
              <AuthProvider>
                <LiveActivityReconcileProvider>
                  <TransferRecipientProvider>
                    <SelectedPurchaseProvider>
                      <BranchFilterProvider>
                        <FavoritesSyncProvider>
                          <PushNotificationsProvider>
                            <ThemedLayout />
                          </PushNotificationsProvider>
                        </FavoritesSyncProvider>
                      </BranchFilterProvider>
                    </SelectedPurchaseProvider>
                  </TransferRecipientProvider>
                </LiveActivityReconcileProvider>
              </AuthProvider>
            </AccentColorProvider>
          </ThemeProvider>
        </LanguageProvider>
      </BusinessModeProvider>
    </GestureHandlerRootView>
  );
}
