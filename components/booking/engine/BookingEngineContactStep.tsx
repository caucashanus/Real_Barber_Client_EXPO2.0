import React from 'react';
import { Switch, TextInput, View } from 'react-native';

import type { BookingEngineFlow } from '@/hooks/useBookingEngineFlow';
import ThemedText from '@/components/ThemedText';
import BookingContactSummaryPanel from '@/components/booking/engine/BookingContactSummaryPanel';
import BookingCouponPriceBreakdown from '@/components/booking/engine/BookingCouponPriceBreakdown';
import BookingCouponSection from '@/components/booking/engine/BookingCouponSection';
import PhoneInput from '@/components/forms/PhoneInput';

interface Props {
  flow: BookingEngineFlow;
}

export default function BookingEngineContactStep({ flow }: Props) {
  const { t, contact } = flow;

  if (contact.awaitingPhoneOtp) {
    return (
      <View className="gap-5">
        <BookingContactSummaryPanel flow={flow} />
        <ThemedText className="text-base font-semibold">{t('bookingOtpTitle')}</ThemedText>
        <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">
          {t('bookingOtpHint')} {contact.contactContext.phone}
        </ThemedText>
        <LabeledInput
          label={t('reservationContactOtpLabel')}
          value={contact.otpDigits}
          onChangeText={contact.setOtpDigits}
          keyboardType="number-pad"
        />
      </View>
    );
  }

  return (
    <View className="gap-5">
      <BookingContactSummaryPanel flow={flow} hideCatalogPrice={Boolean(flow.coupon.preview)} />
      {!flow.skipContact ? (
        <>
          <ThemedText className="text-lg font-semibold">{t('bookingContactYourDetails')}</ThemedText>
          <View className="gap-3">
            <LabeledInput
              label={t('reservationContactFirstName')}
              value={contact.fields.firstName}
              onChangeText={(v) => contact.setField('firstName', v)}
            />
            <LabeledInput
              label={t('reservationContactLastName')}
              value={contact.fields.lastName}
              onChangeText={(v) => contact.setField('lastName', v)}
            />
            <LabeledInput
              label={t('reservationContactEmail')}
              value={contact.fields.email}
              onChangeText={(v) => contact.setField('email', v)}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <View>
              <ThemedText className="mb-1 text-sm text-light-subtext dark:text-dark-subtext">
                {t('reservationContactPhone')}
              </ThemedText>
              <PhoneInput
                countryCode={contact.fields.phoneCountryCode}
                onCountryCodeChange={(v) => contact.setField('phoneCountryCode', v)}
                phone={contact.fields.phoneNationalDigits}
                onPhoneChange={(v) => contact.setField('phoneNationalDigits', v)}
              />
            </View>
            <LabeledInput
              label={t('reservationContactNotes')}
              value={contact.fields.notes}
              onChangeText={(v) => contact.setField('notes', v)}
              multiline
            />
            <View className="flex-row items-center gap-3">
              <Switch
                value={contact.fields.marketingConsent}
                onValueChange={(v) => contact.setField('marketingConsent', v)}
              />
              <ThemedText className="flex-1 text-sm">{t('reservationContactMarketing')}</ThemedText>
            </View>
          </View>
        </>
      ) : null}
      {!flow.skipContact ? (
        <>
          {flow.coupon.preview ? (
            <BookingCouponPriceBreakdown preview={flow.coupon.preview} t={t} className="mt-0" />
          ) : null}
          <BookingCouponSection flow={flow} coupon={flow.coupon} onReserve={flow.handleSubmit} />
        </>
      ) : null}
      {flow.contact.submitError ? (
        <ThemedText className="text-sm text-red-500 dark:text-red-400">
          {flow.contact.submitError}
        </ThemedText>
      ) : null}
    </View>
  );
}

function LabeledInput(props: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  keyboardType?: 'default' | 'email-address' | 'number-pad';
  autoCapitalize?: 'none' | 'sentences';
  multiline?: boolean;
}) {
  return (
    <View>
      <ThemedText className="mb-1 text-sm text-light-subtext dark:text-dark-subtext">{props.label}</ThemedText>
      <TextInput
        value={props.value}
        onChangeText={props.onChangeText}
        keyboardType={props.keyboardType}
        autoCapitalize={props.autoCapitalize}
        multiline={props.multiline}
        className="rounded-xl border border-light-border bg-light-primary px-3 py-3 text-base text-light-text dark:border-dark-border dark:bg-dark-primary dark:text-dark-text"
      />
    </View>
  );
}
