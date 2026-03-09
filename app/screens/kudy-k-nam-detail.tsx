import React, { useRef } from 'react';
import { View, Pressable, Linking } from 'react-native';
import Header from '@/components/Header';
import ThemedText from '@/components/ThemedText';
import ThemedScroller from '@/components/ThemeScroller';
import { Video, ResizeMode } from 'expo-av';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { KUDY_K_NAM_VIDEOS } from '@/constants/kudy-k-nam-videos';
import Section from '@/components/layout/Section';
import { Button } from '@/components/Button';
import Icon from '@/components/Icon';
import { useTranslation } from '@/app/hooks/useTranslation';

const KudyKNamDetail = () => {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const videoRef = useRef<Video>(null);
  const { id } = useLocalSearchParams<{ id?: string }>();
  const item = id ? KUDY_K_NAM_VIDEOS.find((v) => v.id === id) : null;
  const title = item ? `How to get to ${item.title}?` : 'How to get to us?';
  const source = item?.source ?? null;

  const handleShowFullscreenVideo = async () => {
    try {
      await videoRef.current?.setStatusAsync({ isMuted: false });
      await videoRef.current?.presentFullscreenPlayer();
      await videoRef.current?.playAsync();
    } catch (_) {}
  };

  if (!item) {
    return (
      <>
        <StatusBar style="dark" />
        <Header title={t('howToGetToUs')} showBackButton />
        <View className="flex-1 p-global justify-center items-center">
          <ThemedText className="text-light-subtext dark:text-dark-subtext">{t('kudyBranchNotFound')}</ThemedText>
        </View>
      </>
    );
  }

  const hasVideo = source != null;

  return (
    <>
      <StatusBar style={hasVideo ? 'light' : 'dark'} translucent={hasVideo} />
      <Header variant={hasVideo ? 'transparent' : 'default'} title={hasVideo ? '' : title} showBackButton />
      <ThemedScroller className="px-0 bg-light-primary dark:bg-dark-primary">
        {hasVideo && (
          <View className="bg-black" style={{ height: 500 }}>
            <Video
              ref={videoRef}
              pointerEvents="none"
              source={typeof source === 'number' ? source : { uri: (source as { uri: string }).uri }}
              style={{ width: '100%', height: 500 }}
              resizeMode={ResizeMode.COVER}
              useNativeControls
              shouldPlay
              isLooping
              isMuted={true}
            />
          </View>
        )}

        <View
          style={{ borderTopLeftRadius: 30, borderTopRightRadius: 30 }}
          className={`p-global bg-light-primary dark:bg-dark-primary ${hasVideo ? '-mt-[30px]' : ''}`}
        >
          <ThemedText className="text-3xl text-center font-semibold">{title}</ThemedText>

          <Section title={t('kudyTransportParking')} titleSize="lg" className="mb-6 mt-8">
            <ThemedText className="text-base text-light-subtext dark:text-dark-subtext mb-4">
              {item.description ?? 'Add static text here later – transport, parking, etc.'}
            </ThemedText>
            {item.mapsUrl ? (
              <Pressable
                onPress={() => Linking.openURL(item.mapsUrl!)}
                className="flex-row items-center py-3 px-4 rounded-xl bg-light-secondary dark:bg-dark-secondary active:opacity-80 mb-3"
              >
                <Icon name="MapPin" size={22} className="text-highlight mr-3" />
                <ThemedText className="text-base font-medium">{t('kudyOpenGoogleMaps')}</ThemedText>
              </Pressable>
            ) : null}
            {item.wazeUrl ? (
              <Pressable
                onPress={() => Linking.openURL(item.wazeUrl!)}
                className="flex-row items-center py-3 px-4 rounded-xl bg-light-secondary dark:bg-dark-secondary active:opacity-80 mb-3"
              >
                <Icon name="Car" size={22} className="text-highlight mr-3" />
                <ThemedText className="text-base font-medium">{t('kudyOpenWaze')}</ThemedText>
              </Pressable>
            ) : null}
            {item.uberUrl ? (
              <Pressable
                onPress={() => Linking.openURL(item.uberUrl!)}
                className="flex-row items-center py-3 px-4 rounded-xl bg-light-secondary dark:bg-dark-secondary active:opacity-80"
              >
                <Icon name="Car" size={22} className="text-highlight mr-3" />
                <ThemedText className="text-base font-medium">{t('kudyRideUber')}</ThemedText>
              </Pressable>
            ) : null}
          </Section>
        </View>
      </ThemedScroller>

      <View
        style={{ paddingBottom: insets.bottom }}
        className="flex-row items-center justify-start px-global pt-4 pb-2 bg-light-primary dark:bg-dark-primary border-t border-neutral-200 dark:border-dark-secondary"
      >
        <View>
          <ThemedText className="text-xl font-bold">{t('branchTitle')} {item.title}</ThemedText>
          <ThemedText className="text-xs opacity-60">{t('kudyHowToGetToUs')}</ThemedText>
        </View>
        {hasVideo && (
          <View className="flex-row items-center ml-auto">
            <Button
              title={t('kudyShowVideo')}
              iconStart="Play"
              className="bg-highlight ml-6 px-6"
              textClassName="text-white"
              size="medium"
              onPress={handleShowFullscreenVideo}
              rounded="lg"
            />
          </View>
        )}
      </View>
    </>
  );
};

export default KudyKNamDetail;
