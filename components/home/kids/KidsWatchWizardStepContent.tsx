import type { Booking } from '@/api/bookings';
import React from 'react';
import { Pressable, View } from 'react-native';

import Icon from '@/components/Icon';
import Input from '@/components/forms/Input';
import KidsWatchAvoidOptionRow from '@/components/home/kids/KidsWatchAvoidOptionRow';
import KidsWatchPhotoGrid from '@/components/home/kids/KidsWatchPhotoGrid';
import {
  KidsWatchBookingMeta,
  KidsWatchNotifyToggleRow,
} from '@/components/home/kids/KidsWatchSheetParts';
import SurfaceCard from '@/components/layout/SurfaceCard';
import ThemedText from '@/components/ThemedText';
import { KIDS_WATCH_AVOID_OPTIONS } from '@/constants/kidsWatchAvoidOptions';
import {
  preferredContactIcon,
  preferredContactLabelKey,
} from '@/components/home/WaitlistPreferredContactPickerSheet';
import useThemeColors from '@/contexts/ThemeColors';
import type { TranslationKey } from '@/locales';
import {
  generateKidsWatchPin,
  type KidsWatchFlowStep,
  type KidsWatchFormState,
} from '@/utils/kidsWatchHelpers';

type Props = {
  step: KidsWatchFlowStep;
  selectedBooking: Booking | null;
  locale: string;
  t: (key: TranslationKey) => string;
  form: KidsWatchFormState;
  setForm: React.Dispatch<React.SetStateAction<KidsWatchFormState>>;
  colors: ReturnType<typeof useThemeColors>;
  maxPhotos: number;
  onAddPhotoGallery: () => void;
  onAddPhotoCamera: () => void;
  onOpenContactPicker: () => void;
  contactPickerSubtitle: string;
  useAlternateContact: boolean;
  alternatePhoneDraft: string;
  alternateEmailDraft: string;
  setAlternatePhoneDraft: (value: string) => void;
  setAlternateEmailDraft: (value: string) => void;
  needsContactEmail: boolean;
};

export default function KidsWatchWizardStepContent({
  step,
  selectedBooking,
  locale,
  t,
  form,
  setForm,
  colors,
  maxPhotos,
  onAddPhotoGallery,
  onAddPhotoCamera,
  onOpenContactPicker,
  contactPickerSubtitle,
  useAlternateContact,
  alternatePhoneDraft,
  alternateEmailDraft,
  setAlternatePhoneDraft,
  setAlternateEmailDraft,
  needsContactEmail,
}: Props) {
  if (step === 'pin' && selectedBooking) {
    return (
      <View className="px-global pt-2">
        <KidsWatchBookingMeta booking={selectedBooking} locale={locale} t={t} />
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
    );
  }

  if (step === 'notify') {
    return (
      <View className="px-global pt-2">
        <ThemedText className="mb-3 text-sm text-light-subtext dark:text-dark-subtext">
          {t('kidsWatchStepNotifyLead')}
        </ThemedText>
        <KidsWatchNotifyToggleRow
          label={t('kidsWatchNotifyArrival')}
          checked={form.notifyArrival}
          onToggle={() => setForm((f) => ({ ...f, notifyArrival: !f.notifyArrival }))}
        />
        <KidsWatchNotifyToggleRow
          label={t('kidsWatchNotifyDeparture')}
          checked={form.notifyDeparture}
          onToggle={() => setForm((f) => ({ ...f, notifyDeparture: !f.notifyDeparture }))}
        />
      </View>
    );
  }

  if (step === 'treats') {
    return (
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
    );
  }

  if (step === 'photo') {
    return (
      <View className="px-global pt-2">
        <ThemedText className="mb-3 text-sm text-light-subtext dark:text-dark-subtext">
          {t('kidsWatchStepPhotoHint')}
        </ThemedText>
        <KidsWatchPhotoGrid
          uris={form.photoUris}
          maxPhotos={maxPhotos}
          onAddGallery={onAddPhotoGallery}
          onAddCamera={onAddPhotoCamera}
          onRemove={(uri) =>
            setForm((f) => ({ ...f, photoUris: f.photoUris.filter((u) => u !== uri) }))
          }
          galleryLabel={t('kidsWatchStepPhotoGallery')}
          cameraLabel={t('kidsWatchStepPhotoCamera')}
          maxLabel={t('kidsWatchStepPhotoMax')}
        />
      </View>
    );
  }

  if (step === 'phone') {
    return (
      <View className="px-global pt-2">
        <ThemedText className="mb-5 text-sm font-medium">
          {t('homeTodayTeamWaitlistPreferredSection')}
        </ThemedText>
        <Pressable
          onPress={onOpenContactPicker}
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
    );
  }

  if (step === 'note') {
    return (
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
    );
  }

  return null;
}