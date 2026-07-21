import { Image } from 'expo-image';
import React from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import type { TeamMemberMediaItem } from '@/api/publicTeamMember';
import VideoPlayer from '@/components/VideoPlayer';
import ThemedText from '@/components/ThemedText';
import Section from '@/components/layout/Section';
import type { TranslationKey } from '@/locales';
import { BARBER_DETAIL_SECTION_SPACING } from '@/constants/barberDetailLayout';

interface BarberWorkSamplesSectionProps {
  media: TeamMemberMediaItem[];
  onMediaPress: (item: TeamMemberMediaItem) => void;
  embedded?: boolean;
  t: (key: TranslationKey) => string;
}

export default function BarberWorkSamplesSection({
  media,
  onMediaPress,
  embedded = false,
  t,
}: BarberWorkSamplesSectionProps) {
  if (media.length === 0) return null;

  const sorted = [...media].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const gallery = (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 12, paddingVertical: embedded ? 0 : 12 }}
      className={embedded ? '' : '-mx-global px-global'}>
      {sorted.map((item, index) => (
        <Pressable
          key={item.id ?? index}
          onPress={() => onMediaPress(item)}
          className="overflow-hidden rounded-xl"
          style={{ width: 160, height: 160 }}>
          {item.type === 'video' ? (
            <VideoPlayer
              uri={item.url}
              style={{ width: 160, height: 160 }}
              contentFit="cover"
              shouldPlay
              isMuted
              isLooping
            />
          ) : (
            <Image source={{ uri: item.url }} className="h-full w-full" contentFit="cover" />
          )}
        </Pressable>
      ))}
    </ScrollView>
  );

  if (embedded) {
    return (
      <View className={BARBER_DETAIL_SECTION_SPACING}>
        <ThemedText className="mb-3 text-lg font-semibold">{t('barberWorkSamples')}</ThemedText>
        {gallery}
      </View>
    );
  }

  return (
    <Section title={t('barberWorkSamples')} titleSize="lg" className="mb-6 mt-8">
      {gallery}
    </Section>
  );
}
