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
      <View className="w-full overflow-hidden rounded-xl bg-black" style={{ aspectRatio: 16 / 9 }}>
        <VideoPlayer uri={videoUrl} contentFit="cover" nativeControls style={{ flex: 1 }} />
      </View>
    </BranchContentCardSection>
  );
}
