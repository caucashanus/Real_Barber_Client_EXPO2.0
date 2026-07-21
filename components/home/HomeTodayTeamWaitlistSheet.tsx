import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { ActionSheetRef } from 'react-native-actions-sheet';

import { joinEmployeeWaitlist } from '@/api/waitlist';
import { useAuth } from '@/app/contexts/AuthContext';
import ActionSheetThemed from '@/components/ActionSheetThemed';
import { Button } from '@/components/Button';
import ThemedText from '@/components/ThemedText';
import type { TranslationKey } from '@/locales';
import { getPragueTodayDateString } from '@/utils/teamMemberPageHelpers';

export interface HomeTodayTeamWaitlistTarget {
  employeeId: string;
  employeeName: string;
  branchId?: string;
}

export type HomeTodayTeamWaitlistSheetHandle = {
  open: (target: HomeTodayTeamWaitlistTarget) => void;
};

interface HomeTodayTeamWaitlistSheetProps {
  onJoined: (employeeId: string) => void;
  t: (key: TranslationKey) => string;
}

const HomeTodayTeamWaitlistSheet = forwardRef<
  HomeTodayTeamWaitlistSheetHandle,
  HomeTodayTeamWaitlistSheetProps
>(({ onJoined, t }, ref) => {
  const { apiToken } = useAuth();
  const sheetRef = useRef<ActionSheetRef>(null);
  const [target, setTarget] = useState<HomeTodayTeamWaitlistTarget | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useImperativeHandle(ref, () => ({
    open(nextTarget) {
      setTarget(nextTarget);
      setError(null);
      setTimeout(() => sheetRef.current?.show(), 50);
    },
  }));

  const handleClose = () => {
    sheetRef.current?.hide();
    setError(null);
  };

  const handleJoin = async () => {
    if (!target || !apiToken) {
      setError(t('homeTodayTeamWaitlistNeedLogin'));
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await joinEmployeeWaitlist(apiToken, {
        employeeId: target.employeeId,
        branchId: target.branchId,
        date: getPragueTodayDateString(),
      });
      sheetRef.current?.hide();
      onJoined(target.employeeId);
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
        <ThemedText className="mt-2 text-sm text-light-subtext dark:text-dark-subtext">
          {t('homeTodayTeamWaitlistSheetMessage')}
        </ThemedText>
        {target ? (
          <ThemedText className="mt-3 text-base font-semibold">{target.employeeName}</ThemedText>
        ) : null}
        {error ? (
          <ThemedText className="mt-3 text-sm text-red-500 dark:text-red-400">{error}</ThemedText>
        ) : null}
        <View className="mt-6 flex-row items-center justify-center">
          <Button
            title={t('commonCancel')}
            variant="outline"
            className="flex-1"
            onPress={handleClose}
            disabled={loading}
          />
          <Button
            title={loading ? t('commonLoading') : t('homeTodayTeamWaitlistJoin')}
            variant="primary"
            className="ml-3 flex-1"
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
      </View>
    </ActionSheetThemed>
  );
});

HomeTodayTeamWaitlistSheet.displayName = 'HomeTodayTeamWaitlistSheet';

export default HomeTodayTeamWaitlistSheet;
