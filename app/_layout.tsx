import '../global.css';
import React from 'react';
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

NativeWindStyleSheet.setOutput({
  default: 'native',
});

function ThemedLayout() {
  const { ThemedStatusBar, screenOptions } = useThemedNavigation();

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
          <AuthProvider>
            <TransferRecipientProvider>
              <SelectedPurchaseProvider>
                <BranchFilterProvider>
                  <ThemedLayout />
                </BranchFilterProvider>
              </SelectedPurchaseProvider>
            </TransferRecipientProvider>
          </AuthProvider>
        </ThemeProvider>
        </LanguageProvider>
      </BusinessModeProvider>
    </GestureHandlerRootView>
  );
}
