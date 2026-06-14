import { Image } from 'expo-image';
import React from 'react';
import { Pressable, ScrollView } from 'react-native';

import type { EmployeeMediaItem } from '@/api/employees';
import VideoPlayer from '@/components/VideoPlayer';
import Section from '@/components/layout/Section';
import type { TranslationKey } from '@/locales';

interface BarberWorkSamplesSectionProps {
  media: EmployeeMediaItem[];
  onMediaPress: (item: EmployeeMediaItem) => void;
  t: (key: TranslationKey) => string;
}

export default function BarberWorkSamplesSection({
  media,
  onMediaPress,
  t,
}: BarberWorkSamplesSectionProps) {
  if (media.length === 0) return null;

  return (
    <Section title={t('barberWorkSamples')} titleSize="lg" className="mb-6 mt-8">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 12, paddingVertical: 12 }}
        className="-mx-global px-global">
        {media.map((item, index) => (
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
    </Section>
  );
}
