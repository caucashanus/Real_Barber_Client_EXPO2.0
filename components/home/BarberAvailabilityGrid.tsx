import { router } from 'expo-router';
import React, { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, useWindowDimensions, View } from 'react-native';

import type { Locale } from '@/app/contexts/LanguageContext';
import FavoriteMediaCard from '@/components/favorites/FavoriteMediaCard';
import HomeTodayTeamWaitlistSheet, {
  type HomeTodayTeamWaitlistSheetHandle,
} from '@/components/home/HomeTodayTeamWaitlistSheet';
import LiveIndicator from '@/components/LiveIndicator';
import Grid from '@/components/layout/Grid';
import SlotTimePill from '@/components/SlotTimePill';
import ThemedText from '@/components/ThemedText';
import type { TranslationKey } from '@/locales';
import type { HomeTodayTeamCardModel } from '@/utils/homeTodayTeamHelpers';
import { resolveHomeTodaySlotBranch } from '@/utils/homeTodayTeamHelpers';
import {
  isHomeTodayWaitlistJoined,
  markHomeTodayWaitlistJoined,
} from '@/utils/homeTodayTeamWaitlistSession';
import { startBarberSlotHandoffBooking } from '@/utils/reservationSlotHandoff';

const DESKTOP_BREAKPOINT = 768;
const GRID_GAP = 16;
const CARD_META_GAP_CLASS = 'w-full flex-col gap-0.5';
const CARD_SHIFT_STATUS_CLASS = 'w-full text-xs leading-4 text-gray-500 dark:text-gray-300';
const CARD_HINT_CLASS = 'w-full text-xs leading-4 text-light-subtext dark:text-dark-subtext';
const CARD_ACTION_ROW_CLASS = 'w-full flex-row flex-wrap items-start';
const CARD_FOOTER_GAP_CLASS = 'mt-2 w-full';

function shouldShowShiftStatus(card: HomeTodayTeamCardModel): boolean {
  return Boolean(card.shiftStatusLabel);
}

function getCardHint(
  card: HomeTodayTeamCardModel,
  isWaitlistJoined: boolean,
  t: (key: TranslationKey) => string
): string | null {
  switch (card.footer.kind) {
    case 'slots':
      return card.footer.hint;
    case 'waitlist':
      if (isWaitlistJoined) {
        return t('homeTodayTeamWaitlistJoined');
      }
      return card.waitlistRequireActiveNow
        ? t('homeTodayTeamWaitlistHint')
        : t('barberFullyBookedThatDay');
    case 'message':
      return card.footer.text;
    default:
      return null;
  }
}

function renderActionRow({
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
  if (card.footer.kind === 'waitlist') {
    if (isWaitlistJoined) return null;
    return (
      <View className={CARD_ACTION_ROW_CLASS}>
        <SlotTimePill
          compact
          spaced
          title={t('homeTodayTeamWaitlistJoin')}
          onPress={() => onOpenWaitlist(card)}
        />
      </View>
    );
  }

  if (card.footer.kind !== 'slots') return null;

  return (
    <View className={CARD_ACTION_ROW_CLASS}>
      {card.footer.slots.map((slot) => {
        const { branchName, branchAddress } = resolveHomeTodaySlotBranch(
          card.branches,
          slot.branchId,
          locale
        );
        return (
          <SlotTimePill
            key={`${slot.date}-${slot.time}-${slot.branchId}`}
            compact
            spaced
            time={slot.time}
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
        compact
        spaced
        title={t('homeTodayTeamMoreSlots')}
        onPress={() => router.push(`/screens/barber-detail?id=${card.id}`)}
      />
    </View>
  );
}

function BarberAvailabilityGridCard({
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
  const hint = getCardHint(card, isWaitlistJoined, t);
  const showShiftStatus = shouldShowShiftStatus(card);
  const actionRow = renderActionRow({
    card,
    locale,
    t,
    isWaitlistJoined,
    onOpenWaitlist,
  });
  const belowTitle =
    showShiftStatus || hint ? (
      <View className={CARD_META_GAP_CLASS}>
        {showShiftStatus ? (
          <ThemedText className={CARD_SHIFT_STATUS_CLASS} numberOfLines={2}>
            {card.shiftStatusLabel}
          </ThemedText>
        ) : null}
        {hint ? (
          <ThemedText className={CARD_HINT_CLASS} numberOfLines={2}>
            {hint}
          </ThemedText>
        ) : null}
      </View>
    ) : null;

  return (
    <FavoriteMediaCard
      href={`/screens/barber-detail?id=${card.id}`}
      title={card.name}
      image={card.avatarUrl ?? require('@/assets/img/barbers.png')}
      entityType="employee"
      entityId={card.id}
      titleTrailing={
        card.liveDotVariant ? (
          <LiveIndicator variant={card.liveDotVariant} size="sm" animated={false} />
        ) : null
      }
      belowTitle={belowTitle}
      footer={actionRow ? <View className={CARD_FOOTER_GAP_CLASS}>{actionRow}</View> : null}
    />
  );
}

interface BarberAvailabilityGridProps {
  cards: HomeTodayTeamCardModel[];
  locale: Locale;
  t: (key: TranslationKey) => string;
  refreshing?: boolean;
  className?: string;
}

export default function BarberAvailabilityGrid({
  cards,
  locale,
  t,
  refreshing = false,
  className = '',
}: BarberAvailabilityGridProps) {
  const { width: windowWidth } = useWindowDimensions();
  const gridColumns = windowWidth >= DESKTOP_BREAKPOINT ? 4 : 2;
  const waitlistSheetRef = useRef<HomeTodayTeamWaitlistSheetHandle>(null);
  const [waitlistJoinedKeys, setWaitlistJoinedKeys] = useState<string[]>(() =>
    cards
      .filter((card) => isHomeTodayWaitlistJoined(card.id, card.waitlistDayIso))
      .map((card) => `${card.id}:${card.waitlistDayIso}`)
  );

  const handleOpenWaitlist = useCallback((card: HomeTodayTeamCardModel) => {
    waitlistSheetRef.current?.open({
      employeeId: card.id,
      employeeName: card.name,
      branchId:
        card.waitlistBranchId ??
        (card.footer.kind === 'waitlist' ? card.footer.branchId : undefined),
      dayIso: card.waitlistDayIso,
      requireActiveNow: card.waitlistRequireActiveNow,
    });
  }, []);

  const handleWaitlistJoined = useCallback((employeeId: string, dayIso?: string) => {
    markHomeTodayWaitlistJoined(employeeId, dayIso);
    const key = `${employeeId}:${dayIso ?? ''}`;
    setWaitlistJoinedKeys((current) => (current.includes(key) ? current : [...current, key]));
  }, []);

  const isCardWaitlistJoined = useCallback(
    (card: HomeTodayTeamCardModel) => {
      const key = `${card.id}:${card.waitlistDayIso}`;
      return (
        waitlistJoinedKeys.includes(key) ||
        isHomeTodayWaitlistJoined(card.id, card.waitlistDayIso)
      );
    },
    [waitlistJoinedKeys]
  );

  return (
    <>
      <View className={`relative ${className}`}>
        {refreshing ? (
          <View className="absolute right-0 top-1 z-10">
            <ActivityIndicator size="small" />
          </View>
        ) : null}
        <Grid className="mt-2" columns={gridColumns} spacing={GRID_GAP}>
          {cards.map((card) => (
            <BarberAvailabilityGridCard
              key={card.id}
              card={card}
              locale={locale}
              t={t}
              isWaitlistJoined={isCardWaitlistJoined(card)}
              onOpenWaitlist={handleOpenWaitlist}
            />
          ))}
        </Grid>
      </View>

      <HomeTodayTeamWaitlistSheet
        ref={waitlistSheetRef}
        onJoined={handleWaitlistJoined}
        t={t}
      />
    </>
  );
}
