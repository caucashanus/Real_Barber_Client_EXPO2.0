import React from 'react';
import { Modal, Platform, View } from 'react-native';

import { RbicekChatScreen } from '@/components/rbicek/RbicekChatScreen';

export interface RbicekChatModalProps {
  visible: boolean;
  onClose: () => void;
}

export function RbicekChatModal({ visible, onClose }: RbicekChatModalProps) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle={Platform.OS === 'ios' ? 'fullScreen' : 'fullScreen'}
      onRequestClose={onClose}>
      <View className="flex-1 bg-light-primary dark:bg-dark-primary">
        <RbicekChatScreen visible={visible} onClose={onClose} />
      </View>
    </Modal>
  );
}
