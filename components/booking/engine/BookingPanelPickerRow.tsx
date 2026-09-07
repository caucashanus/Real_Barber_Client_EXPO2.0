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

  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={shadowPresets.card}
      className={`${BOOKING_FLOW_CARD_OUTER_CLASS} active:opacity-70 ${
        selected ? 'border-2 border-light-text dark:border-dark-text' : ''
      } ${disabled ? 'opacity-60' : ''}`}>
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

        <View className="shrink-0 flex-row items-start gap-1">
          {showInfo ? (
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
          ) : null}
          {selected ? (
            <View className="p-2">
              <Icon name="CheckCircle2" size={20} color={colors.highlight} />
            </View>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}
