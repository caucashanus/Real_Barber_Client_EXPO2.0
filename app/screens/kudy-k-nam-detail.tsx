import React, { useRef } from 'react';
import { View } from 'react-native';
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

const KudyKNamDetail = () => {
  const insets = useSafeAreaInsets();
  const videoRef = useRef<Video>(null);
  const { id } = useLocalSearchParams<{ id?: string }>();
  const item = id ? KUDY_K_NAM_VIDEOS.find((v) => v.id === id) : null;
  const title = item ? `Kudy na ${item.title}?` : 'Kudy k nám?';
  const source = item?.source ?? null;

  const handleShowFullscreenVideo = async () => {
    try {
      await videoRef.current?.setStatusAsync({ isMuted: false });
      await videoRef.current?.presentFullscreenPlayer();
      await videoRef.current?.playAsync();
    } catch (_) {}
  };

  if (!item || !source) {
    return (
      <>
        <StatusBar style="dark" />
        <Header title="Kudy k nám?" showBackButton />
        <View className="flex-1 p-global justify-center items-center">
          <ThemedText className="text-light-subtext dark:text-dark-subtext">Pobočka nenalezena.</ThemedText>
        </View>
      </>
    );
  }

  return (
    <>
      <StatusBar style="light" translucent />
      <Header variant="transparent" title="" showBackButton />
      <ThemedScroller className="px-0 bg-light-primary dark:bg-dark-primary">
        <View className="bg-black" style={{ height: 500 }}>
          <Video
            ref={videoRef}
            pointerEvents="none"
            source={typeof source === 'number' ? source : { uri: source.uri }}
            style={{ width: '100%', height: 500 }}
            resizeMode={ResizeMode.COVER}
            useNativeControls
            shouldPlay
            isLooping
            isMuted={true}
          />
        </View>

        <View
          style={{ borderTopLeftRadius: 30, borderTopRightRadius: 30 }}
          className="p-global bg-light-primary dark:bg-dark-primary -mt-[30px]"
        >
          <ThemedText className="text-3xl text-center font-semibold">{title}</ThemedText>

          <Section title="Doprava a parkování" titleSize="lg" className="mb-6 mt-8">
            <ThemedText className="text-base text-light-subtext dark:text-dark-subtext">
              Zde později doplníte statický text – dopravní spoje, kde zaparkovat, atd.
            </ThemedText>
          </Section>
        </View>
      </ThemedScroller>

      <View
        style={{ paddingBottom: insets.bottom }}
        className="flex-row items-center justify-start px-global pt-4 pb-2 bg-light-primary dark:bg-dark-primary border-t border-neutral-200 dark:border-dark-secondary"
      >
        <View>
          <ThemedText className="text-xl font-bold">Pobočka {item.title}</ThemedText>
          <ThemedText className="text-xs opacity-60">Kudy k nám</ThemedText>
        </View>
        <View className="flex-row items-center ml-auto">
          <Button
            title="Zobrazit video"
            iconStart="Play"
            className="bg-highlight ml-6 px-6"
            textClassName="text-white"
            size="medium"
            onPress={handleShowFullscreenVideo}
            rounded="lg"
          />
        </View>
      </View>
    </>
  );
};

export default KudyKNamDetail;
