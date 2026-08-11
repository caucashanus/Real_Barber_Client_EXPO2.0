import React from 'react';
import { View } from 'react-native';

import PopularityBadge from '@/components/inspirace/PopularityBadge';
import ThemedText from '@/components/ThemedText';
import useThemeColors from '@/contexts/ThemeColors';
import type { TranslationKey } from '@/locales';

/** Mezera tag ↔ popularity ve flex-row (RN gap ne vždy funguje — viz SlotTimePill). */
const META_TAG_POPULARITY_GAP_STYLE = { marginRight: 16 } as const;

interface HairstyleIdentityMetaRowProps {
  aboutBadge: string;
  popularityBadge: string;
  t: (key: TranslationKey) => string;
}

/** Tag + index popularity — na detailu účesu pod názvem, před hero fotkou. */
export default function HairstyleIdentityMetaRow({
  aboutBadge,
  popularityBadge,
  t,
}: HairstyleIdentityMetaRowProps) {
  const colors = useThemeColors();
  const hasPopularity = Boolean(popularityBadge);

  if (!aboutBadge && !hasPopularity) return null;

  return (
    <View className="flex-row flex-wrap items-center">
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
    </View>
  );
}
