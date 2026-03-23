import { useNavigation } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import React, { useState } from 'react';
import { View, Alert, Platform } from 'react-native';

import { useAuth } from '@/app/contexts/AuthContext';
import { useTranslation } from '@/app/hooks/useTranslation';
import { Button } from '@/components/Button';
import Header from '@/components/Header';
import ThemedScroller from '@/components/ThemeScroller';
import ThemedText from '@/components/ThemedText';
import Switch from '@/components/forms/Switch';
import Section from '@/components/layout/Section';

async function scheduleTestLocalNotification(title: string, body: string): Promise<void> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
  const current = await Notifications.getPermissionsAsync();
  if (current.status !== 'granted') {
    const requested = await Notifications.requestPermissionsAsync();
    if (requested.status !== 'granted') {
      throw new Error('permission_denied');
    }
  }
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      ...(Platform.OS === 'android' ? { channelId: 'default' } : {}),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 2,
    },
  });
}

const NotificationsScreen = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { apiToken, token } = useAuth();
  const isSignedIn = Boolean(token ?? apiToken);
  const [testLoading, setTestLoading] = useState(false);

  const [notifications, setNotifications] = useState({
    pushEnabled: true,
    bookingUpdates: true,
    hostMessages: true,
    paymentConfirmations: true,
    reviewRequests: true,
    checkInReminders: true,
    specialOffers: false,
    hostPromotions: false,
    travelTips: false,
    marketingEmails: false,
  });

  const handleToggle = (setting: keyof typeof notifications, value: boolean) => {
    setNotifications((prev) => ({
      ...prev,
      [setting]: value,
    }));
  };

  const saveSettings = () => {
    navigation.goBack();
  };

  const handleTestNotification = async () => {
    if (Platform.OS !== 'ios' && Platform.OS !== 'android') {
      Alert.alert('', t('notifTestLocalUnsupported'));
      return;
    }
    setTestLoading(true);
    try {
      await scheduleTestLocalNotification(
        t('notifTestLocalNotifTitle'),
        t('notifTestLocalNotifBody')
      );
      if (__DEV__) {
        console.log('[push] test local notification scheduled');
      }
    } catch (e) {
      const msg =
        e instanceof Error && e.message === 'permission_denied'
          ? t('notifTestLocalPermissionMessage')
          : String(e);
      if (__DEV__) {
        console.log('[push] test local notification failed', e);
      }
      Alert.alert(t('notifTestLocalPermissionTitle'), msg);
    } finally {
      setTestLoading(false);
    }
  };

  return (
    <View className="bg-light-bg dark:bg-dark-bg flex-1">
      <Header
        showBackButton
        rightComponents={[<Button title={t('editProfileSaveChanges')} onPress={saveSettings} />]}
      />
      <ThemedScroller>
        <Section
          titleSize="3xl"
          className="mt-10 pb-10"
          title={t('notificationsTitle')}
          subtitle={t('notificationsSubtitle')}
        />

        {isSignedIn ? (
          <View className="border-light-border dark:border-dark-border mb-8 rounded-2xl border bg-light-secondary/30 p-4 dark:bg-dark-secondary/30">
            <ThemedText className="mb-2 text-lg font-bold text-light-primary dark:text-dark-primary">
              {t('notifTestLocalSectionTitle')}
            </ThemedText>
            <ThemedText className="mb-4 text-sm text-light-subtext dark:text-dark-subtext">
              {t('notifTestLocalSectionDesc')}
            </ThemedText>
            <Button
              title={t('notifTestLocalButton')}
              variant="outline"
              onPress={handleTestNotification}
              loading={testLoading}
            />
          </View>
        ) : null}

        <View className="mb-8">
          <ThemedText className="mb-4 text-lg font-bold">
            {t('notifSettingsBookingTravel')}
          </ThemedText>

          <Switch
            label={t('notifSettingsBookingUpdates')}
            description="Confirmations, changes, and cancellations"
            value={notifications.bookingUpdates}
            onChange={(value) => handleToggle('bookingUpdates', value)}
            disabled={!notifications.pushEnabled}
            className="mb-4"
          />

          <Switch
            label={t('notifSettingsHostMessages')}
            description="Messages from your hosts and property owners"
            value={notifications.hostMessages}
            onChange={(value) => handleToggle('hostMessages', value)}
            disabled={!notifications.pushEnabled}
            className="mb-4"
          />

          <Switch
            label={t('notifSettingsPaymentConfirmations')}
            description="Receipts and payment processing updates"
            value={notifications.paymentConfirmations}
            onChange={(value) => handleToggle('paymentConfirmations', value)}
            disabled={!notifications.pushEnabled}
            className="mb-4"
          />

          <Switch
            label={t('notifSettingsReviewRequests')}
            description="Reminders to review your stays and experiences"
            value={notifications.reviewRequests}
            onChange={(value) => handleToggle('reviewRequests', value)}
            disabled={!notifications.pushEnabled}
            className="mb-4"
          />

          <Switch
            label={t('notifSettingsCheckinReminders')}
            description="Important information before your arrival"
            value={notifications.checkInReminders}
            onChange={(value) => handleToggle('checkInReminders', value)}
            disabled={!notifications.pushEnabled}
            className="mb-2"
          />
        </View>

        <View className="mt-8">
          <ThemedText className="mb-4 text-lg font-bold">
            {t('notifSettingsPromotionsMarketing')}
          </ThemedText>

          <Switch
            label={t('notifSettingsSpecialOffers')}
            description="Discounts and deals on accommodations"
            value={notifications.specialOffers}
            onChange={(value) => handleToggle('specialOffers', value)}
            className="mb-4"
          />

          <Switch
            label={t('notifSettingsHostPromotions')}
            description="Exclusive offers from your favorite hosts"
            value={notifications.hostPromotions}
            onChange={(value) => handleToggle('hostPromotions', value)}
            className="mb-4"
          />

          <Switch
            label={t('notifSettingsTravelTips')}
            description="Destination guides and travel recommendations"
            value={notifications.travelTips}
            onChange={(value) => handleToggle('travelTips', value)}
            className="mb-4"
          />

          <Switch
            label={t('notifSettingsMarketingEmails')}
            description="Newsletters and destination inspiration"
            value={notifications.marketingEmails}
            onChange={(value) => handleToggle('marketingEmails', value)}
            className="mb-2"
          />
        </View>
      </ThemedScroller>
    </View>
  );
};

export default NotificationsScreen;
