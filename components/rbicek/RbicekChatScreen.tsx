import { router } from 'expo-router';
import { Image } from 'expo-image';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { FlatList, Pressable, View } from 'react-native';
import { ActionSheetRef } from 'react-native-actions-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RbicekChipRow } from '@/components/rbicek/RbicekChipRow';
import { RbicekCarousel, RbicekMessageBubble } from '@/components/rbicek/RbicekMessageParts';
import { RbicekTypingIndicator } from '@/components/rbicek/RbicekTypingIndicator';
import { BranchNavigateSheet } from '@/components/BranchNavigateSheet';
import { OperatorSupportSheet } from '@/components/OperatorSupportSheet';
import Icon from '@/components/Icon';
import ThemedText from '@/components/ThemedText';
import { LOGIN_PATH } from '@/constants/authRoutes';
import { RBICEK_WEB_BASE_URL } from '@/constants/rbicek';
import { buildBookingEngineHref } from '@/lib/booking/engine/resolvePresetFromParams';
import { openRbicekHostUrl, opensInAppScreen } from '@/lib/rbicek/openLinkUrl';
import { tUi } from '@/lib/rbicek/port/i18n/ui';
import type {
  BranchCardData,
  ChatMessage,
  PromoCardData,
  RbicekHostBridge,
  SlotCardData,
  TeamMemberCardData,
} from '@/lib/rbicek/types';
import { useRbicekChat } from '@/lib/rbicek/useRbicekChat';
import { useAccentColor } from '@/contexts/AccentColorContext';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import {
  resolveBranchNavigationMeta,
  type BranchNavigationMeta,
} from '@/utils/resolveBranchNavigationMeta';

const OPERATOR_ICON = require('@/assets/img/operator.png');

export interface RbicekChatScreenProps {
  visible: boolean;
  onClose: () => void;
}

export function RbicekChatScreen({ visible, onClose }: RbicekChatScreenProps) {
  const insets = useSafeAreaInsets();
  const { locale } = useLanguage();
  const { isDark } = useTheme();
  const { accentColor } = useAccentColor();
  const { apiToken, client } = useAuth();
  const supportSheetRef = useRef<ActionSheetRef>(null);
  const branchNavigateRef = useRef<ActionSheetRef>(null);
  const [branchNavigateMeta, setBranchNavigateMeta] = useState<BranchNavigationMeta | null>(null);
  const listRef = useRef<FlatList<ChatMessage>>(null);
  const listHeightRef = useRef(0);
  const contentHeightRef = useRef(0);
  const prevMessageCountRef = useRef(0);
  const pendingScrollToEndRef = useRef(false);
  const scrollToEndTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [contentOverflows, setContentOverflows] = useState(false);

  const scheduleScrollToEnd = useCallback(() => {
    if (scrollToEndTimerRef.current) clearTimeout(scrollToEndTimerRef.current);
    scrollToEndTimerRef.current = setTimeout(() => {
      scrollToEndTimerRef.current = null;
      if (!pendingScrollToEndRef.current) return;
      if (contentHeightRef.current <= listHeightRef.current + 8) {
        pendingScrollToEndRef.current = false;
        return;
      }
      pendingScrollToEndRef.current = false;
      listRef.current?.scrollToEnd({ animated: true });
    }, 48);
  }, []);

  const bridge: RbicekHostBridge = useMemo(
    () => {
      /** Jakákoli navigace mimo chat → nejdřív zavřít fullscreen modal, pak teprve router. */
      const leaveChatThen = (navigate: () => void) => {
        onClose();
        navigate();
      };

      const openUrl = (url: string) => {
        if (opensInAppScreen(url)) {
          onClose();
        }
        void openRbicekHostUrl(url, RBICEK_WEB_BASE_URL);
      };

      return {
      /** loginRequest */
      requestLogin: () => {
        leaveChatThen(() => router.push(LOGIN_PATH));
      },
      /** openReservations */
      openMyReservations: () => {
        leaveChatThen(() => router.push('/(tabs)/bookings'));
      },
      /** supportRequest — sheet nad chatem, chat zůstává otevřený */
      openSupportChannels: () => {
        supportSheetRef.current?.show();
      },
      openBooking: (payload) => {
        leaveChatThen(() =>
          router.push(
            buildBookingEngineHref({
              recipe: payload.employeeId ? 'employee-profile' : 'branch-first',
              branchId: payload.branchId,
              employeeId: payload.employeeId,
              itemId: payload.itemId,
            })
          )
        );
      },
      openUrl,
      openExternalUrl: openUrl,
      openBarberProfile: openUrl,
      openBranchDetail: openUrl,
      closeChat: onClose,
    };
    },
    [onClose]
  );

  const displayName = client?.name?.trim() || null;

  const { messages, isLoading, selectOption, navigateToNode, restartConversation, config } =
    useRbicekChat({
      visible,
      locale,
      theme: isDark ? 'dark' : 'light',
      accentColor,
      isLoggedIn: Boolean(apiToken && client),
      userToken: apiToken,
      userId: client?.id,
      userDisplayName: displayName,
      bridge,
    });

  const applyScrollLayout = useCallback(
    (messageCount: number, scrollOnGrowth: boolean) => {
      const overflows = contentHeightRef.current > listHeightRef.current + 8;
      setContentOverflows(overflows);

      if (!overflows) {
        pendingScrollToEndRef.current = false;
        listRef.current?.scrollToOffset({ offset: 0, animated: false });
        prevMessageCountRef.current = messageCount;
        return;
      }

      if (scrollOnGrowth && messageCount > prevMessageCountRef.current) {
        pendingScrollToEndRef.current = true;
        scheduleScrollToEnd();
      }

      prevMessageCountRef.current = messageCount;
    },
    [scheduleScrollToEnd]
  );

  const handleTrailingContentLayout = useCallback(() => {
    if (!pendingScrollToEndRef.current) return;
    scheduleScrollToEnd();
  }, [scheduleScrollToEnd]);

  const contentContainerStyle = useMemo(
    () => ({
      flexGrow: 1,
      justifyContent: contentOverflows ? ('flex-end' as const) : ('flex-start' as const),
      paddingTop: 12,
      paddingBottom: 24,
    }),
    [contentOverflows]
  );

  const handleSlotPress = useCallback(
    (slot: SlotCardData) => {
      bridge.openBooking({
        employeeId: slot.employeeId,
        branchId: slot.branchId,
        date: slot.dateRaw,
        slotStart: slot.time,
      });
    },
    [bridge]
  );

  const handleTeamBookPress = useCallback(
    (member: TeamMemberCardData) => {
      if (member.fullyBookedToday) return;
      bridge.openBooking({
        employeeId: member.employeeId,
        branchId: member.branchId,
        date: member.nextSlotDateRaw,
        slotStart: member.nextSlotTime,
      });
    },
    [bridge]
  );

  const handleTeamProfilePress = useCallback(
    (member: TeamMemberCardData) => {
      if (member.profileUrl) {
        bridge.openBarberProfile(member.profileUrl);
        return;
      }
      bridge.openBooking({ employeeId: member.employeeId, branchId: member.branchId });
    },
    [bridge]
  );

  const handleTeamWaitlistPress = useCallback(
    (label: string) => {
      navigateToNode('waitlist_answer', label);
    },
    [navigateToNode]
  );

  const handleBranchNavigatePress = useCallback((branch: BranchCardData) => {
    setBranchNavigateMeta(resolveBranchNavigationMeta(branch));
    branchNavigateRef.current?.show();
  }, []);

  const handleBranchDetailPress = useCallback(
    (branch: BranchCardData) => {
      if (branch.detailUrl) bridge.openBranchDetail(branch.detailUrl);
    },
    [bridge]
  );

  const handlePromoPress = useCallback(
    (promo: PromoCardData) => {
      if (promo.detailUrl) bridge.openUrl(promo.detailUrl);
    },
    [bridge]
  );

  const renderItem = useCallback(
    ({ item, index }: { item: ChatMessage; index: number }) => {
      const isSent = item.role === 'user';
      const isLastAssistant =
        item.role === 'assistant' &&
        !messages.slice(index + 1).some((m) => m.role === 'assistant' || m.role === 'user');
      const isLastMessage = index === messages.length - 1;
      const hasChips = Boolean(isLastAssistant && item.quickReplies?.length);

      return (
        <View
          className="mb-3 w-full"
          onLayout={isLastMessage && !hasChips ? handleTrailingContentLayout : undefined}>
          <RbicekMessageBubble
            text={item.text}
            isSent={isSent}
            timestamp={item.timestamp}
            accentColor={accentColor}
            showAvatar={!isSent && item.showAvatar}
          />
          {item.slots?.length || item.team?.length || item.branches?.length || item.promos?.length ? (
            <View className="mt-3 w-full">
              <RbicekCarousel
                locale={locale}
                slots={item.slots}
                team={item.team}
                branches={item.branches}
                promos={item.promos}
                onSlotPress={handleSlotPress}
                onTeamBookPress={handleTeamBookPress}
                onTeamProfilePress={handleTeamProfilePress}
                onTeamWaitlistPress={handleTeamWaitlistPress}
                onBranchNavigatePress={handleBranchNavigatePress}
                onBranchDetailPress={handleBranchDetailPress}
                onPromoPress={handlePromoPress}
              />
            </View>
          ) : null}
          {isLastAssistant && item.quickReplies?.length ? (
            <View
              className="mt-3 w-full"
              style={{ marginTop: 12 }}
              onLayout={isLastMessage ? handleTrailingContentLayout : undefined}>
              <RbicekChipRow
                replies={item.quickReplies}
                disabled={item.chipsExpired || isLoading}
                onSelect={(id) => {
                  void selectOption(id);
                }}
              />
            </View>
          ) : null}
        </View>
      );
    },
    [
      messages,
      locale,
      accentColor,
      handleSlotPress,
      handleTeamBookPress,
      handleTeamProfilePress,
      handleTeamWaitlistPress,
      handleBranchNavigatePress,
      handleBranchDetailPress,
      handlePromoPress,
      isLoading,
      selectOption,
      handleTrailingContentLayout,
    ]
  );

  return (
    <View
      className="flex-1 bg-light-primary dark:bg-dark-primary"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
      <View className="flex-row items-center border-b border-light-secondary px-4 py-3 dark:border-dark-secondary">
        <View className="w-10 items-start">
          <Pressable onPress={onClose} className="rounded-full p-1" hitSlop={8}>
            <Icon name="X" size={24} className="text-light-text dark:text-dark-text" />
          </Pressable>
        </View>
        <View className="min-w-0 flex-1 flex-row items-center justify-center gap-2">
          <Image
            source={OPERATOR_ICON}
            style={{ width: 24, height: 24, borderRadius: 12 }}
            contentFit="cover"
          />
          <ThemedText className="text-lg font-semibold">{tUi('assistantTitle', locale)}</ThemedText>
        </View>
        <View className="w-10 items-end">
          <Pressable
            onPress={() => {
              void restartConversation();
            }}
            className="rounded-full p-1"
            hitSlop={8}>
            <Icon name="RotateCcw" size={22} className="text-light-text dark:text-dark-text" />
          </Pressable>
        </View>
      </View>

      {!config.isLoggedIn ? (
        <Pressable
          onPress={() => bridge.requestLogin()}
          className="mx-4 mt-3 rounded-2xl bg-light-secondary px-4 py-3 dark:bg-dark-secondary">
          <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">
            {tUi('loginBanner', locale)}
          </ThemedText>
        </Pressable>
      ) : null}

      <FlatList
        ref={listRef}
        className="flex-1"
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={contentContainerStyle}
        onLayout={(event) => {
          listHeightRef.current = event.nativeEvent.layout.height;
          applyScrollLayout(messages.length, false);
        }}
        onContentSizeChange={(_, height) => {
          contentHeightRef.current = height;
          applyScrollLayout(messages.length, true);
        }}
        ListFooterComponent={isLoading ? <RbicekTypingIndicator /> : null}
      />

      <OperatorSupportSheet ref={supportSheetRef} />
      <BranchNavigateSheet
        ref={branchNavigateRef}
        branchName={branchNavigateMeta?.branchName}
        address={branchNavigateMeta?.address}
        latitude={branchNavigateMeta?.latitude}
        longitude={branchNavigateMeta?.longitude}
      />
    </View>
  );
}
