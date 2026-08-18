import React from 'react';
import { View } from 'react-native';

import SiteLoadingSpinner, { type SiteLoadingSpinnerSize } from '@/components/SiteLoadingSpinner';
import { useTranslation } from '@/hooks/useTranslation';

export type SiteLoadingLayout = 'page' | 'section' | 'inline';

interface SiteLoadingStateProps {
  size?: SiteLoadingSpinnerSize;
  layout?: SiteLoadingLayout;
  className?: string;
}

const LAYOUT_CLASS: Record<SiteLoadingLayout, string> = {
  page: 'min-h-[40vh] flex-1 items-center justify-center',
  section: 'items-center justify-center py-12',
  inline: 'items-center justify-center',
};

/** Web parity: SiteLoadingState — accent ring spinner, no visible label (SR: Common.loading). */
export default function SiteLoadingState({
  size = 'default',
  layout = 'page',
  className,
}: SiteLoadingStateProps) {
  const { t } = useTranslation();
  const layoutClass = LAYOUT_CLASS[layout];
  const rootClass = className ? `${layoutClass} ${className}` : layoutClass;

  return (
    <View
      className={rootClass}
      accessibilityRole="progressbar"
      accessibilityState={{ busy: true }}
      accessibilityLabel={t('commonLoading')}
      accessibilityLiveRegion="polite">
      <SiteLoadingSpinner size={size} />
    </View>
  );
}
