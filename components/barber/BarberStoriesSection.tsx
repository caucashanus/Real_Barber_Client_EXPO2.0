import { Image } from 'expo-image';
import React from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import type { TeamMemberStory } from '@/api/publicTeamMember';
import VideoPlayer from '@/components/VideoPlayer';
import Section from '@/components/layout/Section';
import type { TranslationKey } from '@/locales';

interface BarberStoriesSectionProps {
  stories: TeamMemberStory[];
  t: (key: TranslationKey) => string;
}

export default function BarberStoriesSection({ stories, t }: BarberStoriesSectionProps) {
  if (stories.length === 0) return null;

  return (
    <Section title={t('barberStories')} titleSize="lg" className="mb-6 mt-8">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 12, paddingVertical: 12 }}
        className="-mx-global px-global">
        {stories.map((story) => (
          <View key={story.id} className="overflow-hidden rounded-xl" style={{ width: 120, height: 180 }}>
            {story.mediaType === 'video' ? (
              <VideoPlayer
                uri={story.mediaUrl}
                style={{ width: 120, height: 180 }}
                contentFit="cover"
                shouldPlay={false}
                isMuted
              />
            ) : (
              <Image source={{ uri: story.mediaUrl }} className="h-full w-full" contentFit="cover" />
            )}
          </View>
        ))}
      </ScrollView>
    </Section>
  );
}
