import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { Image } from 'expo-image';
import React, { useCallback, useMemo, useRef } from 'react';
import { FlatList, Pressable, View } from 'react-native';
import { ActionSheetRef } from 'react-native-actions-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RbicekChipRow } from '@/components/rbicek/RbicekChipRow';
import { RbicekCarousel, RbicekMessageBubble } from '@/components/rbicek/RbicekMessageParts';
import { RbicekTypingIndicator } from '@/components/rbicek/RbicekTypingIndicator';
import { OperatorSupportSheet } from '@/components/OperatorSupportSheet';
import Icon from '@/components/Icon';
import ThemedText from '@/components/ThemedText';
import { LOGIN_PATH } from '@/constants/authRoutes';
import { buildBookingEngineHref } from '@/lib/booking/engine/resolvePresetFromParams';
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
  const listRef = useRef<FlatList<ChatMessage>>(null);

  const bridge: RbicekHostBridge = useMemo(
    () => ({
      requestLogin: () => {
        onClose();
        router.push(LOGIN_PATH);
      },
      openMyReservations: () => {
        router.push('/(tabs)/bookings');
      },
      openSupportChannels: () => {
        supportSheetRef.current?.show();
      },
      openBooking: (payload) => {
        onClose();
        router.push(
          buildBookingEngineHref({
            recipe: payload.employeeId ? 'employee-profile' : 'branch-first',
            branchId: payload.branchId,
            employeeId: payload.employeeId,
            itemId: payload.itemId,
          })
        );
      },
      openExternalUrl: (url) => {
        void WebBrowser.openBrowserAsync(url);
      },
      openBarberProfile: (profileUrl) => {
        void WebBrowser.openBrowserAsync(profileUrl);
      },
      openBranchDetail: (detailUrl) => {
        void WebBrowser.openBrowserAsync(detailUrl);
      },
      closeChat: onClose,
    }),
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

  const handleBranchMapsPress = useCallback(
    (branch: BranchCardData) => {
      const url = branch.googleMapsUrl ?? branch.mapsUrl;
      if (url) bridge.openExternalUrl(url);
    },
    [bridge]
  );

  const handleBranchWazePress = useCallback(
    (branch: BranchCardData) => {
      if (branch.wazeUrl) bridge.openExternalUrl(branch.wazeUrl);
    },
    [bridge]
  );

  const handleBranchDetailPress = useCallback(
    (branch: BranchCardData) => {
      if (branch.detailUrl) bridge.openBranchDetail(branch.detailUrl);
    },
    [bridge]
  );

  const handlePromoPress = useCallback(
    (promo: PromoCardData) => {
      if (promo.detailUrl) bridge.openExternalUrl(promo.detailUrl);
    },
    [bridge]
  );

  const renderItem = useCallback(
    ({ item, index }: { item: ChatMessage; index: number }) => {
      const isSent = item.role === 'user';
      const isLastAssistant =
        item.role === 'assistant' &&
        !messages.slice(index + 1).some((m) => m.role === 'assistant' || m.role === 'user');

      return (
        <View className="mb-3 w-full">
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
                onBranchMapsPress={handleBranchMapsPress}
                onBranchWazePress={handleBranchWazePress}
                onBranchDetailPress={handleBranchDetailPress}
                onPromoPress={handlePromoPress}
              />
            </View>
          ) : null}
          {isLastAssistant && item.quickReplies?.length ? (
            <View className="mt-3 w-full" style={{ marginTop: 12 }}>
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
      handleBranchMapsPress,
      handleBranchWazePress,
      handleBranchDetailPress,
      handlePromoPress,
      isLoading,
      selectOption,
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
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: 'flex-end',
          paddingTop: 12,
          paddingBottom: 24,
        }}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        onLayout={() => listRef.current?.scrollToEnd({ animated: false })}
        ListFooterComponent={isLoading ? <RbicekTypingIndicator /> : null}
      />

      <OperatorSupportSheet ref={supportSheetRef} nested />
    </View>
  );
}
