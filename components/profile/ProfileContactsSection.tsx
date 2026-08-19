import React, { useCallback, useRef } from 'react';
import { Share, View } from 'react-native';
import { ActionSheetRef } from 'react-native-actions-sheet';
import * as WebBrowser from 'expo-web-browser';

import ListLink from '@/components/ListLink';
import Section from '@/components/layout/Section';
import { ProfilePhoneContactSheet } from '@/components/profile/ProfilePhoneContactSheet';
import {
  PROFILE_BRANCH_MAP_ROUTE,
  PROFILE_GDPR_URL,
  PROFILE_SHARE_URL,
} from '@/constants/profileContacts';
import { useCopyFeedback } from '@/contexts/CopyFeedbackContext';
import { useTranslation } from '@/hooks/useTranslation';

export default function ProfileContactsSection() {
  const { t } = useTranslation();
  const { copyToClipboard } = useCopyFeedback();
  const phoneSheetRef = useRef<ActionSheetRef>(null);

  const openPrivacyPolicy = useCallback(async () => {
    await WebBrowser.openBrowserAsync(PROFILE_GDPR_URL);
  }, []);

  const handleShareSite = useCallback(async () => {
    try {
      const result = await Share.share({
        message: PROFILE_SHARE_URL,
        url: PROFILE_SHARE_URL,
      });
      if (result.action === Share.sharedAction) return;
    } catch {
      // fall through to copy
    }
    copyToClipboard(PROFILE_SHARE_URL);
  }, [copyToClipboard]);

  return (
    <>
      <Section
        title={t('profileContactsSectionTitle')}
        titleSize="lg"
        className="mt-6 px-4"
        padding="none">
        <View className="gap-1">
          <ListLink
            showChevron
            title={t('profileContactsPhone')}
            icon="Phone"
            onPress={() => phoneSheetRef.current?.show()}
          />
          <ListLink
            showChevron
            title={t('profileContactsPrivacy')}
            icon="Shield"
            onPress={() => {
              void openPrivacyPolicy();
            }}
          />
          <ListLink
            showChevron
            title={t('profileContactsLocations')}
            icon="MapPin"
            href={PROFILE_BRANCH_MAP_ROUTE}
          />
          <ListLink
            showChevron
            title={t('profileContactsShare')}
            icon="Share"
            onPress={() => {
              void handleShareSite();
            }}
          />
        </View>
      </Section>

      <ProfilePhoneContactSheet ref={phoneSheetRef} />
    </>
  );
}
