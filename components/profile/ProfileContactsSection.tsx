import React, { useCallback, useRef } from 'react';
import { Share, View } from 'react-native';
import { ActionSheetRef } from 'react-native-actions-sheet';
import { router } from 'expo-router';

import ListLink from '@/components/ListLink';
import Section from '@/components/layout/Section';
import { ProfilePhoneContactSheet } from '@/components/profile/ProfilePhoneContactSheet';
import {
  PROFILE_BRANCH_MAP_ROUTE,
  PROFILE_PRIVACY_APP_ROUTE,
  PROFILE_SHARE_URL,
} from '@/constants/profileContacts';
import { useCopyFeedback } from '@/contexts/CopyFeedbackContext';
import { useTranslation } from '@/hooks/useTranslation';

export default function ProfileContactsSection() {
  const { t } = useTranslation();
  const { copyToClipboard } = useCopyFeedback();
  const phoneSheetRef = useRef<ActionSheetRef>(null);

  const openPrivacyPolicy = useCallback(() => {
    router.push(PROFILE_PRIVACY_APP_ROUTE as never);
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
              openPrivacyPolicy();
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
