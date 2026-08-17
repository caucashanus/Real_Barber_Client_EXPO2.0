import React from 'react';
import { View } from 'react-native';

import PopularityBadge from '@/components/inspirace/PopularityBadge';
import IsNewBadge from '@/components/shared/IsNewBadge';
import ThemedText from '@/components/ThemedText';
import useThemeColors from '@/contexts/ThemeColors';
import type { TranslationKey } from '@/locales';

/** Mezera tag ↔ popularity ve flex-row (RN gap ne vždy funguje — viz SlotTimePill). */
const META_TAG_POPULARITY_GAP_STYLE = { marginRight: 16 } as const;

interface HairstyleIdentityMetaRowProps {
  aboutBadge: string;
  popularityBadge: string;
  isNew?: boolean;
  t: (key: TranslationKey) => string;
}

/** Tag + index popularity — na detailu účesu pod názvem, před hero fotkou. */
export default function HairstyleIdentityMetaRow({
  aboutBadge,
  popularityBadge,
  isNew = false,
  t,
}: HairstyleIdentityMetaRowProps) {
  const colors = useThemeColors();
  const hasPopularity = Boolean(popularityBadge);

  if (!aboutBadge && !hasPopularity && !isNew) return null;

  return (
    <View className="flex-row flex-wrap items-center gap-x-4 gap-y-1">
      {aboutBadge ? (
        <View style={hasPopularity ? META_TAG_POPULARITY_GAP_STYLE : undefined}>
          <ThemedText
            className="text-xs font-semibold uppercase tracking-wide"
            style={{ color: colors.highlight }}
            numberOfLines={2}>
            {aboutBadge}
          </ThemedText>
        </View>
      ) : null}
      {hasPopularity ? (
        <PopularityBadge
          label={t('inspiraceDetailPopularityIndex')}
          value={popularityBadge}
          className="self-start !pl-0"
        />
      ) : null}
      {isNew ? <IsNewBadge /> : null}
    </View>
  );
}
