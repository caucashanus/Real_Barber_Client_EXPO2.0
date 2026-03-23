import ThemeScroller from '@/components/ThemeScroller';
import React, { useCallback, useContext, useState } from 'react';
import { View, Image, Animated, Pressable, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import AnimatedView from '@/components/AnimatedView';
import { ScrollContext } from './_layout';
import ThemedText from '@/components/ThemedText';
import Section from '@/components/layout/Section';
import { CardScroller } from '@/components/CardScroller';
import Card from '@/components/Card';
import { router } from 'expo-router';
import { Button } from '@/components/Button';
import Icon from '@/components/Icon';
import { useTranslation } from '@/app/hooks/useTranslation';
import useThemeColors from '@/app/contexts/ThemeColors';
import { useAuth } from '@/app/contexts/AuthContext';
import { getClientCuts, type ClientCut } from '@/api/cuts';
import {
  isHaircutIntroCooldownActive,
  setHaircutIntroCooldown24h,
} from '@/utils/haircut-intro-cooldown';

const CUT_PLACEHOLDER = require('@/assets/img/barbers.png');

function cutCardImage(cut: ClientCut) {
  const url = cut.photos?.[0]?.media?.url;
  return url ? { uri: url } : CUT_PLACEHOLDER;
}

const MyHaircutsScreen = () => {
  const scrollY = useContext(ScrollContext);
  const { t } = useTranslation();
  const colors = useThemeColors();
  const { apiToken } = useAuth();
  const [cuts, setCuts] = useState<ClientCut[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [haircutIntroCooldown, setHaircutIntroCooldown] = useState(false);

  useFocusEffect(
    useCallback(() => {
      void isHaircutIntroCooldownActive().then(setHaircutIntroCooldown);
    }, [])
  );

  useFocusEffect(
    useCallback(() => {
      if (!apiToken) {
        setCuts([]);
        setLoadError(null);
        setLoading(false);
        return undefined;
      }

      let cancelled = false;
      setLoading(true);
      setLoadError(null);

      getClientCuts(apiToken, { orderBy: 'updatedAt', orderDirection: 'desc' })
        .then((res) => {
          if (!cancelled) setCuts(res.cuts ?? []);
        })
        .catch((e) => {
          if (!cancelled) {
            setCuts([]);
            setLoadError(e instanceof Error ? e.message : t('myHaircutsLoadError'));
          }
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });

      return () => {
        cancelled = true;
      };
    }, [apiToken, t])
  );

  return (
    <ThemeScroller
      onScroll={Animated.event(
        [{ nativeEvent: { contentOffset: { y: scrollY } } }],
        { useNativeDriver: false }
      )}
      scrollEventThrottle={16}
    >
      <AnimatedView animation="scaleIn" className="flex-1 mt-4">
        {!haircutIntroCooldown ? (
          <View className="p-10 items-center rounded-3xl bg-slate-200 mb-6 dark:bg-dark-secondary">
            <View className="w-20 h-20 relative">
              <View className="w-full h-full rounded-xl relative z-20 overflow-hidden border-2 border-light-primary dark:border-dark-primary">
                <Image className="w-full h-full" source={require('@/assets/img/myidea.png')} resizeMode="contain" />
              </View>
              <View className="w-full h-full absolute top-0 left-8 rotate-12 rounded-xl overflow-hidden border-2 border-light-primary dark:border-dark-primary">
                <Image className="w-full h-full" source={require('@/assets/img/myrules.png')} resizeMode="contain" />
              </View>
              <View className="w-full h-full absolute top-0 right-8 -rotate-12 rounded-xl overflow-hidden border-2 border-light-primary dark:border-dark-primary">
                <Image className="w-full h-full" source={require('@/assets/img/savefinish.png')} resizeMode="contain" />
              </View>
            </View>
            <ThemedText className="text-2xl font-semibold mt-4">{t('myHaircutsCreate')}</ThemedText>
            <ThemedText className="text-sm font-light text-center px-4">{t('myHaircutsCreateDesc')}</ThemedText>
            <Button
              title={t('profileGetStarted')}
              className="mt-4"
              textClassName="text-white"
              onPress={async () => {
                await setHaircutIntroCooldown24h();
                setHaircutIntroCooldown(true);
                router.push('/screens/add-property-start?from=cta');
              }}
            />
          </View>
        ) : null}

        <View className="mb-4 flex-row items-center justify-between gap-2 py-2">
          <Pressable
            onPress={() => router.push('/screens/guide-my-haircuts')}
            className="min-w-0 flex-1 shrink py-1"
            accessibilityRole="link"
            accessibilityLabel={t('myHaircutsWhatsFor')}
          >
            <ThemedText style={{ color: colors.highlight }} className="text-base font-medium">
              {t('myHaircutsWhatsFor')}
            </ThemedText>
          </Pressable>
          <Pressable
            onPress={async () => {
              const skip = await isHaircutIntroCooldownActive();
              router.push(skip ? '/screens/add-property' : '/screens/add-property-start');
            }}
            className="h-10 w-10 shrink-0 items-center justify-center rounded-full bg-light-secondary active:opacity-70 dark:bg-dark-secondary"
            accessibilityRole="button"
            accessibilityLabel={t('myHaircutsAddNewA11y')}
          >
            <Icon name="Plus" size={24} color={colors.highlight} />
          </Pressable>
        </View>

        <Section title={t('myHaircutsYours')} titleSize="lg" className="mb-6">
          <CardScroller space={15} className="mt-1.5 pb-4">
            {!apiToken ? (
              <ThemedText className="py-2 text-light-subtext dark:text-dark-subtext pr-4">
                {t('myHaircutsLoginToSee')}
              </ThemedText>
            ) : loading ? (
              <View className="flex-row items-center py-4 gap-3">
                <ActivityIndicator size="small" />
                <ThemedText className="text-light-subtext dark:text-dark-subtext">{t('commonLoading')}</ThemedText>
              </View>
            ) : loadError ? (
              <ThemedText className="py-2 text-red-500 dark:text-red-400 pr-4">{loadError}</ThemedText>
            ) : cuts.length === 0 ? (
              <ThemedText className="py-2 text-light-subtext dark:text-dark-subtext pr-4">{t('myHaircutsEmpty')}</ThemedText>
            ) : (
              cuts.map((cut) => (
                <Card
                  key={cut.id}
                  title={cut.hairstyle?.trim() || t('haircutTitle')}
                  description={cut.barber?.name}
                  descriptionAvatar={
                    cut.barber?.name
                      ? cut.barber.avatarUrl?.trim() || CUT_PLACEHOLDER
                      : undefined
                  }
                  rounded="2xl"
                  href={`/screens/haircut-detail?id=${encodeURIComponent(cut.id)}`}
                  width={160}
                  imageHeight={160}
                  image={cutCardImage(cut)}
                />
              ))
            )}
          </CardScroller>
        </Section>
      </AnimatedView>
    </ThemeScroller>
  );
};

export default MyHaircutsScreen;
