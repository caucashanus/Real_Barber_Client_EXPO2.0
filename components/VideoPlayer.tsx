import React, { useMemo, useRef } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { View } from 'react-native';
import { useVideoPlayer, VideoView, type VideoContentFit } from 'expo-video';

export type VideoPlayerContentFit = 'contain' | 'cover';

export interface VideoPlayerProps {
  uri: string;
  style?: StyleProp<ViewStyle>;
  className?: string;
  contentFit?: VideoPlayerContentFit;
  nativeControls?: boolean;
  isLooping?: boolean;
  isMuted?: boolean;
  shouldPlay?: boolean;
  fullscreenEnabled?: boolean;
}

export default function VideoPlayer(props: VideoPlayerProps) {
  const {
    uri,
    style,
    className,
    contentFit = 'cover',
    nativeControls = false,
    isLooping = false,
    isMuted = false,
    shouldPlay = false,
    fullscreenEnabled = false,
  } = props;

  const viewRef = useRef<VideoView>(null);
  const source = useMemo(() => ({ uri }), [uri]);

  const player = useVideoPlayer(source, (p) => {
    p.loop = isLooping;
    p.muted = isMuted;
    if (shouldPlay) p.play();
  });

  const fit: VideoContentFit = contentFit === 'contain' ? 'contain' : 'cover';

  return (
    <View className={className}>
      <VideoView
        ref={viewRef}
        player={player}
        style={style}
        contentFit={fit}
        nativeControls={nativeControls}
        fullscreenOptions={fullscreenEnabled ? { enable: true } : undefined}
      />
    </View>
  );
}

