import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Image } from 'expo-image';
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
} from 'react';
import { Linking, View } from 'react-native';
import { ActionSheetRef } from 'react-native-actions-sheet';

import ActionSheetThemed from './ActionSheetThemed';
import { Button } from './Button';
import ThemedText from './ThemedText';

const NOTIF_OPENS_KEY = '@notif_prompt_opens';
const NOTIF_DISMISSED_AT_KEY = '@notif_prompt_dismissed_at';
const REQUIRED_OPENS = 3;
const DISMISS_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;

async function incrementOpens(): Promise<void> {
  const raw = await AsyncStorage.getItem(NOTIF_OPENS_KEY).catch(() => null);
  const current = raw ? parseInt(raw, 10) : 0;
  await AsyncStorage.setItem(NOTIF_OPENS_KEY, String(current + 1)).catch(() => {});
}

async function getOpens(): Promise<number> {
  const raw = await AsyncStorage.getItem(NOTIF_OPENS_KEY).catch(() => null);
  return raw ? parseInt(raw, 10) : 0;
}

async function isDismissedRecently(): Promise<boolean> {
  const raw = await AsyncStorage.getItem(NOTIF_DISMISSED_AT_KEY).catch(() => null);
  if (!raw) return false;
  return Date.now() - parseInt(raw, 10) < DISMISS_COOLDOWN_MS;
}

async function markDismissed(): Promise<void> {
  await AsyncStorage.setItem(NOTIF_DISMISSED_AT_KEY, String(Date.now())).catch(() => {});
}

export type NotificationPromptSheetHandle = {
  /** Otevře vzdělávací sheet (Profil → zvoneček bez oprávnění). */
  openPromptSheet: () => void;
};

interface NotificationPromptSheetProps {
  onPermissionGranted?: () => void;
  /** Domovská Real Barber: automatická logika 3× návštěva + sheet při denied. Na Profilu vypni. */
  enableAutoCheck?: boolean;
}

const NotificationPromptSheet = forwardRef<
  NotificationPromptSheetHandle,
  NotificationPromptSheetProps
>(({ onPermissionGranted, enableAutoCheck = true }, ref) => {
  const internalRef = useRef<ActionSheetRef>(null);
  const sheetRef = internalRef;

  const openPromptSheet = useCallback(() => {
    setTimeout(() => sheetRef.current?.show(), 100);
  }, []);

  useImperativeHandle(ref, () => ({ openPromptSheet }), [openPromptSheet]);

  const check = useCallback(async () => {
    const { status } = await Notifications.getPermissionsAsync();
    if (status === 'granted') return;

    await incrementOpens();
    const opens = await getOpens();
    if (opens < REQUIRED_OPENS) return;

    if (status === 'undetermined') {
      const { status: newStatus } = await Notifications.requestPermissionsAsync();
      if (newStatus === 'granted') onPermissionGranted?.();
      return;
    }

    if (status === 'denied') {
      const recentlyDismissed = await isDismissedRecently();
      if (recentlyDismissed) return;
      setTimeout(() => sheetRef.current?.show(), 800);
    }
  }, [onPermissionGranted]);

  useEffect(() => {
    if (!enableAutoCheck) return;
    check();
  }, [check, enableAutoCheck]);

  const handleOpenSettings = async () => {
    sheetRef.current?.hide();
    await markDismissed();
    await Linking.openSettings();
  };

  const handleDismiss = async () => {
    sheetRef.current?.hide();
    await markDismissed();
  };

  return (
    <ActionSheetThemed ref={sheetRef} gestureEnabled snapPoints={[100]}>
      <View className="p-4 pb-6">
        <ThemedText className="mb-1 mt-4 text-left text-lg font-bold">
          Nezmeškejte svou rezervaci
        </ThemedText>
        <Image
          source={require('@/assets/img/notifikace3.png')}
          style={{ width: '100%', height: 240 }}
          contentFit="contain"
          className="mb-4"
        />
        <ThemedText className="mb-6 text-left text-light-subtext dark:text-dark-subtext">
          Doporučujeme zapnout notifikace — dostanete připomínku před každou návštěvou a přehled o stavu rezervace. Slibujeme, že vás nebudeme obtěžovat zbytečnými zprávami.
        </ThemedText>
        <View className="w-full flex-col gap-3">
          <Button
            title="Otevřít Nastavení"
            className="w-full"
            onPress={handleOpenSettings}
          />
          <Button
            title="Teď ne"
            variant="outline"
            className="w-full"
            onPress={handleDismiss}
          />
        </View>
      </View>
    </ActionSheetThemed>
  );
});

NotificationPromptSheet.displayName = 'NotificationPromptSheet';

export default NotificationPromptSheet;
