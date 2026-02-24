import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { WebView } from 'react-native-webview';
import Header from '@/components/Header';

export default function InAppWebScreen() {
  const { url } = useLocalSearchParams<{ url: string }>();

  if (!url) {
    return (
      <>
        <Header showBackButton />
        <View className="flex-1 bg-light-primary dark:bg-dark-primary" />
      </>
    );
  }

  const decodedUrl = decodeURIComponent(url);

  return (
    <>
      <Header showBackButton />
      <WebView
        source={{ uri: decodedUrl }}
        className="flex-1 bg-light-primary dark:bg-dark-primary"
        startInLoadingState
        renderLoading={() => (
          <View className="absolute inset-0 items-center justify-center bg-light-primary dark:bg-dark-primary">
            <ActivityIndicator size="large" />
          </View>
        )}
      />
    </>
  );
}
