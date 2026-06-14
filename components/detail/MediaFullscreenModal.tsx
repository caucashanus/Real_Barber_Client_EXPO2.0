import { Image } from 'expo-image';
import React from 'react';
import { Modal, Pressable, View } from 'react-native';

import type { EmployeeMediaItem } from '@/api/employees';
import Icon from '@/components/Icon';
import VideoPlayer from '@/components/VideoPlayer';

interface MediaFullscreenModalProps {
  media: EmployeeMediaItem | null;
  winWidth: number;
  winHeight: number;
  topInset: number;
  onClose: () => void;
}

export default function MediaFullscreenModal({
  media,
  winWidth,
  winHeight,
  topInset,
  onClose,
}: MediaFullscreenModalProps) {
  return (
    <Modal visible={!!media} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, width: winWidth, height: winHeight, backgroundColor: '#000' }}>
        <Pressable
          onPress={onClose}
          style={{ position: 'absolute', top: topInset + 8, left: 16, zIndex: 10, padding: 8 }}
          className="rounded-full bg-black/50">
          <Icon name="X" size={24} className="text-white" />
        </Pressable>
        {media?.type === 'video' ? (
          <VideoPlayer
            uri={media.url}
            style={{ width: winWidth, height: winHeight }}
            contentFit="contain"
            nativeControls
            shouldPlay
          />
        ) : media ? (
          <Pressable style={{ flex: 1 }} onPress={onClose}>
            <Image
              source={{ uri: media.url }}
              style={{ width: winWidth, height: winHeight }}
              contentFit="contain"
            />
          </Pressable>
        ) : null}
      </View>
    </Modal>
  );
}
