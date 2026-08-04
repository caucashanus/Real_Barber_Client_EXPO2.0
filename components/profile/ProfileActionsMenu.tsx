import { router } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  Linking,
  Modal,
  Pressable,
  View,
  useWindowDimensions,
  type LayoutRectangle,
} from 'react-native';
import { ActionSheetRef } from 'react-native-actions-sheet';

import Icon from '@/components/Icon';
import { ProfileShareSheet } from '@/components/profile/ProfileShareSheet';
import SheetNavRow from '@/components/shared/SheetNavRow';
import ThemedText from '@/components/ThemedText';
import type { TranslationKey } from '@/locales';
import { MENU_SHARE_OPEN_DELAY_MS } from '@/utils/profileShareLinks';
import { buildBarberBookingHref } from '@/utils/teamMemberPageHelpers';

const MENU_WIDTH = 256;
const MENU_SIDE_OFFSET = 6;

type ProfileActionsMenuBaseProps = {
  displayName: string;
  shareUrl: string;
  shareTitle: string;
  shareEmailSubject: string;
  shareEmailBody: string;
  t: (key: TranslationKey) => string;
  /** Hero header nad fotkou (pobočka) — bílá ikona. */
  onDarkBackground?: boolean;
  /** Externí nested share sheet (nearest drawer) — ne-mountovat vlastní. */
  shareSheetRef?: React.RefObject<ActionSheetRef | null>;
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
    shareSheetRef: externalShareSheetRef,
    onLeaveFlow,
  } = props;
  const { width: windowWidth } = useWindowDimensions();
  const [menuVisible, setMenuVisible] = useState(false);
  const [anchor, setAnchor] = useState<LayoutRectangle | null>(null);
  const triggerRef = useRef<View>(null);
  const internalShareSheetRef = useRef<ActionSheetRef>(null);
  const shareSheetRef = externalShareSheetRef ?? internalShareSheetRef;

  const bookLabel =
    props.mode === 'branch' ? t('branchMenuBook') : t('barberMenuBook');

  const openMenu = () => {
    triggerRef.current?.measureInWindow((x, y, width, height) => {
      setAnchor({ x, y, width, height });
      setMenuVisible(true);
    });
  };

  const closeMenu = () => {
    setMenuVisible(false);
  };

  const openShare = () => {
    closeMenu();
    setTimeout(() => {
      shareSheetRef.current?.show();
    }, MENU_SHARE_OPEN_DELAY_MS);
  };

  const handleRate = () => {
    closeMenu();
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
    closeMenu();
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

  const menuLeft =
    anchor != null
      ? Math.max(8, Math.min(anchor.x + anchor.width - MENU_WIDTH, windowWidth - MENU_WIDTH - 8))
      : 0;
  const menuTop = anchor != null ? anchor.y + anchor.height + MENU_SIDE_OFFSET : 0;

  return (
    <>
      <View ref={triggerRef} collapsable={false}>
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
      </View>

      <Modal visible={menuVisible} transparent animationType="fade" onRequestClose={closeMenu}>
        <View className="flex-1">
          <Pressable className="absolute inset-0" onPress={closeMenu} accessibilityRole="button" />
          <View
            style={{ position: 'absolute', top: menuTop, left: menuLeft, width: MENU_WIDTH }}
            className="rounded-lg bg-light-primary p-1.5 shadow-lg dark:bg-dark-primary">
            <SheetNavRow
              label={t('barberMenuShare')}
              icon={<Icon name="Share2" size={16} strokeWidth={1.5} className="opacity-80" />}
              onPress={openShare}
            />
            <SheetNavRow
              label={t('barberMenuRate')}
              icon={
                <ThemedText className="w-4 text-center text-base text-amber-300/90">★</ThemedText>
              }
              onPress={handleRate}
            />
            <SheetNavRow
              label={bookLabel}
              icon={<Icon name="Calendar" size={16} strokeWidth={1.5} className="opacity-80" />}
              onPress={handleBook}
            />
          </View>
        </View>
      </Modal>

      {!externalShareSheetRef ? (
        <ProfileShareSheet
          ref={internalShareSheetRef}
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
