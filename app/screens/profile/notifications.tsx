import React, { useState } from 'react';
import { View, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Header from '@/components/Header';
import ThemedText from '@/components/ThemedText';
import Switch from '@/components/forms/Switch';
import { Button } from '@/components/Button';
import ThemedScroller from '@/components/ThemeScroller';
import Section from '@/components/layout/Section';
import { useTranslation } from '@/app/hooks/useTranslation';

const NotificationsScreen = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();
  
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
    setNotifications(prev => ({
      ...prev,
      [setting]: value
    }));
  };

  const saveSettings = () => {
    navigation.goBack();
  };

  return (
    <View className="flex-1 bg-light-bg dark:bg-dark-bg">
        <Header showBackButton 
        rightComponents={[
            <Button title={t('editProfileSaveChanges')} onPress={saveSettings} />
        ]}
        />
      <ThemedScroller >
      <Section titleSize='3xl' className='mt-10 pb-10' title={t('notificationsTitle')} subtitle={t('notificationsSubtitle')} />  

        <View className="mb-8">
          <ThemedText className="text-lg font-bold mb-4">{t('notifSettingsBookingTravel')}</ThemedText>
          
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
          <ThemedText className="text-lg font-bold mb-4">{t('notifSettingsPromotionsMarketing')}</ThemedText>
          
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
