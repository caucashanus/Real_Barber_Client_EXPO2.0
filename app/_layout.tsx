import '../global.css';
import { Asset } from 'expo-asset';
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

import { RealBarberWidget } from '@/widgets';

NativeWindStyleSheet.setOutput({
  default: 'native',
});

function ThemedLayout() {
  const { ThemedStatusBar, screenOptions } = useThemedNavigation();

  useEffect(() => {
    if (Platform.OS !== 'ios') return;
    (async () => {
      const asset = Asset.fromModule(require('@/assets/icon.png'));
      try {
        await asset.downloadAsync();
      } catch {
        // ignore
      }
      RealBarberWidget.updateSnapshot({
        title: 'Real Barber',
        subtitle: `Widget test: updated (${new Date().toLocaleTimeString()})`,
        logoUri: asset.localUri ?? asset.uri,
      });
      try {
        RealBarberWidget.reload();
      } catch {
        // ignore
      }
    })();
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
