import '../global.css';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack } from 'expo-router';
import { NativeWindStyleSheet } from 'nativewind';
import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { vexo } from 'vexo-analytics';

import { AccentColorProvider } from '@/contexts/AccentColorContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { BookingsBadgeProvider } from '@/contexts/BookingsBadgeContext';
import { BranchFilterProvider } from '@/contexts/BranchFilterContext';
import { FavoritesSyncProvider } from '@/contexts/FavoritesSyncContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import PushNotificationsProvider from '@/contexts/PushNotificationsProvider';
import { SelectedPurchaseProvider } from '@/contexts/SelectedPurchaseContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { CopyFeedbackProvider } from '@/contexts/CopyFeedbackContext';
import { PhoneCallFeedbackProvider } from '@/contexts/PhoneCallFeedbackContext';
import { TransferRecipientProvider } from '@/contexts/TransferRecipientContext';
import useThemedNavigation from '@/hooks/useThemedNavigation';
import { useListingCacheResume } from '@/hooks/useListingCacheResume';

import AuthGuard from '@/components/AuthGuard';
import { APP_OPENS_KEY } from '@/constants/appOpens';

export { APP_OPENS_KEY };

if (!__DEV__) {
  vexo('03e85209-b9e7-49b5-b098-0712f981606e');
}

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
  useListingCacheResume();

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
          <CopyFeedbackProvider>
            <AccentColorProvider>
              <AuthProvider>
                <BookingsBadgeProvider>
                  <TransferRecipientProvider>
                    <SelectedPurchaseProvider>
                      <BranchFilterProvider>
                        <FavoritesSyncProvider>
                          <PushNotificationsProvider>
                            <AuthGuard>
                              <PhoneCallFeedbackProvider>
                                <ThemedLayout />
                              </PhoneCallFeedbackProvider>
                            </AuthGuard>
                          </PushNotificationsProvider>
                        </FavoritesSyncProvider>
                      </BranchFilterProvider>
                    </SelectedPurchaseProvider>
                  </TransferRecipientProvider>
                </BookingsBadgeProvider>
              </AuthProvider>
            </AccentColorProvider>
          </CopyFeedbackProvider>
        </ThemeProvider>
      </LanguageProvider>
    </GestureHandlerRootView>
  );
}
