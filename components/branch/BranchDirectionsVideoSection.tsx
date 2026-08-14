import React from 'react';
import { View } from 'react-native';

import BranchContentCardSection from '@/components/branch/BranchContentCardSection';
import VideoPlayer from '@/components/VideoPlayer';
import type { TranslationKey } from '@/locales';

interface BranchDirectionsVideoSectionProps {
  videoUrl: string;
  t: (key: TranslationKey) => string;
  isFirst?: boolean;
}

export default function BranchDirectionsVideoSection({
  videoUrl,
  t,
  isFirst,
}: BranchDirectionsVideoSectionProps) {
  return (
    <BranchContentCardSection title={t('branchDirectionsVideoTitle')} isFirst={isFirst}>
      <View className="w-full overflow-hidden rounded-xl bg-black">
        <VideoPlayer
          uri={videoUrl}
          style={{ width: '100%', height: 220 }}
          contentFit="cover"
          nativeControls
          shouldPlay
          isLooping
          isMuted
        />
      </View>
    </BranchContentCardSection>
  );
}
