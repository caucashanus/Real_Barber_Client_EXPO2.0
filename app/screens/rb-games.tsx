import { Stack } from 'expo-router';
import React, { useState } from 'react';
import { View } from 'react-native';
import { WebView } from 'react-native-webview';

import Header from '@/components/Header';
import SiteLoadingSpinner from '@/components/SiteLoadingSpinner';
import { HOME_RB_GAMES_URL } from '@/constants/homeRbGames';
import { useTranslation } from '@/hooks/useTranslation';

/** Jen „Nuda?“ — web pod standardní hlavičkou se šipkou zpět (ne sheet jako `in-app-web`). */
export default function RbGamesScreen() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
          presentation: 'fullScreenModal',
          gestureEnabled: true,
        }}
      />
      <View className="flex-1 bg-light-primary dark:bg-dark-primary">
        <Header showBackButton title={t('rbGamesScreenTitle')} />
        <View className="relative flex-1">
          <WebView
            source={{ uri: HOME_RB_GAMES_URL }}
            className="flex-1 bg-light-primary dark:bg-dark-primary"
            onLoadEnd={() => setLoading(false)}
            allowsInlineMediaPlayback
            mediaPlaybackRequiresUserAction={false}
            allowsBackForwardNavigationGestures
          />
          {loading ? (
            <View className="absolute inset-0 items-center justify-center bg-light-primary dark:bg-dark-primary">
              <SiteLoadingSpinner size="compact" />
            </View>
          ) : null}
        </View>
      </View>
    </>
  );
}