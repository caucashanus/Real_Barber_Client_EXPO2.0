import { Image } from 'expo-image';
import React from 'react';
import { ActivityIndicator, ScrollView, TextInput, View } from 'react-native';

import type { ReservationCreateStepProps } from './types';

import Avatar from '@/components/Avatar';
import { Button } from '@/components/Button';
import Icon from '@/components/Icon';
import ThemedText from '@/components/ThemedText';
import Divider from '@/components/layout/Divider';
import Section from '@/components/layout/Section';

export default function ReservationSummaryStep({ flow }: ReservationCreateStepProps) {
  const { t } = flow;

  return (
    <ScrollView className="flex-1 px-global pb-6 pt-2" showsVerticalScrollIndicator={false}>
      <View className="mb-3 items-center">
        <Image
          source={require('@/assets/img/reservation-summary.png')}
          className="h-16 w-16"
          style={{ width: 64, height: 64 }}
          contentFit="contain"
          accessibilityIgnoresInvertColors
        />
      </View>
      <ThemedText className="text-2xl font-bold">{t('reservationSummaryTitle')}</ThemedText>
      <ThemedText className="mt-1 text-sm text-light-subtext dark:text-dark-subtext">
        {t('reservationSummarySubtitle')}
      </ThemedText>

      <Divider className="mt-4 h-2 bg-light-secondary dark:bg-dark-darker" />

      <Section title={t('reservationSummaryBranch')} titleSize="lg" className="pb-1 pt-3">
        <View className="mt-2 overflow-hidden rounded-2xl bg-light-secondary dark:bg-dark-secondary">
          <Image
            source={
              typeof flow.summaryBranchCardImage === 'number'
                ? flow.summaryBranchCardImage
                : { uri: flow.summaryBranchCardImage }
            }
            className="h-40 w-full"
            contentFit="cover"
          />
          <View className="p-3">
            <ThemedText className="text-base font-semibold">
              {flow.branchForServiceStep?.name ?? '—'}
            </ThemedText>
            {flow.branchForServiceStep?.address ? (
              <View className="mt-1.5 flex-row items-start">
                <Icon
                  name="MapPin"
                  size={14}
                  className="mr-1.5 mt-0.5 text-light-subtext dark:text-dark-subtext"
                />
                <ThemedText className="flex-1 text-sm text-light-subtext dark:text-dark-subtext">
                  {flow.branchForServiceStep.address}
                </ThemedText>
              </View>
            ) : null}
          </View>
        </View>
      </Section>

      <Divider className="mt-4 h-2 bg-light-secondary dark:bg-dark-darker" />

      <Section title={t('reservationSummaryWithSpecialist')} titleSize="lg" className="pb-1 pt-3">
        <View className="mt-2 flex-row items-center">
          {flow.selectedEmployee ? (
            <Avatar
              size="md"
              src={flow.selectedEmployee.avatarUrl ?? undefined}
              name={flow.selectedEmployee.name}
            />
          ) : (
            <View className="h-12 w-12 items-center justify-center rounded-full bg-light-secondary dark:bg-dark-secondary">
              <ThemedText className="text-xs text-light-subtext dark:text-dark-subtext">
                —
              </ThemedText>
            </View>
          )}
          <View className="ml-3 min-w-0 flex-1">
            <ThemedText className="text-base font-semibold" numberOfLines={1}>
              {flow.selectedEmployeeName}
            </ThemedText>
            {flow.selectedServiceName !== '—' ? (
              <ThemedText
                className="mt-0.5 text-sm text-light-subtext dark:text-dark-subtext"
                numberOfLines={2}>
                {flow.selectedServiceName}
                {flow.selectedService
                  ? ` · ${t('reservationPriceFromPrefix')} ${flow.selectedService.price} ${t('reservationCurrencySuffix')}`
                  : ''}
              </ThemedText>
            ) : (
              <ThemedText className="mt-0.5 text-sm text-light-subtext dark:text-dark-subtext">
                —
              </ThemedText>
            )}
          </View>
        </View>
      </Section>

      <Divider className="mt-4 h-2 bg-light-secondary dark:bg-dark-darker" />

      <Section title={t('reservationSummaryAppointment')} titleSize="lg" className="pb-1 pt-3">
        <ThemedText className="mt-2 text-base font-semibold">{flow.selectedDateLabel}</ThemedText>
        <View className="mt-2 flex-row items-center justify-between rounded-xl bg-light-secondary p-3 dark:bg-dark-secondary">
          <View>
            <ThemedText className="text-xs text-light-subtext dark:text-dark-subtext">
              {t('reservationSummaryFrom')}
            </ThemedText>
            <ThemedText className="text-base font-semibold">
              {flow.data.slotStart || '—'}
            </ThemedText>
          </View>
          <View className="items-end">
            <ThemedText className="text-xs text-light-subtext dark:text-dark-subtext">
              {t('reservationSummaryTo')}
            </ThemedText>
            <ThemedText className="text-base font-semibold">{flow.data.slotEnd || '—'}</ThemedText>
          </View>
        </View>
        {flow.data.duration > 0 ? (
          <View className="flex-row items-center justify-between pt-2.5">
            <ThemedText className="text-xs text-light-subtext dark:text-dark-subtext">
              {t('reservationSummaryEstimatedDuration')}
            </ThemedText>
            <ThemedText className="text-sm font-semibold">{flow.data.duration} min</ThemedText>
          </View>
        ) : null}
      </Section>

      <Divider className="mt-4 h-2 bg-light-secondary dark:bg-dark-darker" />

      <Section title={t('reservationCouponSectionTitle')} titleSize="lg" className="pb-1 pt-3">
        <View className="mt-2 flex-row items-stretch gap-2">
          <TextInput
            placeholder={t('reservationCouponPlaceholder')}
            placeholderTextColor="#888"
            value={flow.couponCodeInput}
            onChangeText={flow.onCouponCodeChange}
            autoCapitalize="characters"
            autoCorrect={false}
            editable={!flow.couponVerifying}
            className="min-h-[44px] flex-1 rounded-xl border border-neutral-400/30 bg-light-secondary px-3 py-2 text-base text-light-text dark:border-neutral-500/40 dark:bg-dark-secondary dark:text-dark-text"
          />
          <Button
            title={t('reservationCouponVerify')}
            variant="outline"
            size="small"
            loading={flow.couponVerifying}
            disabled={flow.couponVerifying}
            onPress={flow.handleVerifyCoupon}
            className="self-center px-3"
          />
        </View>
        {flow.couponPreview ? (
          <View className="mt-3 rounded-xl bg-light-secondary p-3 dark:bg-dark-secondary">
            {flow.couponPreview.couponName ? (
              <ThemedText className="mb-2 text-sm font-semibold text-light-text dark:text-dark-text">
                {flow.couponPreview.couponName}
              </ThemedText>
            ) : null}
            <View className="flex-row items-center justify-between py-0.5">
              <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">
                {t('reservationCouponOriginalPrice')}
              </ThemedText>
              <ThemedText className="text-sm font-medium">
                {flow.formatReservationPrice(flow.couponPreview.originalPrice)}{' '}
                {t('reservationCurrencySuffix')}
              </ThemedText>
            </View>
            <View className="flex-row items-center justify-between py-0.5">
              <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">
                {t('reservationCouponDiscount')}
              </ThemedText>
              <ThemedText className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                −{flow.formatReservationPrice(flow.couponPreview.discountAmount)}{' '}
                {t('reservationCurrencySuffix')}
              </ThemedText>
            </View>
            <View className="mt-1 flex-row items-center justify-between border-t border-neutral-400/20 pt-2 dark:border-neutral-500/25">
              <ThemedText className="text-sm font-semibold">
                {t('reservationCouponFinalPrice')}
              </ThemedText>
              <ThemedText className="text-base font-bold">
                {flow.formatReservationPrice(flow.couponPreview.finalPrice)}{' '}
                {t('reservationCurrencySuffix')}
              </ThemedText>
            </View>
          </View>
        ) : null}
        {flow.couponPreviewError ? (
          <ThemedText className="mt-2 text-sm text-red-500 dark:text-red-400">
            {flow.couponPreviewError}
          </ThemedText>
        ) : null}
      </Section>

      {flow.creatingBooking ? (
        <View className="mt-3 flex-row items-center justify-center">
          <ActivityIndicator size="small" />
          <ThemedText className="ml-2 text-sm text-light-subtext dark:text-dark-subtext">
            {t('reservationSummaryCreating')}
          </ThemedText>
        </View>
      ) : null}
      {flow.createBookingError ? (
        <ThemedText className="mt-3 text-sm text-red-500 dark:text-red-400">
          {flow.createBookingError}
        </ThemedText>
      ) : null}
    </ScrollView>
  );
}
