import React, { useMemo, useRef } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { ActionSheetRef } from 'react-native-actions-sheet';

import type { BookingEngineFlow } from '@/hooks/useBookingEngineFlow';
import AppButton from '@/components/AppButton';
import ReserveButton from '@/components/ReserveButton';
import ConfirmationModal from '@/components/ConfirmationModal';
import {
  BookingEngineScrollProvider,
  useBookingEngineScroll,
} from '@/components/booking/engine/BookingEngineScrollContext';
import { BookingCouponSheetsHost } from '@/components/booking/engine/BookingCouponSheetsHost';
import StepProgressIndicator from '@/components/StepProgressIndicator';
import Icon from '@/components/Icon';
import ThemedText from '@/components/ThemedText';

interface BookingEngineFlowShellProps {
  flow: BookingEngineFlow;
  children: React.ReactNode;
}

export default function BookingEngineFlowShell({ flow, children }: BookingEngineFlowShellProps) {
  return (
    <BookingEngineScrollProvider>
      <BookingCouponSheetsHost flow={flow}>
        <BookingEngineFlowShellBody flow={flow}>{children}</BookingEngineFlowShellBody>
      </BookingCouponSheetsHost>
    </BookingEngineScrollProvider>
  );
}

function BookingEngineFlowShellBody({ flow, children }: BookingEngineFlowShellProps) {
  const insets = useSafeAreaInsets();
  const { activeSteps, stepLabels, footerAction } = flow;
  const bookingScroll = useBookingEngineScroll();
  const holdDialogRef = useRef<ActionSheetRef>(null);

  const holdDialogCopy = useMemo(() => {
    if (flow.hold.dialogKind === 'expired') {
      return {
        title: flow.t('bookingHoldExpiredTitle'),
        message: flow.t('bookingHoldExpiredDescription'),
        confirmText: flow.t('bookingHoldExpiredConfirm'),
      };
    }
    if (flow.hold.dialogKind === 'unavailable') {
      return {
        title: flow.t('bookingHoldUnavailableTitle'),
        message: flow.t('bookingHoldUnavailableDescription'),
        confirmText: flow.t('bookingHoldUnavailableConfirm'),
      };
    }
    return null;
  }, [flow.hold.dialogKind, flow.t]);

  React.useEffect(() => {
    if (holdDialogCopy) {
      holdDialogRef.current?.show();
    }
  }, [holdDialogCopy]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-light-primary dark:bg-dark-primary">
      <View
        className="flex-1 bg-light-primary dark:bg-dark-primary"
        style={{ paddingTop: insets.top, paddingBottom: footerAction ? 0 : insets.bottom }}>
        <View className="px-4 pb-4 pt-2">
          <View className="mb-3 flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              {flow.stepIndex > 0 ? (
                <Pressable
                  onPress={flow.handleBack}
                  className="rounded-full p-2 active:opacity-70"
                  hitSlop={8}>
                  <Icon name="ArrowLeft" size={24} className="text-light-text dark:text-dark-text" />
                </Pressable>
              ) : (
                <View className="w-10" />
              )}
            </View>
            <Pressable
              onPress={flow.leaveBookingFlow}
              className="rounded-full p-2 active:opacity-70"
              hitSlop={8}>
              <Icon name="X" size={24} className="text-light-text dark:text-dark-text" />
            </Pressable>
          </View>
          <StepProgressIndicator
            layout="full"
            stepCount={activeSteps.length}
            currentStepIndex={flow.stepIndex}
            labels={activeSteps.map((stepId) => stepLabels[stepId] ?? stepId)}
            onStepPress={(index) => {
              const target = activeSteps[index];
              if (target) flow.goToStepByKind(target);
            }}
          />
        </View>

        <ScrollView
          ref={bookingScroll?.scrollRef}
          className="flex-1"
          contentContainerStyle={{
            padding: 16,
            paddingBottom: footerAction ? 120 : 32,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          scrollEventThrottle={16}
          onScroll={bookingScroll?.onScrollViewScroll}
          onLayout={(event) => bookingScroll?.onScrollViewLayout(event.nativeEvent.layout.height)}>
          <View ref={bookingScroll?.contentRef} collapsable={false}>
            {children}
          </View>
        </ScrollView>

        {footerAction ? (
          <View
            className="border-t border-light-secondary bg-light-secondary px-4 py-3 dark:border-dark-secondary dark:bg-dark-secondary"
            style={{ paddingBottom: Math.max(insets.bottom, 12) }}>
            {flow.contact.submitError || flow.hold.createError ? (
              <View className="mb-3 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2">
                <ThemedText className="text-sm text-amber-700 dark:text-amber-300">
                  {flow.contact.submitError ??
                    flow.t('bookingHoldFailed')}
                </ThemedText>
              </View>
            ) : null}
            {footerAction.variant === 'submit' ? (
              <ReserveButton
                title={footerAction.title}
                size="lg"
                rounded="full"
                fullWidth
                className="w-full"
                loading={footerAction.loading}
                disabled={footerAction.disabled}
                onPress={footerAction.onPress}
              />
            ) : footerAction.variant === 'continue' ? (
              <AppButton
                title={footerAction.title}
                size="lg"
                rounded="full"
                fullWidth
                className="w-full bg-light-text dark:bg-dark-text"
                textClassName="font-semibold text-light-primary dark:text-dark-primary"
                loading={footerAction.loading}
                disabled={footerAction.disabled}
                onPress={footerAction.onPress}
              />
            ) : (
              <AppButton
                title={footerAction.title}
                variant="outline"
                size="lg"
                rounded="full"
                fullWidth
                className="w-full"
                loading={footerAction.loading}
                disabled={footerAction.disabled}
                onPress={footerAction.onPress}
              />
            )}
          </View>
        ) : null}
      </View>

      {holdDialogCopy ? (
        <ConfirmationModal
          actionSheetRef={holdDialogRef}
          title={holdDialogCopy.title}
          message={holdDialogCopy.message}
          confirmText={holdDialogCopy.confirmText}
          cancelText={flow.t('commonCancel')}
          onConfirm={() => flow.handleHoldDialogConfirm()}
          onCancel={() => flow.hold.dismissDialog()}
        />
      ) : null}
    </KeyboardAvoidingView>
  );
}
