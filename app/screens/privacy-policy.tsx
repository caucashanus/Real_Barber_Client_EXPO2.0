import React from 'react';
import { View } from 'react-native';

import Header from '@/components/Header';
import ThemedScroller from '@/components/ThemeScroller';
import ThemedText from '@/components/ThemedText';
import {
  PROFILE_GDPR_DOCUMENT_TITLE,
  PROFILE_GDPR_SECTIONS,
} from '@/constants/profileGdprContent';
import { useTranslation } from '@/hooks/useTranslation';

export default function PrivacyPolicyScreen() {
  const { t } = useTranslation();

  return (
    <>
      <Header title={t('profileContactsPrivacy')} showBackButton />
      <ThemedScroller className="px-global pb-10 pt-4">
        <ThemedText className="mb-6 text-xl font-bold leading-8">{PROFILE_GDPR_DOCUMENT_TITLE}</ThemedText>

        {PROFILE_GDPR_SECTIONS.map((section, index) => (
          <View key={`${section.heading ?? 'p'}-${index}`} className="mb-5">
            {section.heading ? (
              <ThemedText className="mb-2 text-base font-semibold leading-6">{section.heading}</ThemedText>
            ) : null}
            {section.paragraphs?.map((paragraph, pIndex) => (
              <ThemedText
                key={pIndex}
                className="mb-3 text-sm leading-6 text-light-subtext dark:text-dark-subtext">
                {paragraph}
              </ThemedText>
            ))}
            {section.bullets?.map((bullet, bIndex) => (
              <ThemedText
                key={bIndex}
                className="mb-2 pl-3 text-sm leading-6 text-light-subtext dark:text-dark-subtext">
                {'• '}
                {bullet}
              </ThemedText>
            ))}
          </View>
        ))}
      </ThemedScroller>
    </>
  );
}
