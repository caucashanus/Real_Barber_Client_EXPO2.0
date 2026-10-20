import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';

import { submitKidsWatch } from '@/api/kids-watch';
import type { Booking } from '@/api/bookings';
import ActionSheetThemed from '@/components/ActionSheetThemed';
import AppButton from '@/components/AppButton';
import { Button } from '@/components/Button';
import Icon from '@/components/Icon';
import ReserveButton from '@/components/ReserveButton';
import SurfaceCard from '@/components/layout/SurfaceCard';
import Input from '@/components/forms/Input';
import WaitlistPreferredContactPickerSheet, {
  preferredContactIcon,
  preferredContactLabelKey,
  type WaitlistPreferredContactPickerHandle,
} from '@/components/home/WaitlistPreferredContactPickerSheet';
import KidsWatchAvoidOptionRow from '@/components/home/kids/KidsWatchAvoidOptionRow';
import KidsWatchPhotoGrid from '@/components/home/kids/KidsWatchPhotoGrid';
import KidsWatchPickBookingRow from '@/components/home/kids/KidsWatchPickBookingRow';
import KidsWatchPickEmptyState from '@/components/home/kids/KidsWatchPickEmptyState';
import CopyIconButton from '@/components/shared/CopyIconButton';
import ThemedText from '@/components/ThemedText';
import { KIDS_WATCH_AVOID_OPTIONS } from '@/constants/kidsWatchAvoidOptions';
import {
  KIDS_WATCH_PROMO_HERO,
  KIDS_WATCH_PROMO_HERO_ASPECT,
  KIDS_WATCH_SUCCESS_GRATULATIONS,
} from '@/constants/kidsWatchAssets';
import { LOGIN_PATH } from '@/constants/authRoutes';
import { HOME_FAST_BOOK_SHEET_FOOTER } from '@/components/home/fast-book/homeFastBookSheetUi';
import { actionSheetNestedStackStyles } from '@/components/shared/sheet/ActionSheetNestedDock';
import { useAccentColor } from '@/contexts/AccentColorContext';
import { useAuth } from '@/contexts/AuthContext';
import { useBookings } from '@/contexts/BookingsBadgeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import useThemeColors from '@/contexts/ThemeColors';
import { useActionSheetVisible } from '@/hooks/useActionSheetVisible';
import { useTranslation } from '@/hooks/useTranslation';
import {
  buildAlternateWaitlistPayload,
  isValidWaitlistEmail,
  WAITLIST_PREFERRED_CONTACT_DEFAULT,
  type WaitlistContactPickerSelection,
} from '@/lib/waitlist/preferredContact';
import { canShareClientBooking } from '@/utils/bookingHelpers';
import { filterKidsWatchEligibleBookings } from '@/utils/kidsWatchEligibleBookings';
import { isKidsHaircutBooking } from '@/utils/isKidsHaircutBooking';
import { buildKidsWatchSubmitBody } from '@/utils/buildKidsWatchSubmitBody';
import { uploadKidsWatchHaircutPhotoUrls } from '@/utils/uploadKidsWatchHaircutPhotos';
import { formatKidsWatchBookingDateBranch } from '@/utils/kidsWatchBookingDisplay';
import {
  createInitialKidsWatchForm,
  generateKidsWatchPin,
  isKidsWatchPhoneValid,
  KIDS_WATCH_WIZARD_STEPS,
  type KidsWatchFlowStep,
  type KidsWatchFormState,
} from '@/utils/kidsWatchHelpers';
import type { KidsWatchBookingEntry } from '@/hooks/useKidsWatchSheetLauncher';
import type { TranslationKey } from '@/locales';
import { registerKidsWatchOpener } from '@/utils/openKidsWatchFromBooking';

const MAX_PHOTOS = 3;
const BENEFIT_KEYS = [
  'kidsWatchBenefitPin',
  'kidsWatchBenefitArrivalDeparture',
  'kidsWatchBenefitTreats',
  'kidsWatchBenefitHaircutPhoto',
] as const;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateKidsBooking: () => void;
  initialBookingId?: string | null;
  /** `promo` = post-booking z detailu; `wizard` = rovnou PIN (CTA na detailu). */
  initialBookingEntry?: KidsWatchBookingEntry;
  /** Čerstvá rezervace z detailu, dokud ještě není v `useBookings()`. */
  initialBookingFallback?: Booking | null;
  /** Registruje `openKidsWatchFromBooking()` pro globální volání (home). */
  registerGlobalOpener?: boolean;
};

export default function HomeKidsWatchSheet({
  open,
  onOpenChange,
  onCreateKidsBooking,
  initialBookingId = null,
  initialBookingEntry = 'wizard',
  initialBookingFallback = null,
  registerGlobalOpener = false,
}: Props) {
  const ref = useActionSheetVisible(open);
  const { t } = useTranslation();
  const { locale } = useLanguage();
  const colors = useThemeColors();
  const { accentColor } = useAccentColor();
  const { apiToken, client } = useAuth();
  const { bookings, refreshIfStale, loading: bookingsLoading } = useBookings();
  const pickerRef = useRef<WaitlistPreferredContactPickerHandle>(null);
  const [contactPickerOpen, setContactPickerOpen] = useState(false);

  const [step, setStep] = useState<KidsWatchFlowStep>('promo');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [form, setForm] = useState<KidsWatchFormState>(() =>
    createInitialKidsWatchForm(client?.phone?.trim() ?? '')
  );
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [stepError, setStepError] = useState<string | null>(null);
  const [submittedWithPin, setSubmittedWithPin] = useState(false);
  const [submittedPin, setSubmittedPin] = useState<string | null>(null);
  const [useAlternateContact, setUseAlternateContact] = useState(false);
  const [alternatePhoneDraft, setAlternatePhoneDraft] = useState('');
  const [alternateEmailDraft, setAlternateEmailDraft] = useState('');
  const skippedFromInitialRef = useRef(false);

  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const sheetMaxScroll = windowHeight * 0.78;
  const promoHeroHeight = Math.ceil(windowWidth / KIDS_WATCH_PROMO_HERO_ASPECT);

  const eligibleBookings = useMemo(
    () => filterKidsWatchEligibleBookings(bookings ?? []),
    [bookings]
  );

  const pickStepFitContent = step === 'pick' || step === 'success';

  const wizardContinueDisabled = useMemo(() => {
    switch (step) {
      case 'notify':
        return !form.notifyArrival && !form.notifyDeparture;
      case 'treats':
        return form.avoidIds.length === 0;
      case 'photo':
        return form.photoUris.length === 0;
      case 'note':
        return !form.note.trim();
      default:
        return false;
    }
  }, [
    step,
    form.notifyArrival,
    form.notifyDeparture,
    form.avoidIds.length,
    form.photoUris.length,
    form.note,
  ]);

  const resetFlow = useCallback(() => {
    setStep('promo');
    setSelectedBooking(null);
    setForm(createInitialKidsWatchForm(client?.phone?.trim() ?? ''));
    setSubmitting(false);
    setSubmitError(null);
    setStepError(null);
    setSubmittedWithPin(false);
    setSubmittedPin(null);
    setUseAlternateContact(false);
    setAlternatePhoneDraft('');
    setAlternateEmailDraft('');
    skippedFromInitialRef.current = false;
  }, [client?.phone]);

  const handleClose = useCallback(() => {
    pickerRef.current?.hide();
    setContactPickerOpen(false);
    resetFlow();
    onOpenChange(false);
  }, [onOpenChange, resetFlow]);

  useEffect(() => {
    if (!open) return;
    refreshIfStale();
  }, [open, refreshIfStale]);

  useEffect(() => {
    if (!open) return;
    if (!initialBookingId) {
      if (!skippedFromInitialRef.current) {
        setStep('promo');
        setSelectedBooking(null);
      }
      return;
    }
    const fromList = (bookings ?? []).find((b) => b.id === initialBookingId);
    const fromFallback =
      initialBookingFallback && initialBookingFallback.id === initialBookingId
        ? initialBookingFallback
        : null;
    const match = fromList ?? fromFallback;
    const shareOk =
      !!match &&
      (canShareClientBooking(match) ||
        (fromFallback != null && match.id === fromFallback.id));
    if (match && shareOk && isKidsHaircutBooking(match)) {
      skippedFromInitialRef.current = true;
      setSelectedBooking(match);
      setStep(initialBookingEntry === 'promo' ? 'promo' : 'pin');
    }
  }, [open, initialBookingId, initialBookingEntry, initialBookingFallback, bookings]);

  useEffect(() => {
    if (!registerGlobalOpener) return;
    registerKidsWatchOpener((bookingId) => {
      onOpenChange(true);
      const match = (bookings ?? []).find((b) => b.id === bookingId);
      if (match && canShareClientBooking(match) && isKidsHaircutBooking(match)) {
        skippedFromInitialRef.current = true;
        setSelectedBooking(match);
        setStep('pin');
      }
    });
    return () => registerKidsWatchOpener(null);
  }, [registerGlobalOpener, onOpenChange, bookings]);

  const goNextWizard = useCallback(
    (from: KidsWatchFlowStep) => {
      const idx = KIDS_WATCH_WIZARD_STEPS.indexOf(from);
      if (idx < 0 || idx >= KIDS_WATCH_WIZARD_STEPS.length - 1) return;
      setStepError(null);
      setStep(KIDS_WATCH_WIZARD_STEPS[idx + 1]!);
    },
    []
  );

  const profilePhone = client?.phone?.trim() ?? '';
  const profileEmail = client?.email?.trim() ?? '';
  const needsContactEmail =
    form.preferredContact === 'email' && !profileEmail;

  const applyPhoneContinue = useCallback((): boolean => {
    if (useAlternateContact) {
      const altPhone = alternatePhoneDraft.trim();
      const altEmail = alternateEmailDraft.trim();
      const hasPhone = isKidsWatchPhoneValid(altPhone);
      const hasEmail = isValidWaitlistEmail(altEmail);
      if (!hasPhone && !hasEmail) {
        setStepError(t('homeTodayTeamWaitlistAlternateContactRequired'));
        return false;
      }
      const payload = buildAlternateWaitlistPayload({
        profilePhone,
        alternatePhone: alternatePhoneDraft,
        alternateEmail: alternateEmailDraft,
      });
      setForm((f) => ({
        ...f,
        phone: payload.phone,
        contactEmail: payload.clientEmail ?? f.contactEmail,
        preferredContact: payload.preferredContact,
        contactUseProfileDefaults: false,
      }));
      setStepError(null);
      return true;
    }
    if (needsContactEmail && !form.contactEmail.trim()) {
      setStepError(t('kidsWatchErrorMissingFields'));
      return false;
    }
    const typedPhone = form.phone.trim();
    if (typedPhone && isKidsWatchPhoneValid(typedPhone)) {
      setForm((f) => ({
        ...f,
        phone: typedPhone,
        contactUseProfileDefaults: false,
      }));
      setStepError(null);
      return true;
    }
    if (profilePhone && isKidsWatchPhoneValid(profilePhone)) {
      setForm((f) => ({
        ...f,
        phone: profilePhone,
        preferredContact: WAITLIST_PREFERRED_CONTACT_DEFAULT,
        contactUseProfileDefaults: true,
      }));
      setStepError(null);
      return true;
    }
    setStepError(t('kidsWatchErrorMissingFields'));
    return false;
  }, [
    alternateEmailDraft,
    alternatePhoneDraft,
    form.contactEmail,
    form.phone,
    needsContactEmail,
    profilePhone,
    t,
    useAlternateContact,
  ]);

  const goBack = useCallback(() => {
    if (step === 'pick') {
      setStep('promo');
      return;
    }
    if (step === 'pin') {
      if (skippedFromInitialRef.current) {
        handleClose();
        return;
      }
      setStep('pick');
      return;
    }
    const idx = KIDS_WATCH_WIZARD_STEPS.indexOf(step);
    if (idx > 0) {
      setStep(KIDS_WATCH_WIZARD_STEPS[idx - 1]!);
      return;
    }
    if (idx === 0) setStep('pick');
  }, [step, handleClose]);

  const showBack =
    step !== 'promo' && step !== 'success' && !(step === 'pick' && skippedFromInitialRef.current);

  const onPromoStart = () => {
    if (!apiToken) {
      handleClose();
      router.push(LOGIN_PATH);
      return;
    }
    if (skippedFromInitialRef.current && selectedBooking) {
      setStep('pin');
      return;
    }
    setStep('pick');
  };

  const pickBooking = (booking: Booking) => {
    setSelectedBooking(booking);
    setStep('pin');
  };

  const skipStep = () => {
    if (step === 'pin') {
      setForm((f) => ({ ...f, usePin: false }));
      goNextWizard('pin');
      return;
    }
    if (step === 'notify') {
      setForm((f) => ({ ...f, notifyArrival: false, notifyDeparture: false }));
      goNextWizard('notify');
      return;
    }
    if (step === 'treats') {
      setForm((f) => ({ ...f, avoidIds: [] }));
      goNextWizard('treats');
      return;
    }
    if (step === 'photo') {
      setForm((f) => ({ ...f, photoUris: [] }));
      goNextWizard('photo');
      return;
    }
    if (step === 'phone') {
      setUseAlternateContact(false);
      setAlternatePhoneDraft('');
      setAlternateEmailDraft('');
      setForm((f) => ({
        ...f,
        phone: profilePhone,
        preferredContact: WAITLIST_PREFERRED_CONTACT_DEFAULT,
        contactUseProfileDefaults: true,
      }));
      setStepError(null);
      goNextWizard('phone');
      return;
    }
    if (step === 'note') {
      setForm((f) => ({ ...f, note: '' }));
      void handleSubmit('');
    }
  };

  const continueStep = () => {
    if (step === 'pin') {
      setForm((f) => ({ ...f, usePin: true }));
      goNextWizard('pin');
      return;
    }
    if (step === 'phone') {
      if (!applyPhoneContinue()) return;
      goNextWizard('phone');
      return;
    }
    if (step === 'note') {
      void handleSubmit(form.note.trim());
      return;
    }
    goNextWizard(step);
  };

  const handleSubmit = async (note: string) => {
    if (!apiToken || !selectedBooking) return;
    setSubmitting(true);
    setSubmitError(null);
    const pinValue = form.usePin ? form.pin : null;
    try {
      const haircutPhotoUrls =
        form.photoUris.length > 0
          ? await uploadKidsWatchHaircutPhotoUrls(apiToken, form.photoUris)
          : [];

      await submitKidsWatch(
        apiToken,
        buildKidsWatchSubmitBody({
          booking: selectedBooking,
          form,
          note,
          clientName: client?.name?.trim() || undefined,
          clientEmail: client?.email,
          haircutPhotoUrls,
        })
      );
      setSubmittedWithPin(Boolean(pinValue));
      setSubmittedPin(pinValue);
      setStep('success');
    } catch {
      setSubmitError(t('kidsWatchSubmitError'));
    } finally {
      setSubmitting(false);
    }
  };

  const addPhoto = async () => {
    if (form.photoUris.length >= MAX_PHOTOS) return;
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
      allowsMultipleSelection: true,
      selectionLimit: MAX_PHOTOS - form.photoUris.length,
    });
    if (result.canceled) return;
    const uris = result.assets.map((a) => a.uri).filter(Boolean);
    setForm((f) => ({
      ...f,
      photoUris: [...f.photoUris, ...uris].slice(0, MAX_PHOTOS),
    }));
  };

  const takePhoto = async () => {
    if (form.photoUris.length >= MAX_PHOTOS) return;
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
    });
    if (result.canceled || !result.assets[0]?.uri) return;
    setForm((f) => ({
      ...f,
      photoUris: [...f.photoUris, result.assets[0]!.uri].slice(0, MAX_PHOTOS),
    }));
  };

  const onPickerSelect = (selection: WaitlistContactPickerSelection) => {
    if (selection.type === 'alternate') {
      setUseAlternateContact(true);
      setForm((f) => ({ ...f, contactUseProfileDefaults: false }));
      return;
    }
    setUseAlternateContact(false);
    setAlternatePhoneDraft('');
    setAlternateEmailDraft('');
    setForm((f) => ({
      ...f,
      preferredContact: selection.contact,
      phone: profilePhone || f.phone,
      contactUseProfileDefaults: false,
    }));
  };

  const contactPickerSubtitle = useMemo(() => {
    if (useAlternateContact) {
      const phone = alternatePhoneDraft.trim();
      const email = alternateEmailDraft.trim();
      if (phone) return phone;
      if (email) return email;
      return t('homeTodayTeamWaitlistUseOtherContact');
    }
    if (form.preferredContact === 'email') {
      const email = (profileEmail || form.contactEmail).trim();
      if (email) return email;
      return t('homeTodayTeamWaitlistPreferredEmailPlaceholder');
    }
    return (form.phone.trim() || profilePhone).trim();
  }, [
    alternateEmailDraft,
    alternatePhoneDraft,
    form.contactEmail,
    form.phone,
    form.preferredContact,
    profileEmail,
    profilePhone,
    t,
    useAlternateContact,
  ]);

  const stepTitle = (): string => {
    switch (step) {
      case 'pick':
        return t('kidsWatchPickStepTitle');
      case 'pin':
        return t('kidsWatchStepPinTitle');
      case 'notify':
        return t('kidsWatchStepNotifyTitle');
      case 'treats':
        return t('kidsWatchStepTreatsTitle');
      case 'photo':
        return t('kidsWatchStepPhotoTitle');
      case 'phone':
        return t('kidsWatchStepPhoneTitle');
      case 'note':
        return t('kidsWatchStepNoteTitle');
      case 'success':
        return t('kidsWatchSuccessTitle');
      default:
        return '';
    }
  };

  const renderFooter = () => {
    if (step === 'promo') {
      return (
        <View style={[styles.footer, { borderTopColor: colors.border, borderTopWidth: 1 }]}>
          <Button
            title={t('kidsWatchCtaStart')}
            variant="ghost"
            size="medium"
            className="w-full py-4"
            onPress={onPromoStart}
            style={{ backgroundColor: accentColor, minHeight: 44 }}
            textClassName={`font-medium ${colors.isDark ? 'text-black' : 'text-white'}`}
          />
        </View>
      );
    }
    if (step === 'pick') {
      if (!bookingsLoading && eligibleBookings.length === 0) {
        return (
          <View style={styles.footer}>
            <ReserveButton
              title={t('kidsWatchCtaCreateBooking')}
              size="lg"
              fullWidth
              rounded="full"
              textClassName="text-white"
              onPress={() => {
                handleClose();
                onCreateKidsBooking();
              }}
            />
          </View>
        );
      }
      return null;
    }
    if (step === 'success') {
      return (
        <View style={[styles.footer, { borderTopColor: colors.border }]}>
          <Button
            title={t('kidsWatchSuccessClose')}
            variant="outline"
            size="medium"
            className="w-full py-4"
            onPress={handleClose}
            style={{ minHeight: 44 }}
          />
        </View>
      );
    }
    if (KIDS_WATCH_WIZARD_STEPS.includes(step)) {
      const continueTitle =
        step === 'pin'
          ? t('kidsWatchStepPinContinue')
          : step === 'note'
            ? submitting
              ? t('kidsWatchSubmitting')
              : t('kidsWatchNoteStepContinue')
            : t('kidsWatchCtaContinue');

      return (
        <View style={[styles.footer, { borderTopColor: colors.border }]}>
          {submitError ? (
            <ThemedText className="mb-2 text-center text-sm text-red-500">{submitError}</ThemedText>
          ) : null}
          {stepError ? (
            <ThemedText className="mb-2 text-center text-sm text-red-500">{stepError}</ThemedText>
          ) : null}
          <Button
            title={continueTitle}
            variant="outline"
            size="medium"
            className="w-full py-4"
            onPress={continueStep}
            disabled={wizardContinueDisabled || (step === 'note' && submitting)}
            style={{ minHeight: 44 }}
          />
          <AppButton
            title={t('kidsWatchCtaSkip')}
            variant="ghost"
            size="md"
            fullWidth
            className="mt-2"
            textClassName="underline text-light-subtext dark:text-white"
            disabled={step === 'note' && submitting}
            onPress={skipStep}
          />
        </View>
      );
    }
    return null;
  };

  const renderPickStepList = () => {
    if (bookingsLoading) {
      return (
        <ThemedText className="py-4 text-center text-sm text-light-subtext dark:text-dark-subtext">
          {t('kidsWatchLoadingBookings')}
        </ThemedText>
      );
    }
    if (eligibleBookings.length === 0) {
      return <KidsWatchPickEmptyState t={t} />;
    }
    return (
      <View>
        {eligibleBookings.map((booking, index) => (
          <KidsWatchPickBookingRow
            key={booking.id}
            booking={booking}
            isFirst={index === 0}
            onPress={() => pickBooking(booking)}
          />
        ))}
      </View>
    );
  };

  const renderPickStepBody = () => (
    <View className="px-global pt-0">
      {showBack ? (
        <Pressable
          onPress={goBack}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel={t('kidsWatchBackAria')}
          className="-ml-1 -mt-0.5 h-9 w-9 items-center justify-center self-start active:opacity-70">
          <Icon name="ChevronLeft" size={24} className="text-light-text dark:text-dark-text" />
        </Pressable>
      ) : null}
      <ThemedText className="mt-0 text-xl font-semibold leading-snug" numberOfLines={3}>
        {stepTitle()}
      </ThemedText>
      {eligibleBookings.length > 4 ? (
        <ScrollView
          className="mt-4 pb-2"
          style={{ maxHeight: windowHeight * 0.55 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator
          nestedScrollEnabled
          contentContainerStyle={{ flexGrow: 0 }}>
          {renderPickStepList()}
        </ScrollView>
      ) : (
        <View className="mt-4 pb-2">{renderPickStepList()}</View>
      )}
    </View>
  );

  return (
    <ActionSheetThemed
      ref={ref}
      gestureEnabled={!contactPickerOpen}
      closeOnTouchBackdrop={!contactPickerOpen}
      closeOnPressBack={!contactPickerOpen}
      fitContent={pickStepFitContent}
      fitContentMeasureKey={
        step === 'pick'
          ? `pick-${bookingsLoading ? 'loading' : eligibleBookings.length}-${eligibleBookings.length === 0 ? 'empty' : 'list'}`
          : step === 'success'
            ? `success-${submittedWithPin ? 'pin' : 'nopin'}`
            : step
      }
      {...(pickStepFitContent ? {} : { snapPoints: [100] as const })}
      onClose={handleClose}>
      {step === 'pick' ? (
        <View style={actionSheetNestedStackStyles.stack} className="pb-2">
          <View style={actionSheetNestedStackStyles.baseLayer} collapsable={false}>
            {renderPickStepBody()}
            {renderFooter()}
          </View>
        </View>
      ) : step === 'success' ? (
        <View className="pb-2">
          <View className="px-global pb-2 pt-1">
            <ThemedText className="text-xl font-semibold leading-snug" numberOfLines={3}>
              {stepTitle()}
            </ThemedText>
          </View>
          <View className="items-center px-global pb-2">
            <Image
              source={KIDS_WATCH_SUCCESS_GRATULATIONS}
              style={{ width: 120, height: 120 }}
              contentFit="contain"
              accessibilityLabel={t('kidsWatchSuccessTitle')}
            />
            <ThemedText className="mt-4 text-center text-sm leading-snug text-light-subtext dark:text-dark-subtext">
              {t('kidsWatchSuccessLead')}
            </ThemedText>
            {submittedWithPin && submittedPin ? (
              <SurfaceCard rounded="2xl" className="mt-6 w-full p-4">
                <View className="flex-row items-start justify-between gap-3">
                  <View className="min-w-0 flex-1">
                    <ThemedText className="text-xs text-light-subtext dark:text-dark-subtext">
                      {t('kidsWatchSuccessPinLabel')}
                    </ThemedText>
                    <ThemedText className="mt-1 text-2xl font-bold tracking-widest">
                      {submittedPin}
                    </ThemedText>
                    <ThemedText className="mt-2 text-xs leading-snug text-light-subtext dark:text-dark-subtext">
                      {t('kidsWatchStepPinHint')}
                    </ThemedText>
                  </View>
                  <CopyIconButton
                    value={submittedPin}
                    accessibilityLabel={t('kidsWatchSuccessCopyPin')}
                  />
                </View>
              </SurfaceCard>
            ) : null}
          </View>
          {renderFooter()}
        </View>
      ) : (
        <View style={actionSheetNestedStackStyles.stack} className="pb-2">
          <View
            style={actionSheetNestedStackStyles.baseLayer}
            pointerEvents={contactPickerOpen ? 'none' : 'auto'}>
            {step !== 'promo' ? (
              <View className="px-global pb-2 pt-1">
                {showBack ? (
                  <Pressable
                    onPress={goBack}
                    hitSlop={12}
                    accessibilityRole="button"
                    accessibilityLabel={t('kidsWatchBackAria')}
                    className="-ml-1 h-10 w-10 items-center justify-center self-start active:opacity-70">
                    <Icon name="ChevronLeft" size={24} className="text-light-text dark:text-dark-text" />
                  </Pressable>
                ) : null}
                <ThemedText
                  className={`text-xl font-semibold leading-snug ${showBack ? 'mt-1' : 'mt-0'}`}
                  numberOfLines={3}>
                  {stepTitle()}
                </ThemedText>
              </View>
            ) : null}

            <ScrollView
            style={{ maxHeight: sheetMaxScroll }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator
            contentContainerStyle={{ flexGrow: 0 }}>
            {step === 'promo' ? (
              <View>
                <View
                  className="w-full overflow-hidden"
                  style={{ width: windowWidth, height: promoHeroHeight, alignSelf: 'center' }}>
                  <Image
                    source={KIDS_WATCH_PROMO_HERO}
                    style={{ width: windowWidth, height: promoHeroHeight }}
                    contentFit="cover"
                    contentPosition="center"
                    accessibilityLabel={t('kidsWatchPromoHeroAlt')}
                  />
                </View>
                <View className="px-global pt-5">
                  <ThemedText className="text-2xl font-semibold">{t('kidsWatchPromoTitle')}</ThemedText>
                  <ThemedText className="mt-2 text-sm text-light-subtext dark:text-dark-subtext">
                    {t('kidsWatchPromoLead')}
                  </ThemedText>
                  <View className="mt-5 py-3">
                    {BENEFIT_KEYS.map((key) => (
                      <View key={key} className="flex-row gap-3 py-2.5">
                        <View className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-light-text dark:bg-dark-text" />
                        <ThemedText className="flex-1 text-sm leading-snug">{t(key)}</ThemedText>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
            ) : null}

            {step === 'pin' && selectedBooking ? (
              <View className="px-global pt-2">
                <BookingMeta booking={selectedBooking} locale={locale} t={t} />
                <SurfaceCard rounded="2xl" className="mt-4 p-5">
                  <View className="flex-row items-center justify-between">
                    <ThemedText className="text-4xl font-bold tracking-[0.25em]">{form.pin}</ThemedText>
                    <Pressable
                      onPress={() => setForm((f) => ({ ...f, pin: generateKidsWatchPin() }))}
                      hitSlop={10}
                      accessibilityRole="button"
                      accessibilityLabel={t('kidsWatchStepPinRegenerate')}
                      className="h-11 w-11 shrink-0 items-center justify-center rounded-full bg-light-secondary active:opacity-70 dark:bg-dark-secondary">
                      <Icon name="RotateCcw" size={20} className="text-light-text dark:text-dark-text" />
                    </Pressable>
                  </View>
                  <ThemedText className="mt-4 text-sm text-light-subtext dark:text-dark-subtext">
                    {t('kidsWatchStepPinHint')}
                  </ThemedText>
                </SurfaceCard>
                <ThemedText className="mt-3 text-sm text-light-subtext dark:text-dark-subtext">
                  {t('kidsWatchStepPinOptionalHint')}
                </ThemedText>
              </View>
            ) : null}

            {step === 'notify' ? (
              <View className="px-global pt-2">
                <ThemedText className="mb-3 text-sm text-light-subtext dark:text-dark-subtext">
                  {t('kidsWatchStepNotifyLead')}
                </ThemedText>
                <NotifyToggleRow
                  label={t('kidsWatchNotifyArrival')}
                  checked={form.notifyArrival}
                  onToggle={() => setForm((f) => ({ ...f, notifyArrival: !f.notifyArrival }))}
                />
                <NotifyToggleRow
                  label={t('kidsWatchNotifyDeparture')}
                  checked={form.notifyDeparture}
                  onToggle={() => setForm((f) => ({ ...f, notifyDeparture: !f.notifyDeparture }))}
                />
              </View>
            ) : null}

            {step === 'treats' ? (
              <View className="px-global pt-2">
                <ThemedText className="mb-3 text-sm text-light-subtext dark:text-dark-subtext">
                  {t('kidsWatchStepTreatsHint')}
                </ThemedText>
                {KIDS_WATCH_AVOID_OPTIONS.map((option) => (
                  <KidsWatchAvoidOptionRow
                    key={option.id}
                    option={option}
                    selected={form.avoidIds.includes(option.id)}
                    onToggle={() =>
                      setForm((f) => ({
                        ...f,
                        avoidIds: f.avoidIds.includes(option.id)
                          ? f.avoidIds.filter((id) => id !== option.id)
                          : [...f.avoidIds, option.id],
                      }))
                    }
                    t={t}
                  />
                ))}
              </View>
            ) : null}

            {step === 'photo' ? (
              <View className="px-global pt-2">
                <ThemedText className="mb-3 text-sm text-light-subtext dark:text-dark-subtext">
                  {t('kidsWatchStepPhotoHint')}
                </ThemedText>
                <KidsWatchPhotoGrid
                  uris={form.photoUris}
                  maxPhotos={MAX_PHOTOS}
                  onAddGallery={() => void addPhoto()}
                  onAddCamera={() => void takePhoto()}
                  onRemove={(uri) =>
                    setForm((f) => ({ ...f, photoUris: f.photoUris.filter((u) => u !== uri) }))
                  }
                  galleryLabel={t('kidsWatchStepPhotoGallery')}
                  cameraLabel={t('kidsWatchStepPhotoCamera')}
                  maxLabel={t('kidsWatchStepPhotoMax')}
                />
              </View>
            ) : null}

            {step === 'phone' ? (
              <View className="px-global pt-2">
                <ThemedText className="mb-5 text-sm font-medium">
                  {t('homeTodayTeamWaitlistPreferredSection')}
                </ThemedText>
                <Pressable
                  onPress={() => pickerRef.current?.show()}
                  className="mb-4 flex-row items-center gap-3 rounded-xl border border-light-subtext/25 px-3 py-3 dark:border-dark-subtext/30">
                  {preferredContactIcon(form.preferredContact, colors)}
                  <View className="min-w-0 flex-1">
                    <ThemedText className="text-sm font-medium">
                      {useAlternateContact
                        ? t('homeTodayTeamWaitlistUseOtherContact')
                        : t(preferredContactLabelKey(form.preferredContact))}
                    </ThemedText>
                    {contactPickerSubtitle ? (
                      <ThemedText
                        className={`mt-0.5 text-xs text-light-subtext dark:text-dark-subtext ${
                          useAlternateContact &&
                          !alternatePhoneDraft.trim() &&
                          !alternateEmailDraft.trim()
                            ? 'italic'
                            : ''
                        }`}>
                        {contactPickerSubtitle}
                      </ThemedText>
                    ) : null}
                  </View>
                  <Icon name="ChevronRight" size={18} className="text-light-subtext dark:text-dark-subtext" />
                </Pressable>
                {useAlternateContact ? (
                  <View className="gap-3">
                    <Input
                      label={t('homeTodayTeamWaitlistAlternatePhoneLabel')}
                      value={alternatePhoneDraft}
                      onChangeText={setAlternatePhoneDraft}
                      keyboardType="phone-pad"
                      variant="classic"
                    />
                    <Input
                      label={t('homeTodayTeamWaitlistAlternateEmailLabel')}
                      value={alternateEmailDraft}
                      onChangeText={setAlternateEmailDraft}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      variant="classic"
                    />
                  </View>
                ) : null}
                {!useAlternateContact && needsContactEmail ? (
                  <Input
                    label={t('homeTodayTeamWaitlistPreferredEmail')}
                    value={form.contactEmail}
                    onChangeText={(contactEmail) => setForm((f) => ({ ...f, contactEmail }))}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    variant="classic"
                    containerClassName="mt-3"
                  />
                ) : null}
              </View>
            ) : null}

            {step === 'note' ? (
              <View className="px-global pt-2">
                <Input
                  label={t('kidsWatchStepNoteLabel')}
                  accessibilityLabel={t('kidsWatchStepNoteTitle')}
                  value={form.note}
                  onChangeText={(note) => setForm((f) => ({ ...f, note }))}
                  isMultiline
                  variant="classic"
                />
              </View>
            ) : null}

            </ScrollView>

            {renderFooter()}
          </View>

          <WaitlistPreferredContactPickerSheet
            ref={pickerRef}
            nested
            nestedStackScrim={false}
            profilePhone={client?.phone?.trim() ?? form.phone}
            profileEmail={client?.email?.trim() ?? ''}
            onSelect={onPickerSelect}
            onOpenChange={setContactPickerOpen}
            t={t}
          />
        </View>
      )}
    </ActionSheetThemed>
  );
}

function BookingMeta({
  booking,
  locale,
  t,
}: {
  booking: Booking;
  locale: string;
  t: (key: TranslationKey) => string;
}) {
  return (
    <SurfaceCard rounded="2xl" className="p-3">
      <ThemedText className="text-base font-medium" numberOfLines={2}>
        {booking.item?.name?.trim() || t('homeRecentDefaultName')}
      </ThemedText>
      <ThemedText className="mt-1 text-sm text-light-subtext dark:text-dark-subtext" numberOfLines={2}>
        {formatKidsWatchBookingDateBranch(booking, locale)}
      </ThemedText>
    </SurfaceCard>
  );
}

function NotifyToggleRow({
  label,
  checked,
  onToggle,
}: {
  label: string;
  checked: boolean;
  onToggle: () => void;
}) {
  const colors = useThemeColors();
  return (
    <Pressable
      onPress={onToggle}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      className="mb-2 flex-row items-center gap-3 rounded-xl px-2 py-3 active:opacity-70">
      <View
        className={`h-6 w-6 items-center justify-center rounded-md border ${
          checked ? 'border-transparent bg-light-text dark:bg-dark-text' : 'border-light-subtext/40 dark:border-dark-subtext/40'
        }`}>
        {checked ? <Icon name="Check" size={16} color={colors.bg} strokeWidth={3} /> : null}
      </View>
      <ThemedText className="flex-1 text-sm">{label}</ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  footer: {
    ...HOME_FAST_BOOK_SHEET_FOOTER,
    borderTopWidth: 0,
  },
});
