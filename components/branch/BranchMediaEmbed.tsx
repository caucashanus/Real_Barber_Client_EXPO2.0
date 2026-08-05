import React from 'react';
import { View } from 'react-native';
import { WebView } from 'react-native-webview';

interface BranchMediaEmbedProps {
  uri: string;
  className?: string;
}

export default function BranchMediaEmbed({ uri, className = '' }: BranchMediaEmbedProps) {
  return (
    <View
      className={`w-full overflow-hidden rounded-xl bg-black ${className}`.trim()}
      style={{ aspectRatio: 16 / 9 }}>
      <WebView
        source={{ uri }}
        style={{ flex: 1, backgroundColor: '#000' }}
        allowsFullscreenVideo
        mediaPlaybackRequiresUserAction={false}
        scrollEnabled={false}
      />
    </View>
  );
}
