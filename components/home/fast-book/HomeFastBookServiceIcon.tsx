import { Image } from 'expo-image';
import React from 'react';

import type { HomeFastBookService } from '@/constants/homeFastBookServices';

type Props = {
  service: HomeFastBookService;
  size: 'md' | 'lg';
};

const SIZE = { md: 40, lg: 48 } as const;

export default function HomeFastBookServiceIcon({ service, size }: Props) {
  const px = SIZE[size];
  return (
    <Image
      source={service.iconImage}
      className={`shrink-0 ${size === 'md' ? 'size-10' : 'size-12'}`}
      style={{ width: px, height: px }}
      contentFit="contain"
    />
  );
}
