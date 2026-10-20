import React from 'react';
import { Pressable, View } from 'react-native';

import Icon from '@/components/Icon';
import ThemedText from '@/components/ThemedText';
import useThemeColors from '@/contexts/ThemeColors';
import type { TranslationKey } from '@/locales';
import type { WaitlistPreferredContact } from '@/lib/waitlist/preferredContact';

const BRAND_WHATSAPP = '#25D366';
const BRAND_TELEGRAM = '#229ED9';

export function preferredContactLabelKey(contact: WaitlistPreferredContact): TranslationKey {
  switch (contact) {
    case 'phone':
      return 'homeTodayTeamWaitlistPreferredPhone';
    case 'sms':
      return 'homeTodayTeamWaitlistPreferredSms';
    case 'whatsapp':
      return 'homeTodayTeamWaitlistPreferredWhatsapp';
    case 'telegram':
      return 'homeTodayTeamWaitlistPreferredTelegram';
    case 'email':
      return 'homeTodayTeamWaitlistPreferredEmail';
  }
}

export function preferredContactIcon(
  contact: WaitlistPreferredContact,
  colors: ReturnType<typeof useThemeColors>,
  size = 20
) {
  switch (contact) {
    case 'phone':
      return <Icon name="Phone" size={size} strokeWidth={2} color={colors.text} />;
    case 'sms':
      return <Icon name="MessageSquare" size={size} strokeWidth={2} color={colors.text} />;
    case 'whatsapp':
      return (
        <Icon
          name="MessageCircle"
          size={size}
          strokeWidth={2}
          color={BRAND_WHATSAPP}
          fill={BRAND_WHATSAPP}
        />
      );
    case 'telegram':
      return (
        <Icon name="Send" size={size} strokeWidth={2} color={BRAND_TELEGRAM} fill={BRAND_TELEGRAM} />
      );
    case 'email':
      return <Icon name="Mail" size={size} strokeWidth={2} color={colors.text} />;
  }
}

type MultiRemind = { sms: boolean; phone: boolean };

function isMultiSelected(channel: WaitlistPreferredContact, selectedMulti: MultiRemind): boolean {
  if (channel === 'sms') return selectedMulti.sms;
  if (channel === 'phone') return selectedMulti.phone;
  return false;
}

type ChannelListProps<T extends WaitlistPreferredContact> = {
  channels: readonly T[];
  profilePhone?: string | null;
  t: (key: TranslationKey) => string;
  selectionMode?: 'single' | 'multi';
  selected?: T;
  onSelect?: (channel: T) => void;
  selectedMulti?: MultiRemind;
  onToggleMulti?: (channel: T) => void;
};

/** Řádky kanálů — single (čekací listina) nebo multi toggle (plán návštěv). */
export function PreferredContactChannelList<T extends WaitlistPreferredContact>({
  channels,
  profilePhone,
  t,
  selectionMode = 'single',
  selected,
  onSelect,
  selectedMulti,
  onToggleMulti,
}: ChannelListProps<T>) {
  const colors = useThemeColors();
  const phoneDetail = profilePhone?.trim() || undefined;

  return (
    <View className="gap-1">
      {channels.map((channel) => {
        const isSelected =
          selectionMode === 'multi' && selectedMulti
            ? isMultiSelected(channel, selectedMulti)
            : selected === channel;
        const subtitle = channel === 'phone' ? phoneDetail : undefined;

        return (
          <Pressable
            key={channel}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            onPress={() => {
              if (selectionMode === 'multi' && onToggleMulti) {
                onToggleMulti(channel);
                return;
              }
              onSelect?.(channel);
            }}
            className="w-full flex-row items-center gap-3 rounded-md px-3 py-2.5 active:opacity-70">
            <View className="shrink-0">{preferredContactIcon(channel, colors)}</View>
            <View className="min-w-0 flex-1 flex-row flex-wrap items-center gap-x-2 gap-y-0.5">
              <ThemedText className="shrink-0 text-sm font-medium">
                {t(preferredContactLabelKey(channel))}
              </ThemedText>
              {subtitle ? (
                <ThemedText
                  numberOfLines={1}
                  className="min-w-0 flex-1 text-sm text-light-subtext dark:text-dark-subtext">
                  {subtitle}
                </ThemedText>
              ) : null}
            </View>
            {isSelected ? (
              <Icon name="Check" size={20} strokeWidth={2.5} color={colors.highlight} />
            ) : (
              <View className="h-5 w-5 shrink-0" />
            )}
          </Pressable>
        );
      })}
    </View>
  );
}
