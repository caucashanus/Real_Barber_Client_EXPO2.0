import React, { useRef, useEffect, useState } from 'react';
import { View, Pressable, Linking, ActivityIndicator } from 'react-native';
import Header from '@/components/Header';
import ThemedText from '@/components/ThemedText';
import ThemedScroller from '@/components/ThemeScroller';
import VideoPlayer from '@/components/VideoPlayer';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { KUDY_K_NAM_VIDEOS } from '@/constants/kudy-k-nam-videos';
import Section from '@/components/layout/Section';
import { Button } from '@/components/Button';
import Icon from '@/components/Icon';
import { useTranslation } from '@/app/hooks/useTranslation';
import useThemeColors from '@/app/contexts/ThemeColors';
import { useAuth } from '@/app/contexts/AuthContext';
import { getBranches, type Branch } from '@/api/branches';

function getKudyVideoUrl(branch: Branch): string | null {
  const media = branch.media;
  if (!media) return null;
  const list = Array.isArray(media) ? [...media] : Object.values(media);
  const videos = list.filter((m): m is { url: string; order?: number; type?: string } => !!m?.url && (m as { type?: string }).type === 'video');
  if (videos.length === 0) return null;
  videos.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  return videos[0].url;
}

const KudyKNamDetail = () => {
  const insets = useSafeAreaInsets();
  const { t, locale } = useTranslation();
  const colors = useThemeColors();
  const { apiToken } = useAuth();
  const { id: branchId } = useLocalSearchParams<{ id?: string }>();
  const [branch, setBranch] = useState<Branch | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!apiToken || !branchId) {
      setBranch(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    getBranches(apiToken)
      .then((list) => {
        const found = list.find((b) => b.id === branchId) ?? null;
        setBranch(found);
      })
      .catch(() => setBranch(null))
      .finally(() => setLoading(false));
  }, [apiToken, branchId]);

  const kudyItem = branch ? KUDY_K_NAM_VIDEOS.find((v) => v.title === branch.name) : null;
  const title = branch ? `${t('howToGetToUs')} – ${branch.name}` : t('howToGetToUs');
  const videoUrl = branch ? getKudyVideoUrl(branch) : null;

  const handleShowFullscreenVideo = async () => {};

  if (loading) {
    return (
      <>
        <StatusBar style="dark" />
        <Header title={t('howToGetToUs')} showBackButton />
        <View className="flex-1 p-global justify-center items-center">
          <ActivityIndicator size="large" />
          <ThemedText className="mt-4 text-light-subtext dark:text-dark-subtext">{t('commonLoading')}</ThemedText>
        </View>
      </>
    );
  }

  if (!branch) {
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

  const hasVideo = videoUrl != null;
  const item = kudyItem;

  return (
    <>
      <StatusBar style={hasVideo ? 'light' : 'dark'} translucent={hasVideo} />
      <Header variant={hasVideo ? 'transparent' : 'default'} title={hasVideo ? '' : title} showBackButton />
      <ThemedScroller className="px-0 bg-light-primary dark:bg-dark-primary">
        {hasVideo && videoUrl && (
          <View className="bg-black" style={{ height: 500 }}>
            <VideoPlayer
              uri={videoUrl}
              style={{ width: '100%', height: 500 }}
              contentFit="cover"
              nativeControls
              shouldPlay
              isLooping
              isMuted
              fullscreenEnabled
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
              {locale === 'cs' && item?.descriptionCs
                ? item.descriptionCs
                : (item?.description ?? branch.address ?? '—')}
            </ThemedText>
            {item?.mapsUrl ? (
              <Pressable
                onPress={() => Linking.openURL(item.mapsUrl!)}
                className="flex-row items-center py-3 px-4 rounded-xl bg-light-secondary dark:bg-dark-secondary active:opacity-80 mb-3"
              >
                <Icon name="MapPin" size={22} color={colors.highlight} className="mr-3" />
                <ThemedText className="text-base font-medium">{t('kudyOpenGoogleMaps')}</ThemedText>
              </Pressable>
            ) : null}
            {item?.wazeUrl ? (
              <Pressable
                onPress={() => Linking.openURL(item.wazeUrl!)}
                className="flex-row items-center py-3 px-4 rounded-xl bg-light-secondary dark:bg-dark-secondary active:opacity-80 mb-3"
              >
                <Icon name="Car" size={22} color={colors.highlight} className="mr-3" />
                <ThemedText className="text-base font-medium">{t('kudyOpenWaze')}</ThemedText>
              </Pressable>
            ) : null}
            {item?.uberUrl ? (
              <Pressable
                onPress={() => Linking.openURL(item.uberUrl!)}
                className="flex-row items-center py-3 px-4 rounded-xl bg-light-secondary dark:bg-dark-secondary active:opacity-80"
              >
                <Icon name="Car" size={22} color={colors.highlight} className="mr-3" />
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
          <ThemedText className="text-xl font-bold">{branch.name}</ThemedText>
          <ThemedText className="text-xs opacity-60">{t('kudyHowToGetToUs')}</ThemedText>
        </View>
        {hasVideo && (
          <View className="flex-row items-center ml-auto">
            <Button
              title={t('kudyShowVideo')}
              iconStart="Play"
              variant="primary" className="ml-6 px-6"
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
