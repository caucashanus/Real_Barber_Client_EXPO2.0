import { router } from 'expo-router';
import React, { useRef } from 'react';
import { Linking, Pressable, View } from 'react-native';
import { ActionSheetRef } from 'react-native-actions-sheet';

import Icon from '@/components/Icon';
import { ProfileActionsSheet } from '@/components/profile/ProfileActionsSheet';
import { ProfileShareSheet } from '@/components/profile/ProfileShareSheet';
import type { TranslationKey } from '@/locales';
import { MENU_SHARE_OPEN_DELAY_MS } from '@/utils/profileShareLinks';
import { buildBarberBookingHref } from '@/utils/teamMemberPageHelpers';

type ProfileActionsMenuBaseProps = {
  displayName: string;
  shareUrl: string;
  shareTitle: string;
  shareEmailSubject: string;
  shareEmailBody: string;
  t: (key: TranslationKey) => string;
  /** Hero header nad fotkou (pobočka) — bílá ikona. */
  onDarkBackground?: boolean;
  /** Externí nested actions sheet (nearest drawer) — ne-mountovat vlastní. */
  actionsSheetRef?: React.RefObject<ActionSheetRef | null>;
  /** Externí nested share sheet (nearest drawer) — ne-mountovat vlastní. */
  shareSheetRef?: React.RefObject<ActionSheetRef | null>;
  /** Nested bottom sheet nad parent drawerem (nearest pobočka). */
  nestedSheets?: boolean;
  /** Před odchodem z flow (booking) — zavře parent nearest sheet. */
  onLeaveFlow?: () => void;
};

type ProfileActionsMenuEmployeeProps = ProfileActionsMenuBaseProps & {
  mode: 'employee';
  employeeId: string;
  onScrollToReviews: () => void;
};

type ProfileActionsMenuBranchProps = ProfileActionsMenuBaseProps & {
  mode: 'branch';
  rateUrl: string | null;
  bookingHref: string;
};

export type ProfileActionsMenuProps =
  | ProfileActionsMenuEmployeeProps
  | ProfileActionsMenuBranchProps;

/** ⋮ menu — Sdílet / Ohodnotit / rezervace (web TeamProfileActionsMenu). */
export default function ProfileActionsMenu(props: ProfileActionsMenuProps) {
  const {
    displayName,
    shareUrl,
    shareTitle,
    shareEmailSubject,
    shareEmailBody,
    t,
    onDarkBackground,
    actionsSheetRef: externalActionsSheetRef,
    shareSheetRef: externalShareSheetRef,
    nestedSheets = false,
    onLeaveFlow,
  } = props;
  const internalActionsSheetRef = useRef<ActionSheetRef>(null);
  const internalShareSheetRef = useRef<ActionSheetRef>(null);
  const actionsSheetRef = externalActionsSheetRef ?? internalActionsSheetRef;
  const shareSheetRef = externalShareSheetRef ?? internalShareSheetRef;

  const bookLabel =
    props.mode === 'branch' ? t('branchMenuBook') : t('barberMenuBook');
  const sheetTitle =
    props.mode === 'branch' ? t('branchMenuOpen') : t('barberMenuOpen');

  const hideActionsSheet = () => {
    actionsSheetRef.current?.hide();
  };

  const openMenu = () => {
    actionsSheetRef.current?.show();
  };

  const openShare = () => {
    hideActionsSheet();
    setTimeout(() => {
      shareSheetRef.current?.show();
    }, MENU_SHARE_OPEN_DELAY_MS);
  };

  const handleRate = () => {
    hideActionsSheet();
    if (props.mode === 'branch') {
      if (!props.rateUrl) return;
      setTimeout(() => {
        void Linking.openURL(props.rateUrl!).catch(() => {});
      }, MENU_SHARE_OPEN_DELAY_MS);
      return;
    }
    setTimeout(() => {
      props.onScrollToReviews();
    }, MENU_SHARE_OPEN_DELAY_MS);
  };

  const handleBook = () => {
    hideActionsSheet();
    const href =
      props.mode === 'branch'
        ? props.bookingHref
        : buildBarberBookingHref({ employeeId: props.employeeId });
    if (onLeaveFlow) {
      onLeaveFlow();
      router.push(href as never);
      return;
    }
    setTimeout(() => {
      router.push(href as never);
    }, MENU_SHARE_OPEN_DELAY_MS);
  };

  return (
    <>
      <Pressable
        onPress={openMenu}
        accessibilityRole="button"
        accessibilityLabel={t('profileMenuAria')}
        className={`h-8 w-8 items-center justify-center rounded-full active:bg-light-secondary/80 dark:active:bg-dark-secondary/80 ${
          onDarkBackground ? 'active:bg-white/10' : ''
        }`}>
        <Icon
          name="EllipsisVertical"
          size={20}
          className={onDarkBackground ? 'text-white opacity-70' : 'opacity-70'}
        />
      </Pressable>

      {!externalActionsSheetRef ? (
        <ProfileActionsSheet
          ref={internalActionsSheetRef}
          nested={nestedSheets}
          title={sheetTitle}
          bookLabel={bookLabel}
          onShare={openShare}
          onRate={handleRate}
          onBook={handleBook}
        />
      ) : null}

      {!externalShareSheetRef ? (
        <ProfileShareSheet
          ref={internalShareSheetRef}
          nested={nestedSheets}
          displayName={displayName}
          shareUrl={shareUrl}
          title={shareTitle}
          emailSubject={shareEmailSubject}
          emailBody={shareEmailBody}
        />
      ) : null}
    </>
  );
}
