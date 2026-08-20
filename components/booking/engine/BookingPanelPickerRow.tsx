import { Image } from 'expo-image';
import React, { type ReactNode } from 'react';
import { Pressable, View, type ImageSourcePropType } from 'react-native';

import Avatar from '@/components/Avatar';
import Icon from '@/components/Icon';
import ThemedText from '@/components/ThemedText';
import useThemeColors from '@/contexts/ThemeColors';
import { shadowPresets } from '@/utils/useShadow';

/** Stejná karta jako `BookingCard` v `bookings.tsx` — shadow + mt-4 na jednom View. */
export const BOOKING_FLOW_CARD_OUTER_CLASS =
  'mt-4 w-full overflow-hidden rounded-2xl border border-neutral-200 bg-light-primary dark:border-neutral-700 dark:bg-dark-primary';

/** @deprecated */
export const BOOKING_FLOW_CARD_WRAPPER_CLASS = 'mt-4 w-full';
/** @deprecated */
export const BOOKING_FLOW_CARD_SURFACE_CLASS =
  'w-full overflow-hidden rounded-2xl border border-neutral-200 bg-light-primary dark:border-neutral-700 dark:bg-dark-primary';
/** @deprecated */
export const BOOKING_FLOW_CARD_CLASS = BOOKING_FLOW_CARD_OUTER_CLASS;

interface BookingPanelPickerRowProps {
  imageUrl?: string | null;
  imageSource?: ImageSourcePropType;
  imageFit?: 'cover' | 'contain';
  imageShape?: 'square' | 'round';
  /** `md` = 48px, `xl` = 80px (booking employee step). */
  avatarSize?: 'md' | 'xl';
  fallbackName?: string;
  title: ReactNode;
  description?: ReactNode;
  meta?: ReactNode;
  selected?: boolean;
  onPress: () => void;
  disabled?: boolean;
  showInfo?: boolean;
  onInfo?: () => void;
}

export default function BookingPanelPickerRow({
  imageUrl,
  imageSource,
  imageFit = 'cover',
  imageShape = 'square',
  avatarSize = 'md',
  fallbackName = '?',
  title,
  description,
  meta,
  selected = false,
  onPress,
  disabled = false,
  showInfo = false,
  onInfo,
}: BookingPanelPickerRowProps) {
  const colors = useThemeColors();
  const avatarClass = avatarSize === 'xl' ? 'h-20 w-20' : 'h-12 w-12';
  const avatarRadius = imageShape === 'round' ? 'rounded-full' : 'rounded-xl';

  const borderStyle = selected
    ? { borderWidth: 2 as const, borderColor: colors.highlight }
    : { borderWidth: 1 as const, borderColor: colors.border };

  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      accessibilityRole="button"
      style={[shadowPresets.card, borderStyle]}
      className={`${BOOKING_FLOW_CARD_OUTER_CLASS} border-0 active:opacity-70 ${disabled ? 'opacity-60' : ''}`}>
      <View className="flex-row items-start gap-3 p-4">
        <View className={`${avatarClass} shrink-0 items-center justify-center overflow-hidden`}>
          {imageSource ? (
            <Image
              source={imageSource}
              className={`${avatarClass} ${avatarRadius}`}
              contentFit={imageFit}
            />
          ) : imageUrl?.trim() ? (
            <Image
              source={{ uri: imageUrl.trim() }}
              className={`${avatarClass} ${avatarRadius}`}
              contentFit={imageFit}
            />
          ) : (
            <Avatar
              size={avatarSize === 'xl' ? 'xl' : 'sm'}
              name={fallbackName}
              className={avatarRadius}
            />
          )}
        </View>

        <View className="min-w-0 flex-1 gap-1">
          {typeof title === 'string' ? (
            <ThemedText className="text-base font-medium" numberOfLines={2}>
              {title}
            </ThemedText>
          ) : (
            title
          )}
          {description ? (
            typeof description === 'string' ? (
              <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext" numberOfLines={2}>
                {description}
              </ThemedText>
            ) : (
              description
            )
          ) : null}
          {meta ?? null}
        </View>

        {showInfo ? (
          <View className="shrink-0 flex-row items-start">
            <Pressable
              className="rounded-full p-2 active:opacity-70"
              onPress={(event) => {
                event.stopPropagation();
                onInfo?.();
              }}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Info">
              <Icon name="Info" size={18} className="text-light-subtext dark:text-dark-subtext" />
            </Pressable>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}
