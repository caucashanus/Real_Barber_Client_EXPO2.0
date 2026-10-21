import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { View } from 'react-native';
import { WebView } from 'react-native-webview';

import Header, { HeaderOutlineIconButton } from '@/components/Header';
import { useTranslation } from '@/hooks/useTranslation';

function dismissInAppWeb() {
  if (router.canDismiss()) {
    router.dismiss();
    return;
  }
  router.back();
}

export default function InAppWebScreen() {
  const { url, title } = useLocalSearchParams<{ url?: string | string[]; title?: string | string[] }>();
  const { t } = useTranslation();

  const rawUrl = Array.isArray(url) ? url[0] : url;
  const rawTitle = Array.isArray(title) ? title[0] : title;
  const headerTitle = rawTitle?.trim() || undefined;

  if (!rawUrl) {
    return (
      <View className="flex-1 bg-light-primary dark:bg-dark-primary">
        <Header
          rightComponents={[
            <HeaderOutlineIconButton
              key="close"
              icon="X"
              onPress={dismissInAppWeb}
              accessibilityLabel={t('sheetClose')}
            />,
          ]}
        />
      </View>
    );
  }

  const decodedUrl = decodeURIComponent(rawUrl);

  return (
    <View className="flex-1 bg-light-primary dark:bg-dark-primary">
      <Header
        title={headerTitle}
        rightComponents={[
          <HeaderOutlineIconButton
            key="close"
            icon="X"
            onPress={dismissInAppWeb}
            accessibilityLabel={t('sheetClose')}
          />,
        ]}
      />
      <WebView source={{ uri: decodedUrl }} className="flex-1 bg-light-primary dark:bg-dark-primary" />
    </View>
  );
}
