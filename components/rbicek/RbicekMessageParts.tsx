import { Image } from 'expo-image';
import React from 'react';
import { ScrollView, View, type ImageSourcePropType } from 'react-native';

import AppButton from '@/components/AppButton';
import { RbicekLinkableText } from '@/components/rbicek/RbicekLinkableText';
import SurfaceCard from '@/components/layout/SurfaceCard';
import ThemedText from '@/components/ThemedText';
import { tUi } from '@/lib/rbicek/port/i18n/ui';
import type { RbicekLocale } from '@/lib/rbicek/types';
import type {
  BranchCardData,
  PromoCardData,
  SlotCardData,
  TeamMemberCardData,
} from '@/lib/rbicek/types';
import { formatSlotDate } from '@/lib/rbicek/utils';
import { getLocalBranchImage } from '@/utils/bookingDetailHelpers';

const OPERATOR_ICON = require('@/assets/img/operator.png');
const CARD_HERO_CLASS = 'h-36 w-full';

function resolveCardImageSource(src?: string | null): ImageSourcePropType | null {
  if (src?.trim()) return { uri: src.trim() };
  return null;
}

function resolveBranchCardImageSource(branch: BranchCardData): ImageSourcePropType | null {
  const local = getLocalBranchImage(branch.id) ?? getLocalBranchImage(branch.name);
  if (local != null) return local;
  return resolveCardImageSource(branch.imageUrl);
}

function RbicekCardHeroImage({
  source,
  name,
}: {
  source: ImageSourcePropType | null;
  name: string;
}) {
  const initials = name
    .split(' ')
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

  if (source) {
    return <Image source={source} className={CARD_HERO_CLASS} contentFit="cover" />;
  }

  return (
    <View
      className={`${CARD_HERO_CLASS} items-center justify-center bg-light-secondary dark:bg-dark-secondary`}>
      <ThemedText className="text-lg font-medium">{initials}</ThemedText>
    </View>
  );
}

function formatShiftHours(hours: string): string {
  return hours.replace(/^(\d{1,2}:\d{2})-(\d{1,2}:\d{2})$/, '$1 - $2');
}

function formatTeamSlotLabel(member: TeamMemberCardData, locale: RbicekLocale): string | null {
  if (!member.nextSlotTime || !member.nextSlotDateRaw) return null;
  return `${formatSlotDate(member.nextSlotDateRaw, locale)} · ${member.nextSlotTime}`;
}

interface RbicekCarouselProps {
  locale: RbicekLocale;
  slots?: SlotCardData[];
  team?: TeamMemberCardData[];
  branches?: BranchCardData[];
  promos?: PromoCardData[];
  onSlotPress: (slot: SlotCardData) => void;
  onTeamBookPress: (member: TeamMemberCardData) => void;
  onTeamProfilePress: (member: TeamMemberCardData) => void;
  onTeamWaitlistPress: (label: string) => void;
  onBranchNavigatePress: (branch: BranchCardData) => void;
  onBranchDetailPress: (branch: BranchCardData) => void;
  onPromoPress: (promo: PromoCardData) => void;
}

export function RbicekCarousel({
  locale,
  slots,
  team,
  branches,
  promos,
  onSlotPress,
  onTeamBookPress,
  onTeamProfilePress,
  onTeamWaitlistPress,
  onBranchNavigatePress,
  onBranchDetailPress,
  onPromoPress,
}: RbicekCarouselProps) {
  const items = slots ?? team ?? branches ?? promos;
  if (!items?.length) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ width: '100%' }}
      contentContainerStyle={{ paddingHorizontal: 16, paddingRight: 20, paddingBottom: 4 }}>
      <View className="flex-row gap-3 pr-2">
        {slots?.map((slot) => (
          <SurfaceCard key={slot.id} rounded="2xl" className="w-52 overflow-hidden p-0">
            <RbicekCardHeroImage
              source={resolveCardImageSource(slot.avatarUrl)}
              name={slot.name}
            />
            <View className="p-3">
              <ThemedText className="font-semibold">{slot.name}</ThemedText>
              <ThemedText className="mt-1 text-sm text-light-subtext dark:text-dark-subtext">
                {slot.branchName}
              </ThemedText>
              <ThemedText className="mt-2 text-sm">
                {slot.date} · {slot.time}
              </ThemedText>
              <AppButton
                variant="default"
                size="sm"
                rounded="lg"
                title={tUi('book', locale)}
                className="mt-2 self-start px-4"
                onPress={() => onSlotPress(slot)}
              />
            </View>
          </SurfaceCard>
        ))}
        {team?.map((member) => {
          const slotLabel = formatTeamSlotLabel(member, locale);
          const hasNextSlot = Boolean(member.bookingUrl && slotLabel);
          const waitlistLabel = tUi('waitlist', locale);
          return (
            <SurfaceCard key={member.id} rounded="2xl" className="w-44 overflow-hidden p-0">
              <RbicekCardHeroImage
                source={resolveCardImageSource(member.avatarUrl)}
                name={member.name}
              />
              <View className="p-3">
                <ThemedText className="font-semibold">{member.name}</ThemedText>
                <ThemedText className="mt-1 text-sm text-light-subtext dark:text-dark-subtext">
                  {member.branchName}
                </ThemedText>
                <ThemedText className="mt-2 text-sm">
                  {tUi('shiftToday', locale)} {formatShiftHours(member.hours)}
                </ThemedText>
                {slotLabel ? (
                  <ThemedText className="mt-1 text-xs text-light-subtext dark:text-dark-subtext">
                    {slotLabel}
                  </ThemedText>
                ) : null}
                {member.fullyBookedToday ? (
                  <ThemedText className="mt-2 text-xs text-light-subtext dark:text-dark-subtext">
                    {tUi('fullyBooked', locale)}
                  </ThemedText>
                ) : null}
                <View className="mt-2 gap-2">
                  {hasNextSlot ? (
                    <AppButton
                      variant="default"
                      size="sm"
                      rounded="lg"
                      title={tUi('nearestSlot', locale)}
                      className="self-start px-4"
                      onPress={() => onTeamBookPress(member)}
                    />
                  ) : null}
                  <AppButton
                    variant="choice"
                    size="sm"
                    rounded="lg"
                    title={tUi('profile', locale)}
                    className="self-start"
                    onPress={() => onTeamProfilePress(member)}
                  />
                  {!hasNextSlot ? (
                    <AppButton
                      variant="choice"
                      size="sm"
                      rounded="lg"
                      title={waitlistLabel}
                      className="self-start"
                      onPress={() => onTeamWaitlistPress(waitlistLabel)}
                    />
                  ) : null}
                </View>
              </View>
            </SurfaceCard>
          );
        })}
        {branches?.map((branch) => (
          <SurfaceCard key={branch.id} rounded="2xl" className="w-52 overflow-hidden p-0">
            <RbicekCardHeroImage
              source={resolveBranchCardImageSource(branch)}
              name={branch.name}
            />
            <View className="p-3">
              <ThemedText className="font-semibold">{branch.name}</ThemedText>
              {branch.address ? (
                <ThemedText className="mt-2 text-sm text-light-subtext dark:text-dark-subtext">
                  {branch.address}
                </ThemedText>
              ) : null}
              <View className="mt-3 flex-row flex-wrap gap-2">
                <AppButton
                  variant="choice"
                  size="sm"
                  title={tUi('navigate', locale)}
                  onPress={() => onBranchNavigatePress(branch)}
                />
                {branch.detailUrl ? (
                  <AppButton
                    variant="choice"
                    size="sm"
                    title={tUi('detail', locale)}
                    onPress={() => onBranchDetailPress(branch)}
                  />
                ) : null}
              </View>
            </View>
          </SurfaceCard>
        ))}
        {promos?.map((promo) => (
          <SurfaceCard key={promo.id} rounded="2xl" className="w-52 overflow-hidden p-0">
            {promo.imageUrl ? (
              <Image
                source={{ uri: promo.imageUrl }}
                className={CARD_HERO_CLASS}
                contentFit="cover"
              />
            ) : null}
            <View className="p-3">
              <ThemedText className="font-semibold">{promo.title}</ThemedText>
              {promo.detailUrl ? (
                <AppButton
                  variant="choice"
                  size="sm"
                  rounded="lg"
                  title={promo.actionLabel ?? tUi('detail', locale)}
                  className="mt-2 self-start"
                  onPress={() => onPromoPress(promo)}
                />
              ) : null}
            </View>
          </SurfaceCard>
        ))}
      </View>
    </ScrollView>
  );
}

interface RbicekMessageBubbleProps {
  text: string;
  isSent: boolean;
  timestamp: number;
  accentColor: string;
  showAvatar?: boolean;
}

export function RbicekMessageBubble({
  text,
  isSent,
  timestamp,
  accentColor,
  showAvatar,
}: RbicekMessageBubbleProps) {
  const time = new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return (
    <View className={`flex-row ${isSent ? 'justify-end' : 'justify-start'} px-4`}>
      <View className="max-w-[80%] shrink">
        <View
          style={isSent ? { backgroundColor: accentColor } : undefined}
          className={`rounded-2xl px-4 py-2 ${!isSent ? 'bg-light-secondary dark:bg-dark-secondary' : ''}`}>
          <RbicekLinkableText text={text} isSent={isSent} accentColor={accentColor} />
          <ThemedText
            className={`mt-1 text-xs ${isSent ? 'text-white/70' : 'text-light-subtext dark:text-dark-subtext'}`}>
            {time}
          </ThemedText>
        </View>
      </View>
      {!isSent && showAvatar ? (
        <Image
          source={OPERATOR_ICON}
          style={{ width: 32, height: 32, borderRadius: 16, marginLeft: 8, marginTop: 4 }}
          contentFit="cover"
        />
      ) : null}
    </View>
  );
}
