import { router } from 'expo-router';
import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { BookingEngineFlow } from '@/app/hooks/useBookingEngineFlow';
import AppButton from '@/components/AppButton';
import ReserveButton from '@/components/ReserveButton';
import {
  BookingEngineScrollProvider,
  useBookingEngineScroll,
} from '@/components/booking/engine/BookingEngineScrollContext';
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
      <BookingEngineFlowShellBody flow={flow}>{children}</BookingEngineFlowShellBody>
    </BookingEngineScrollProvider>
  );
}

function BookingEngineFlowShellBody({ flow, children }: BookingEngineFlowShellProps) {
  const insets = useSafeAreaInsets();
  const { activeSteps, stepLabels, footerAction } = flow;
  const bookingScroll = useBookingEngineScroll();

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-light-primary dark:bg-dark-primary">
      <View
        className="flex-1 bg-light-primary dark:bg-dark-primary"
        style={{ paddingTop: insets.top, paddingBottom: footerAction ? 0 : insets.bottom }}>
        <View className="border-b border-light-secondary px-4 pb-4 pt-2 dark:border-dark-secondary">
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
              onPress={() => router.back()}
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
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
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
            {flow.contact.submitError ? (
              <View className="mb-3 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2">
                <ThemedText className="text-sm text-amber-700 dark:text-amber-300">
                  {flow.contact.submitError}
                </ThemedText>
              </View>
            ) : null}
            {footerAction.variant === 'default' ? (
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
    </KeyboardAvoidingView>
  );
}
