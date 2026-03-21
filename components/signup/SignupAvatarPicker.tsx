import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Image,
  Pressable,
  ScrollView,
  useWindowDimensions,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import ThemedText from '@/components/ThemedText';
import Icon from '@/components/Icon';
import { getAllPublicMediaByFlag, type MediaFile } from '@/api/media';
import { useTranslation } from '@/app/hooks/useTranslation';

export type AvatarChoice =
  | { kind: 'none' }
  | { kind: 'catalog'; id: string; url: string }
  | { kind: 'custom'; uri: string };

/** Náhledy v karuselu (+ a avatary z API), +20 % oproti původním 72 / 12. */
const THUMB = Math.round(72 * 1.2);
const THUMB_GAP = Math.round(12 * 1.2);
const THUMB_PLUS_ICON = Math.round(28 * 1.2);

/** Náhodné pořadí při každém načtení (Fisher–Yates). */
function shuffleArray<T>(items: T[]): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

interface SignupAvatarPickerProps {
  value: AvatarChoice;
  onChange: (next: AvatarChoice) => void;
  carouselHint: string;
}

export default function SignupAvatarPicker({
  value,
  onChange,
  carouselHint,
}: SignupAvatarPickerProps) {
  const { t } = useTranslation();
  const { width: windowWidth } = useWindowDimensions();
  const slotWidth = THUMB + THUMB_GAP;

  const [catalog, setCatalog] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadCatalog = useCallback(async () => {
    setLoadError(null);
    setLoading(true);
    try {
      const items = await getAllPublicMediaByFlag();
      setCatalog(shuffleArray(items));
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : t('signupAvatarLoadError'));
      setCatalog([]);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void loadCatalog();
  }, [loadCatalog]);

  const previewSource = (() => {
    if (value.kind === 'catalog') {
      return { uri: value.url } as const;
    }
    if (value.kind === 'custom') {
      return { uri: value.uri } as const;
    }
    return null;
  })();

  const pickFromLibrary = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]?.uri) {
      onChange({ kind: 'custom', uri: result.assets[0].uri });
    }
  };

  const selectCatalog = (item: MediaFile) => {
    onChange({ kind: 'catalog', id: item.id, url: item.url });
  };

  return (
    <View className="items-center">
      <View
        className="rounded-full overflow-hidden border-4 border-light-secondary dark:border-dark-secondary bg-light-secondary dark:bg-dark-secondary mb-6"
        style={{ width: 140, height: 140 }}
      >
        {previewSource ? (
          <Image source={previewSource} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
        ) : (
          <View className="flex-1 items-center justify-center">
            <Icon name="User" size={56} className="text-light-subtext dark:text-dark-subtext opacity-60" />
          </View>
        )}
      </View>

      <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext mb-3 text-center px-2">
        {carouselHint}
      </ThemedText>

      {loading ? (
        <View className="py-8">
          <ActivityIndicator size="small" />
          <ThemedText className="text-xs text-light-subtext dark:text-dark-subtext mt-2 text-center">
            {t('signupAvatarLoading')}
          </ThemedText>
        </View>
      ) : (
        <>
          {loadError ? (
            <View className="items-center py-2 px-4 mb-2">
              <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext text-center mb-2">
                {loadError}
              </ThemedText>
              <Pressable
                onPress={() => void loadCatalog()}
                className="px-4 py-2 rounded-full bg-light-secondary dark:bg-dark-secondary active:opacity-80"
              >
                <ThemedText className="text-sm font-medium text-light-text dark:text-dark-text">
                  {t('signupAvatarRetry')}
                </ThemedText>
              </Pressable>
            </View>
          ) : null}

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={slotWidth}
            decelerationRate="fast"
            contentContainerStyle={{
              paddingHorizontal: Math.max(16, (windowWidth - slotWidth) / 2),
              paddingVertical: 8,
              gap: THUMB_GAP,
            }}
          >
            <Pressable
              onPress={pickFromLibrary}
              className="rounded-full border-2 border-dashed border-neutral-400 dark:border-neutral-500 items-center justify-center bg-light-primary dark:bg-dark-primary"
              style={{ width: THUMB, height: THUMB }}
              accessibilityRole="button"
              accessibilityLabel={t('signupAvatarAddHint')}
            >
              <Icon name="Plus" size={THUMB_PLUS_ICON} className="text-light-text dark:text-dark-text" />
            </Pressable>

            {catalog.map((item) => {
              const selected = value.kind === 'catalog' && value.id === item.id;
              return (
                <Pressable
                  key={item.id}
                  onPress={() => selectCatalog(item)}
                  className={`rounded-full overflow-hidden border-2 ${
                    selected ? 'border-light-accent dark:border-dark-accent' : 'border-transparent'
                  }`}
                  style={{ width: THUMB, height: THUMB }}
                >
                  <Image
                    source={{ uri: item.url }}
                    style={{ width: '100%', height: '100%' }}
                    resizeMode="cover"
                  />
                </Pressable>
              );
            })}
          </ScrollView>
        </>
      )}
    </View>
  );
}
