import React, { useMemo } from 'react';
import { Modal, Platform, View } from 'react-native';
import { WebView } from 'react-native-webview';

import {
  CUSTOMERAI_PUBLIC_KEY,
  CUSTOMERAI_WIDGET_HOST,
  CUSTOMERAI_WIDGET_SRC,
} from '@/constants/customerAi';
import { useLanguage } from '@/contexts/LanguageContext';
import { buildCustomerAiWidgetHtml } from '@/utils/customerAiWidgetHtml';

export interface CustomerAiSupportModalProps {
  visible: boolean;
  onClose: () => void;
}

export function CustomerAiSupportModal({ visible, onClose }: CustomerAiSupportModalProps) {
  const { locale } = useLanguage();

  const widgetHtml = useMemo(
    () =>
      buildCustomerAiWidgetHtml({
        publicKey: CUSTOMERAI_PUBLIC_KEY,
        widgetSrc: CUSTOMERAI_WIDGET_SRC,
        locale,
      }),
    [locale]
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle={Platform.OS === 'ios' ? 'pageSheet' : 'fullScreen'}
      onRequestClose={onClose}>
      <View className="flex-1 bg-black">
        <WebView
          source={{ html: widgetHtml, baseUrl: CUSTOMERAI_WIDGET_HOST }}
          originWhitelist={['https://*', 'http://*']}
          javaScriptEnabled
          domStorageEnabled
          allowsInlineMediaPlayback
          setSupportMultipleWindows={false}
          sharedCookiesEnabled
          style={{ flex: 1, backgroundColor: '#000000' }}
        />
      </View>
    </Modal>
  );
}
