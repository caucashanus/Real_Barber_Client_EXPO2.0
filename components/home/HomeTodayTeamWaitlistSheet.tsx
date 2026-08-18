import React, { forwardRef, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import { ActionSheetRef } from 'react-native-actions-sheet';

import { joinEmployeeWaitlist } from '@/api/waitlist';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import ActionSheetThemed from '@/components/ActionSheetThemed';
import AppButton from '@/components/AppButton';
import { Button } from '@/components/Button';
import TextInput from '@/components/forms/TextInput';
import Icon from '@/components/Icon';
import ThemedText from '@/components/ThemedText';
import WaitlistPreferredContactPickerSheet, {
  preferredContactIcon,
  preferredContactLabelKey,
  type WaitlistPreferredContactPickerHandle} from '@/components/home/WaitlistPreferredContactPickerSheet';
import useThemeColors from '@/contexts/ThemeColors';
import type { TranslationKey } from '@/locales';
import {
  WAITLIST_PREFERRED_CONTACT_DEFAULT,
  buildAlternateWaitlistPayload,
  isValidWaitlistEmail,
  isValidWaitlistPhone,
  type WaitlistContactPickerSelection,
  type WaitlistPreferredContact} from '@/lib/waitlist/preferredContact';
import { formatWaitlistDayWhen } from '@/utils/teamMemberWaitlist';
import { getPragueTodayDateString } from '@/utils/teamMemberPageHelpers';
import SiteLoadingSpinner from '@/components/SiteLoadingSpinner';

export interface HomeTodayTeamWaitlistTarget {
  employeeId: string;
  employeeName: string;
  branchLabel?: string | null;
  dayIso?: string;
  requireActiveNow?: boolean;
}

export type HomeTodayTeamWaitlistSheetHandle = {
  open: (target: HomeTodayTeamWaitlistTarget) => void;
};

interface HomeTodayTeamWaitlistSheetProps {
  onJoined: (employeeId: string, dayIso?: string) => void;
  t: (key: TranslationKey) => string;
}

function interpolate(template: string, values: Record<string, string>): string {
  return Object.entries(values).reduce(
    (result, [key, value]) => result.replaceAll(`{${key}}`, value),
    template
  );
}

const HomeTodayTeamWaitlistSheet = forwardRef<
  HomeTodayTeamWaitlistSheetHandle,
  HomeTodayTeamWaitlistSheetProps
>(({ onJoined, t }, ref) => {
  const { client } = useAuth();
  const { locale } = useLanguage();
  const colors = useThemeColors();
  const sheetRef = useRef<ActionSheetRef>(null);
  const pickerRef = useRef<WaitlistPreferredContactPickerHandle>(null);
  const [target, setTarget] = useState<HomeTodayTeamWaitlistTarget | null>(null);
  const [preferredContact, setPreferredContact] = useState<WaitlistPreferredContact>(
    WAITLIST_PREFERRED_CONTACT_DEFAULT
  );
  const [useAlternateContact, setUseAlternateContact] = useState(false);
  const [emailDraft, setEmailDraft] = useState('');
  const [alternatePhoneDraft, setAlternatePhoneDraft] = useState('');
  const [alternateEmailDraft, setAlternateEmailDraft] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [alternateContactError, setAlternateContactError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [submittedContactValue, setSubmittedContactValue] = useState<string | null>(null);
  const [submittedUseAlternateContact, setSubmittedUseAlternateContact] = useState(false);
  const [submittedPreferredContact, setSubmittedPreferredContact] =
    useState<WaitlistPreferredContact>(WAITLIST_PREFERRED_CONTACT_DEFAULT);
  const [error, setError] = useState<string | null>(null);

  const profilePhone = client?.phone?.trim() ?? '';
  const profileEmail = client?.email?.trim() ?? '';

  const todayIso = useMemo(() => getPragueTodayDateString(), []);
  const whenLabel = useMemo(() => {
    const day = target?.dayIso?.trim() || todayIso;
    return formatWaitlistDayWhen(day, todayIso, locale);
  }, [target?.dayIso, todayIso, locale]);

  const handlePickerSelect = (selection: WaitlistContactPickerSelection) => {
    if (selection.type === 'alternate') {
      setUseAlternateContact(true);
      setAlternatePhoneDraft('');
      setAlternateEmailDraft('');
      setEmailError(null);
      setPhoneError(null);
      setAlternateContactError(null);
      return;
    }

    setUseAlternateContact(false);
    setAlternatePhoneDraft('');
    setAlternateEmailDraft('');
    setPreferredContact(selection.contact);
    setEmailError(null);
    setPhoneError(null);
    setAlternateContactError(null);
  };

  const needsProfileEmailInput =
    !useAlternateContact && preferredContact === 'email' && !profileEmail;

  const contactFrameDisplay = useMemo(() => {
    if (useAlternateContact) {
      const phone = alternatePhoneDraft.trim();
      const email = alternateEmailDraft.trim();
      if (phone) return { value: phone, isPlaceholder: false };
      if (email) return { value: email, isPlaceholder: false };
      return { value: t('homeTodayTeamWaitlistUseOtherContact'), isPlaceholder: true };
    }

    if (preferredContact === 'email') {
      const email = (profileEmail || emailDraft).trim();
      if (email) return { value: email, isPlaceholder: false };
      return { value: t('homeTodayTeamWaitlistPreferredEmailPlaceholder'), isPlaceholder: true };
    }

    return { value: profilePhone, isPlaceholder: false };
  }, [
    useAlternateContact,
    preferredContact,
    profileEmail,
    emailDraft,
    profilePhone,
    alternatePhoneDraft,
    alternateEmailDraft,
    t,
  ]);

  const canSubmit = useMemo(() => {
    if (!profilePhone || loading) return false;

    if (useAlternateContact) {
      const phone = alternatePhoneDraft.trim();
      const email = alternateEmailDraft.trim();
      const hasValidPhone = Boolean(phone && isValidWaitlistPhone(phone));
      const hasValidEmail = Boolean(email && isValidWaitlistEmail(email));
      return hasValidPhone || hasValidEmail;
    }

    if (needsProfileEmailInput) {
      return isValidWaitlistEmail(emailDraft.trim());
    }

    return true;
  }, [
    profilePhone,
    loading,
    useAlternateContact,
    alternatePhoneDraft,
    alternateEmailDraft,
    needsProfileEmailInput,
    emailDraft,
  ]);

  useImperativeHandle(ref, () => ({
    open(nextTarget) {
      setTarget(nextTarget);
      setPreferredContact(WAITLIST_PREFERRED_CONTACT_DEFAULT);
      setUseAlternateContact(false);
      setEmailDraft(client?.email?.trim() ?? '');
      setAlternatePhoneDraft('');
      setAlternateEmailDraft('');
      setEmailError(null);
      setPhoneError(null);
      setAlternateContactError(null);
      setError(null);
      setSuccess(false);
      setSubmittedContactValue(null);
      setSubmittedUseAlternateContact(false);
      setLoading(false);
      setTimeout(() => sheetRef.current?.show(), 50);
    }}));

  const handleClose = () => {
    sheetRef.current?.hide();
    pickerRef.current?.hide();
    setError(null);
    setEmailError(null);
    setPhoneError(null);
    setAlternateContactError(null);
    setSuccess(false);
    setSubmittedContactValue(null);
    setSubmittedUseAlternateContact(false);
  };

  const resolveProfileClientEmail = (): string | null => {
    if (preferredContact === 'email') {
      const email = (profileEmail || emailDraft).trim();
      return email || null;
    }
    return profileEmail || null;
  };

  const validateBeforeSubmit = (): boolean => {
    if (useAlternateContact) {
      const phone = alternatePhoneDraft.trim();
      const email = alternateEmailDraft.trim();

      if (!phone && !email) {
        setAlternateContactError(t('homeTodayTeamWaitlistAlternateContactRequired'));
        return false;
      }

      if (phone && !isValidWaitlistPhone(phone)) {
        setPhoneError(t('signupPhoneInvalid'));
        return false;
      }

      if (email && !isValidWaitlistEmail(email)) {
        setEmailError(t('reservationErrorEmailInvalid'));
        return false;
      }

      setAlternateContactError(null);
      setPhoneError(null);
      setEmailError(null);
      return true;
    }

    if (preferredContact === 'email') {
      const email = (profileEmail || emailDraft).trim();
      if (!email) {
        setEmailError(t('reservationErrorEmail'));
        return false;
      }
      if (!isValidWaitlistEmail(email)) {
        setEmailError(t('reservationErrorEmailInvalid'));
        return false;
      }
    }

    setEmailError(null);
    return true;
  };

  const handleJoin = async () => {
    if (!target || !profilePhone) {
      setError(t('homeTodayTeamWaitlistNeedLogin'));
      return;
    }
    if (!validateBeforeSubmit()) return;

    setLoading(true);
    setError(null);
    try {
      const dayIso = target.dayIso ?? todayIso;

      const payload = useAlternateContact
        ? buildAlternateWaitlistPayload({
            profilePhone,
            alternatePhone: alternatePhoneDraft,
            alternateEmail: alternateEmailDraft})
        : {
            phone: profilePhone,
            clientEmail: resolveProfileClientEmail(),
            preferredContact};

      const result = await joinEmployeeWaitlist({
        phone: payload.phone,
        employeeId: target.employeeId,
        employeeName: target.employeeName,
        branchLabel: target.branchLabel,
        dayIso,
        preferredContact: payload.preferredContact,
        clientName: client?.name?.trim() || null,
        clientEmail: payload.clientEmail});

      if (!result.ok) {
        setError(
          result.error === 'rate_limited'
            ? t('homeTodayTeamWaitlistRateLimited')
            : result.error === 'invalid_payload'
              ? t('homeTodayTeamWaitlistInvalidPayload')
              : t('homeTodayTeamWaitlistError')
        );
        return;
      }

      const successContact = useAlternateContact
        ? alternatePhoneDraft.trim() || alternateEmailDraft.trim()
        : payload.preferredContact === 'email'
          ? payload.clientEmail ?? ''
          : profilePhone;
      setSubmittedContactValue(successContact);
      setSubmittedUseAlternateContact(useAlternateContact);
      setSubmittedPreferredContact(payload.preferredContact);
      setSuccess(true);
      onJoined(target.employeeId, dayIso);
    } catch {
      setError(t('homeTodayTeamWaitlistError'));
    } finally {
      setLoading(false);
    }
  };

  const contactFrameSubtitle = useAlternateContact
    ? t('homeTodayTeamWaitlistUseOtherContact')
    : t(preferredContactLabelKey(preferredContact));

  const successBodyText = useMemo(() => {
    if (submittedUseAlternateContact) {
      return interpolate(t('homeTodayTeamWaitlistSuccessBodyAlternate'), {
        contact: submittedContactValue ?? '',
        when: whenLabel});
    }
    if (submittedPreferredContact === 'email') {
      return interpolate(t('homeTodayTeamWaitlistSuccessBodyEmail'), {
        channel: t('homeTodayTeamWaitlistPreferredEmail'),
        email: submittedContactValue ?? '',
        when: whenLabel});
    }
    return interpolate(t('homeTodayTeamWaitlistSuccessBodyChannel'), {
      channel: t(preferredContactLabelKey(submittedPreferredContact)),
      phone: submittedContactValue ?? '',
      when: whenLabel});
  }, [
    submittedUseAlternateContact,
    submittedPreferredContact,
    submittedContactValue,
    whenLabel,
    t,
  ]);

  return (
    <ActionSheetThemed ref={sheetRef} gestureEnabled onClose={() => setError(null)}>
      <View className="p-4 pb-6">
        <ThemedText className="text-lg font-bold">{t('homeTodayTeamWaitlistSheetTitle')}</ThemedText>

        {success ? (
          <>
            <ThemedText className="mt-4 text-sm font-semibold text-light-text dark:text-dark-text">
              {t('homeTodayTeamWaitlistSuccessTitle')}
            </ThemedText>
            <ThemedText className="mt-2 text-sm text-light-subtext dark:text-dark-subtext">
              {successBodyText}
            </ThemedText>
            <View className="mt-6">
              <Button
                title={t('homeTodayTeamWaitlistClose')}
                variant="outline"
                onPress={handleClose}
              />
            </View>
          </>
        ) : (
          <>
            {target ? (
              <ThemedText className="mt-4 text-base text-light-text dark:text-dark-text">
                {interpolate(t('homeTodayTeamWaitlistLead'), {
                  name: target.employeeName,
                  when: whenLabel})}
              </ThemedText>
            ) : null}

            {profilePhone ? (
              <View className="mt-5">
                <ThemedText className="mb-5 text-sm font-semibold text-light-text dark:text-dark-text">
                  {t('homeTodayTeamWaitlistPreferredSection')}
                </ThemedText>
                <Pressable
                  onPress={() => pickerRef.current?.show()}
                  className="flex-row items-center gap-2 rounded-lg border border-neutral-200 px-2.5 py-2 active:opacity-80 dark:border-neutral-700">
                  {useAlternateContact ? (
                    <Icon name="Contact" size={18} strokeWidth={2} color={colors.text} />
                  ) : (
                    preferredContactIcon(preferredContact, colors, 18)
                  )}
                  <View className="min-w-0 flex-1">
                    <ThemedText
                      className={`text-sm font-medium leading-tight ${
                        contactFrameDisplay.isPlaceholder
                          ? 'text-light-subtext dark:text-dark-subtext'
                          : ''
                      }`}>
                      {contactFrameDisplay.value}
                    </ThemedText>
                    <ThemedText className="mt-0.5 text-xs leading-tight text-light-subtext dark:text-dark-subtext">
                      {contactFrameSubtitle}
                    </ThemedText>
                  </View>
                  <Icon
                    name="ChevronRight"
                    size={16}
                    className="text-light-subtext dark:text-dark-subtext"
                  />
                </Pressable>

                {useAlternateContact ? (
                  <>
                    <View className="h-5" />
                    <View className="gap-2">
                    <TextInput
                      label={t('homeTodayTeamWaitlistAlternatePhoneLabel')}
                      value={alternatePhoneDraft}
                      onChangeText={(text) => {
                        setAlternatePhoneDraft(text);
                        if (phoneError) setPhoneError(null);
                        if (alternateContactError) setAlternateContactError(null);
                      }}
                      keyboardType="phone-pad"
                      autoCapitalize="none"
                      autoCorrect={false}
                      error={phoneError ?? undefined}
                      containerClassName="mb-0"
                    />
                    <TextInput
                      label={t('homeTodayTeamWaitlistAlternateEmailLabel')}
                      value={alternateEmailDraft}
                      onChangeText={(text) => {
                        setAlternateEmailDraft(text);
                        if (emailError) setEmailError(null);
                        if (alternateContactError) setAlternateContactError(null);
                      }}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      error={emailError ?? undefined}
                      containerClassName="mb-0"
                    />
                    {alternateContactError ? (
                      <ThemedText className="text-sm text-red-500 dark:text-red-400">
                        {alternateContactError}
                      </ThemedText>
                    ) : null}
                    </View>
                  </>
                ) : null}
              </View>
            ) : null}

            {needsProfileEmailInput ? (
              <View className="mt-2">
                <TextInput
                  label={t('reservationContactEmail')}
                  value={emailDraft}
                  onChangeText={(text) => {
                    setEmailDraft(text);
                    if (emailError) setEmailError(null);
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  error={emailError ?? undefined}
                  containerClassName="mb-0"
                />
              </View>
            ) : null}

            {error ? (
              <ThemedText className="mt-3 text-sm text-red-500 dark:text-red-400">{error}</ThemedText>
            ) : null}
            <View className="mt-6">
              <AppButton
                title={loading ? t('homeTodayTeamWaitlistSubmitting') : t('homeTodayTeamWaitlistSubmit')}
                variant="default"
                onPress={() => {
                  void handleJoin();
                }}
                disabled={!canSubmit}
              />
            </View>
            {loading ? (
              <View className="mt-3 items-center">
                <SiteLoadingSpinner size="compact" />
              </View>
            ) : null}
          </>
        )}
      </View>

      <WaitlistPreferredContactPickerSheet
        nested
        ref={pickerRef}
        profilePhone={profilePhone}
        profileEmail={profileEmail}
        onSelect={handlePickerSelect}
        t={t}
      />
    </ActionSheetThemed>
  );
});

HomeTodayTeamWaitlistSheet.displayName = 'HomeTodayTeamWaitlistSheet';

export default HomeTodayTeamWaitlistSheet;
