import * as FileSystem from 'expo-file-system/legacy';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { PixelRatio, View } from 'react-native';
import type { ImageSourcePropType } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';

import { TAB_BAR_AVATAR_SIZE } from '@/components/TabBarProfileAvatar';
import {
  buildCircularTabBarAvatarHtml,
  cacheTabBarProfileAvatarIcon,
  getCachedTabBarProfileAvatarIcon,
  hashTabBarProfileAvatarUri,
} from '@/utils/tabBarProfileAvatarIcon';

interface TabBarProfileAvatarIconCaptureProps {
  uri: string;
  onReady: (source: ImageSourcePropType) => void;
}

function resolveDownloadMimeType(
  headers: Record<string, string> | undefined,
  sourceUri: string
): string {
  const contentType = headers?.['Content-Type'] ?? headers?.['content-type'];
  if (contentType) {
    return contentType.split(';')[0]?.trim() || 'image/jpeg';
  }

  const lowerUri = sourceUri.toLowerCase();
  if (lowerUri.includes('.png')) return 'image/png';
  if (lowerUri.includes('.webp')) return 'image/webp';
  return 'image/jpeg';
}

export default function TabBarProfileAvatarIconCapture({
  uri,
  onReady,
}: TabBarProfileAvatarIconCaptureProps) {
  const [html, setHtml] = useState<string | null>(null);
  const processingRef = useRef(false);

  useEffect(() => {
    const cached = getCachedTabBarProfileAvatarIcon(uri);
    if (cached) {
      onReady(cached);
      return;
    }

    if (processingRef.current) return;

    let cancelled = false;
    processingRef.current = true;

    void (async () => {
      try {
        const cacheKey = hashTabBarProfileAvatarUri(uri);
        const downloadPath = `${FileSystem.cacheDirectory}tab-avatar-src-${cacheKey}`;
        const download = await FileSystem.downloadAsync(uri, downloadPath);
        const mimeType = resolveDownloadMimeType(download.headers, uri);
        const base64 = await FileSystem.readAsStringAsync(download.uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        const pixelSize = Math.round(TAB_BAR_AVATAR_SIZE * PixelRatio.get());
        const dataUri = `data:${mimeType};base64,${base64}`;

        if (!cancelled) {
          setHtml(buildCircularTabBarAvatarHtml(dataUri, pixelSize));
        }
      } catch {
        if (!cancelled) {
          processingRef.current = false;
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [uri, onReady]);

  const handleMessage = useCallback(
    async (event: WebViewMessageEvent) => {
      const payload = event.nativeEvent.data;
      if (!payload) {
        processingRef.current = false;
        setHtml(null);
        return;
      }

      try {
        const base64 = payload.replace(/^data:image\/\w+;base64,/, '');
        const cacheKey = hashTabBarProfileAvatarUri(uri);
        const outputPath = `${FileSystem.cacheDirectory}tab-avatar-icon-${cacheKey}.png`;

        await FileSystem.writeAsStringAsync(outputPath, base64, {
          encoding: FileSystem.EncodingType.Base64,
        });

        onReady(cacheTabBarProfileAvatarIcon(uri, outputPath));
      } catch {
        // Parent keeps fallback icon until avatar changes again.
      } finally {
        processingRef.current = false;
        setHtml(null);
      }
    },
    [uri, onReady]
  );

  if (!html) {
    return null;
  }

  return (
    <View
      pointerEvents="none"
      collapsable={false}
      style={{ position: 'absolute', top: -1000, left: -1000, width: 1, height: 1, opacity: 0 }}>
      <WebView
        originWhitelist={['*']}
        source={{ html }}
        onMessage={handleMessage}
        scrollEnabled={false}
        style={{ width: 1, height: 1, backgroundColor: 'transparent' }}
      />
    </View>
  );
}
