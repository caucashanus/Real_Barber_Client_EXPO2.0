import React from 'react';
import { View } from 'react-native';

import AppButton from '@/components/AppButton';
import type { QuickReply } from '@/lib/rbicek/types';

interface RbicekChipRowProps {
  replies: QuickReply[];
  disabled?: boolean;
  onSelect: (optionId: string) => void;
}

export function RbicekChipRow({ replies, disabled, onSelect }: RbicekChipRowProps) {
  if (!replies.length) return null;
  return (
    <View className="flex-row flex-wrap gap-2 px-4">
      {replies.map((reply) => (
        <AppButton
          key={reply.id}
          variant="choice"
          size="sm"
          rounded="lg"
          title={reply.label}
          disabled={disabled}
          onPress={() => onSelect(reply.id)}
        />
      ))}
    </View>
  );
}
