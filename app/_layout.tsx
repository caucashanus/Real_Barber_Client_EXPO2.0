import '../global.css';
import { ExtensionStorage } from '@bacons/apple-targets';
import { Stack } from 'expo-router';
import { NativeWindStyleSheet } from 'nativewind';
import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { AccentColorProvider } from './contexts/AccentColorContext';
import { AuthProvider } from './contexts/AuthContext';
import { BranchFilterProvider } from './contexts/BranchFilterContext';
import { BusinessModeProvider } from './contexts/BusinesModeContext';
import { FavoritesSyncProvider } from './contexts/FavoritesSyncContext';
import { LanguageProvider } from './contexts/LanguageContext';
import PushNotificationsProvider from './contexts/PushNotificationsProvider';
import { SelectedPurchaseProvider } from './contexts/SelectedPurchaseContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { TransferRecipientProvider } from './contexts/TransferRecipientContext';
import useThemedNavigation from './hooks/useThemedNavigation';

import { RB_APP_GROUP, RB_HOME_WIDGET_KIND, RB_WIDGET_KEYS } from '@/lib/widget-app-group';

NativeWindStyleSheet.setOutput({
  default: 'native',
});

function ThemedLayout() {
  const { ThemedStatusBar, screenOptions } = useThemedNavigation();

  useEffect(() => {
    if (Platform.OS !== 'ios') return;
    try {
      const storage = new ExtensionStorage(RB_APP_GROUP);
      storage.set(RB_WIDGET_KEYS.title, 'Real Barber');
      storage.set(
        RB_WIDGET_KEYS.subtitle,
        `Widget: ${new Date().toLocaleTimeString()}`
      );
      ExtensionStorage.reloadWidget(RB_HOME_WIDGET_KIND);
    } catch {
      // ignore (e.g. native module not linked yet)
    }
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
      <BusinessModeProvider>
        <LanguageProvider>
          <ThemeProvider>
            <AccentColorProvider>
              <AuthProvider>
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
              </AuthProvider>
            </AccentColorProvider>
          </ThemeProvider>
        </LanguageProvider>
      </BusinessModeProvider>
    </GestureHandlerRootView>
  );
}
