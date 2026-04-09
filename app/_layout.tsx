import '../global.css';
import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { NativeWindStyleSheet } from 'nativewind';
import { ThemeProvider } from './contexts/ThemeContext';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import useThemedNavigation from './hooks/useThemedNavigation';
import { Platform } from 'react-native';
import { BusinessModeProvider } from './contexts/BusinesModeContext';
import { AuthProvider } from './contexts/AuthContext';
import { TransferRecipientProvider } from './contexts/TransferRecipientContext';
import { SelectedPurchaseProvider } from './contexts/SelectedPurchaseContext';
import { BranchFilterProvider } from './contexts/BranchFilterContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { AccentColorProvider } from './contexts/AccentColorContext';
import { FavoritesSyncProvider } from './contexts/FavoritesSyncContext';
import PushNotificationsProvider from './contexts/PushNotificationsProvider';
import { RealBarberWidget } from '@/widgets';

NativeWindStyleSheet.setOutput({
  default: 'native',
});

function ThemedLayout() {
  const { ThemedStatusBar, screenOptions } = useThemedNavigation();

  useEffect(() => {
    if (Platform.OS !== 'ios') return;
    RealBarberWidget.updateSnapshot({
      title: 'Real Barber',
      subtitle: 'Dev widget is working',
    });
  }, []);

  return (
    <>
      <ThemedStatusBar />
      <Stack screenOptions={screenOptions}>
      


      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView className={`bg-light-primary dark:bg-dark-primary ${Platform.OS === 'ios' ? 'pb-0 ' : ''}`} style={{ flex: 1 }}>
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
