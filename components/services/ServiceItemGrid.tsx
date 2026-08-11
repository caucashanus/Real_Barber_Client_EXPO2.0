import React from 'react';
import { useWindowDimensions, View, type ImageSourcePropType } from 'react-native';

import FavoriteMediaCard from '@/components/favorites/FavoriteMediaCard';
import Grid from '@/components/layout/Grid';
import ThemedText from '@/components/ThemedText';
import useThemeColors from '@/contexts/ThemeColors';
import { useTranslation } from '@/hooks/useTranslation';

const DESKTOP_BREAKPOINT = 768;
const GRID_GAP = 16;
const GRID_BLEED_CLASS = '-mx-1';

const META_TEXT_CLASS =
  'text-xs font-normal leading-4 text-light-subtext dark:text-dark-subtext';
const BADGE_TEXT_CLASS =
  'text-xs font-semibold uppercase tracking-wide text-light-subtext dark:text-dark-subtext';

export interface ServiceGridItem {
  id: string;
  title: string;
  image: string | ImageSourcePropType;
  href?: string;
  entityType?: string;
  entityId?: string;
  /** Částka bez prefixu „od“, např. „590 Kč“. */
  priceAmount?: string;
  badgeLabel?: string;
}

function ServiceGridCardMeta({
  priceAmount,
  badgeLabel,
  accentBadgeLabel = false,
}: Pick<ServiceGridItem, 'priceAmount' | 'badgeLabel'> & { accentBadgeLabel?: boolean }) {
  const colors = useThemeColors();
  const { t } = useTranslation();

  if (!priceAmount && !badgeLabel) return null;

  return (
    <View className="w-full flex-col gap-0.5">
      {badgeLabel ? (
        <ThemedText
          className={
            accentBadgeLabel
              ? 'text-xs font-semibold uppercase tracking-wide'
              : BADGE_TEXT_CLASS
          }
          style={accentBadgeLabel ? { color: colors.highlight } : undefined}
          numberOfLines={2}>
          {badgeLabel}
        </ThemedText>
      ) : null}
      {priceAmount ? (
        <ThemedText
          className="text-xs font-normal leading-4"
          style={{ color: colors.highlight }}
          numberOfLines={2}>
          {t('reservationPriceFromPrefix')} {priceAmount}
        </ThemedText>
      ) : null}
    </View>
  );
}

interface ServiceItemGridProps {
  items: ServiceGridItem[];
  className?: string;
  /** Tag pod názvem v accent barvě (inspirace / detail účesu). */
  accentBadgeLabels?: boolean;
}

export default function ServiceItemGrid({
  items,
  className = '',
  accentBadgeLabels = false,
}: ServiceItemGridProps) {
  const { width: windowWidth } = useWindowDimensions();
  const gridColumns = windowWidth >= DESKTOP_BREAKPOINT ? 4 : 2;

  return (
    <View className={`relative ${GRID_BLEED_CLASS} ${className}`}>
      <Grid className="mt-2" columns={gridColumns} spacing={GRID_GAP}>
        {items.map((item) => (
          <FavoriteMediaCard
            key={item.id}
            href={item.href}
            title={item.title}
            image={item.image}
            entityType={item.entityType}
            entityId={item.entityId}
            showFavorite={Boolean(item.entityType && item.entityId)}
            belowTitle={
              <ServiceGridCardMeta
                priceAmount={item.priceAmount}
                badgeLabel={item.badgeLabel}
                accentBadgeLabel={accentBadgeLabels}
              />
            }
          />
        ))}
      </Grid>
    </View>
  );
}
