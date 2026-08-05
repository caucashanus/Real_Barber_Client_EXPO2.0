import React, { forwardRef, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { ActionSheetRef } from 'react-native-actions-sheet';

import { joinEmployeeWaitlist } from '@/api/waitlist';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import ActionSheetThemed from '@/components/ActionSheetThemed';
import AppButton from '@/components/AppButton';
import { Button } from '@/components/Button';
import ThemedText from '@/components/ThemedText';
import type { TranslationKey } from '@/locales';
import { formatWaitlistDayWhen } from '@/utils/teamMemberWaitlist';
import { getPragueTodayDateString } from '@/utils/teamMemberPageHelpers';

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
  const sheetRef = useRef<ActionSheetRef>(null);
  const [target, setTarget] = useState<HomeTodayTeamWaitlistTarget | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [submittedPhone, setSubmittedPhone] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const todayIso = useMemo(() => getPragueTodayDateString(), []);
  const whenLabel = useMemo(() => {
    const day = target?.dayIso?.trim() || todayIso;
    return formatWaitlistDayWhen(day, todayIso, locale);
  }, [target?.dayIso, todayIso, locale]);

  useImperativeHandle(ref, () => ({
    open(nextTarget) {
      setTarget(nextTarget);
      setError(null);
      setSuccess(false);
      setSubmittedPhone(null);
      setLoading(false);
      setTimeout(() => sheetRef.current?.show(), 50);
    },
  }));

  const handleClose = () => {
    sheetRef.current?.hide();
    setError(null);
    setSuccess(false);
    setSubmittedPhone(null);
  };

  const handleJoin = async () => {
    const phone = client?.phone?.trim();
    if (!target || !phone) {
      setError(t('homeTodayTeamWaitlistNeedLogin'));
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const dayIso = target.dayIso ?? todayIso;
      const result = await joinEmployeeWaitlist({
        phone,
        employeeId: target.employeeId,
        employeeName: target.employeeName,
        branchLabel: target.branchLabel,
        dayIso,
        clientName: client?.name?.trim() || null,
        clientEmail: client?.email?.trim() || null,
      });

      if (!result.ok) {
        setError(
          result.error === 'rate_limited'
            ? t('homeTodayTeamWaitlistRateLimited')
            : t('homeTodayTeamWaitlistError')
        );
        return;
      }

      setSubmittedPhone(phone);
      setSuccess(true);
      onJoined(target.employeeId, dayIso);
    } catch {
      setError(t('homeTodayTeamWaitlistError'));
    } finally {
      setLoading(false);
    }
  };

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
              {interpolate(t('homeTodayTeamWaitlistSuccessBody'), {
                phone: submittedPhone ?? '',
                when: whenLabel,
              })}
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
                  when: whenLabel,
                })}
              </ThemedText>
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
                disabled={loading}
              />
            </View>
            {loading ? (
              <View className="mt-3 items-center">
                <ActivityIndicator size="small" />
              </View>
            ) : null}
          </>
        )}
      </View>
    </ActionSheetThemed>
  );
});

HomeTodayTeamWaitlistSheet.displayName = 'HomeTodayTeamWaitlistSheet';

export default HomeTodayTeamWaitlistSheet;
