import { router } from 'expo-router';
import React, { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';

import type { HomeTodayTeamCardModel } from '@/utils/homeTodayTeamHelpers';
import AppButton from '@/components/AppButton';
import Card from '@/components/Card';
import { CardScroller } from '@/components/CardScroller';
import LiveIndicator from '@/components/LiveIndicator';
import SlotTimePill from '@/components/SlotTimePill';
import HomeTodayTeamWaitlistSheet, {
  type HomeTodayTeamWaitlistSheetHandle,
} from '@/components/home/HomeTodayTeamWaitlistSheet';
import ThemedText from '@/components/ThemedText';
import Section from '@/components/layout/Section';
import type { Locale } from '@/app/contexts/LanguageContext';
import type { TranslationKey } from '@/locales';
import { resolveHomeTodaySlotBranch } from '@/utils/homeTodayTeamHelpers';
import {
  isHomeTodayWaitlistJoined,
  markHomeTodayWaitlistJoined,
} from '@/utils/homeTodayTeamWaitlistSession';
import { startBarberSlotHandoffBooking } from '@/utils/reservationSlotHandoff';

const TODAY_TEAM_CARD_WIDTH = 160;
const TODAY_TEAM_IMAGE_HEIGHT = 160;
const CARD_TEXT_ROW_GAP_CLASS = 'w-full flex-col gap-0.5';
const CARD_SLOT_BUTTON_SPACING_CLASS = 'mr-1.5 mb-1';

interface HomeTodayTeamSectionProps {
  cards: HomeTodayTeamCardModel[];
  loading: boolean;
  refreshingAvailability: boolean;
  error: string | null;
  locale: Locale;
  t: (key: TranslationKey) => string;
}

function renderHomeTodayTeamSlotButtons({
  card,
  locale,
  t,
}: {
  card: HomeTodayTeamCardModel;
  locale: Locale;
  t: (key: TranslationKey) => string;
}) {
  if (card.footer.kind !== 'slots') return null;

  return (
    <View className="w-full flex-row flex-wrap items-start justify-start">
      {card.footer.slots.map((slot) => {
        const { branchName, branchAddress } = resolveHomeTodaySlotBranch(
          card.branches,
          slot.branchId,
          locale
        );
        return (
          <SlotTimePill
            key={`${slot.date}-${slot.time}-${slot.branchId}`}
            className={CARD_SLOT_BUTTON_SPACING_CLASS}
            label={slot.time}
            onPress={() => {
              startBarberSlotHandoffBooking({
                employeeId: card.id,
                employeeName: card.name,
                branchId: slot.branchId,
                branchName,
                branchAddress,
                date: slot.date,
                slotStart: slot.time,
                slotEnd: slot.endTime,
              }).catch(() => {});
            }}
          />
        );
      })}
      <SlotTimePill
        className={CARD_SLOT_BUTTON_SPACING_CLASS}
        label={t('homeTodayTeamMoreSlots')}
        onPress={() => router.push(`/screens/barber-detail?id=${card.id}`)}
      />
    </View>
  );
}

function renderHomeTodayTeamCardFooter({
  card,
  locale,
  t,
  isWaitlistJoined,
  onOpenWaitlist,
}: {
  card: HomeTodayTeamCardModel;
  locale: Locale;
  t: (key: TranslationKey) => string;
  isWaitlistJoined: boolean;
  onOpenWaitlist: (card: HomeTodayTeamCardModel) => void;
}): React.ReactNode {
  const { footer } = card;
  const footerTextClassName = 'text-xs leading-4 text-light-subtext dark:text-dark-subtext';

  if (footer.kind === 'hidden') return null;

  if (footer.kind === 'waitlist') {
    return (
      <View className={CARD_TEXT_ROW_GAP_CLASS}>
        <ThemedText className={footerTextClassName}>
          {isWaitlistJoined
            ? t('homeTodayTeamWaitlistJoined')
            : t('homeTodayTeamWaitlistHint')}
        </ThemedText>
        {!isWaitlistJoined ? (
          <AppButton
            variant="outline"
            size="xs"
            title={t('homeTodayTeamWaitlistJoin')}
            onPress={() => onOpenWaitlist(card)}
            className="self-start"
          />
        ) : null}
      </View>
    );
  }

  if (footer.kind === 'slots') {
    return null;
  }

  return (
    <ThemedText className={footerTextClassName}>
      {footer.text}
    </ThemedText>
  );
}

function HomeTodayTeamScrollerCard({
  card,
  locale,
  t,
  isWaitlistJoined,
  onOpenWaitlist,
}: {
  card: HomeTodayTeamCardModel;
  locale: Locale;
  t: (key: TranslationKey) => string;
  isWaitlistJoined: boolean;
  onOpenWaitlist: (card: HomeTodayTeamCardModel) => void;
}) {
  return (
    <View style={{ width: TODAY_TEAM_CARD_WIDTH }}>
      <Card
        title={card.name}
        hideDetails
        rounded="2xl"
        hasFavorite
        favoriteEntityType="employee"
        favoriteEntityId={card.id}
        href={`/screens/barber-detail?id=${card.id}`}
        width={TODAY_TEAM_CARD_WIDTH}
        imageHeight={TODAY_TEAM_IMAGE_HEIGHT}
        image={card.avatarUrl ?? require('@/assets/img/barbers.png')}
      />

      <Pressable
        onPress={() => router.push(`/screens/barber-detail?id=${card.id}`)}
        className="w-full pt-2">
        <View className={CARD_TEXT_ROW_GAP_CLASS}>
          <View className="w-full flex-row items-center">
            <ThemedText className="shrink text-sm font-medium leading-4" numberOfLines={1}>
              {card.name}
            </ThemedText>
            {card.liveDotVariant ? (
              <View className="ml-2 shrink-0">
                <LiveIndicator variant={card.liveDotVariant} size="sm" animated={false} />
              </View>
            ) : null}
          </View>

          {card.shiftStatusLabel ? (
            <ThemedText
              className="w-full text-xs leading-4 text-gray-500 dark:text-gray-300"
              numberOfLines={1}>
              {card.shiftStatusLabel}
            </ThemedText>
          ) : null}

          {card.footer.kind === 'slots' ? (
            <ThemedText className="w-full text-xs leading-4 text-light-subtext dark:text-dark-subtext">
              {card.footer.hint}
            </ThemedText>
          ) : null}

          {card.footer.kind === 'slots' ? renderHomeTodayTeamSlotButtons({ card, locale, t }) : null}

          {card.footer.kind !== 'slots'
            ? renderHomeTodayTeamCardFooter({
                card,
                locale,
                t,
                isWaitlistJoined,
                onOpenWaitlist,
              })
            : null}
        </View>
      </Pressable>
    </View>
  );
}

export default function HomeTodayTeamSection({
  cards,
  loading,
  refreshingAvailability,
  error,
  locale,
  t,
}: HomeTodayTeamSectionProps) {
  const waitlistSheetRef = useRef<HomeTodayTeamWaitlistSheetHandle>(null);
  const [waitlistJoinedIds, setWaitlistJoinedIds] = useState<string[]>(() =>
    cards.filter((card) => isHomeTodayWaitlistJoined(card.id)).map((card) => card.id)
  );

  const handleOpenWaitlist = useCallback((card: HomeTodayTeamCardModel) => {
    waitlistSheetRef.current?.open({
      employeeId: card.id,
      employeeName: card.name,
      branchId:
        card.waitlistBranchId ??
        (card.footer.kind === 'waitlist' ? card.footer.branchId : undefined),
    });
  }, []);

  const handleWaitlistJoined = useCallback((employeeId: string) => {
    markHomeTodayWaitlistJoined(employeeId);
    setWaitlistJoinedIds((current) =>
      current.includes(employeeId) ? current : [...current, employeeId]
    );
  }, []);

  const isCardWaitlistJoined = useCallback(
    (employeeId: string) =>
      waitlistJoinedIds.includes(employeeId) || isHomeTodayWaitlistJoined(employeeId),
    [waitlistJoinedIds]
  );

  return (
    <>
      <Section
        title={t('homeTodayTeamTitle')}
        titleSize="lg"
        titleTrailingAlign="end"
        titleTrailing={
          <AppButton
            variant="outline"
            size="sm"
            title={t('experienceSchedule')}
            href="/screens/schedule"
          />
        }
      />
      {loading ? (
        <View className="mt-2 items-center py-6">
          <ActivityIndicator size="small" />
          <ThemedText className="mt-2 text-sm text-light-subtext dark:text-dark-subtext">
            {t('homeTodayTeamLoading')}
          </ThemedText>
        </View>
      ) : error ? (
        <View className="mt-2 py-4">
          <ThemedText className="text-sm text-red-500 dark:text-red-400">
            {t('homeTodayTeamLoadError')}
          </ThemedText>
        </View>
      ) : cards.length === 0 ? (
        <View className="mt-2 py-4">
          <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">
            {t('homeTodayTeamEmpty')}
          </ThemedText>
        </View>
      ) : (
        <View className="relative">
          {refreshingAvailability ? (
            <View className="absolute right-0 top-1 z-10">
              <ActivityIndicator size="small" />
            </View>
          ) : null}
          <CardScroller space={15} className="mt-1.5 pb-4">
            {cards.map((card) => (
              <HomeTodayTeamScrollerCard
                key={card.id}
                card={card}
                locale={locale}
                t={t}
                isWaitlistJoined={isCardWaitlistJoined(card.id)}
                onOpenWaitlist={handleOpenWaitlist}
              />
            ))}
          </CardScroller>
        </View>
      )}

      <HomeTodayTeamWaitlistSheet
        ref={waitlistSheetRef}
        onJoined={handleWaitlistJoined}
        t={t}
      />
    </>
  );
}
