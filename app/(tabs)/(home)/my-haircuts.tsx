import ThemeScroller from '@/components/ThemeScroller';
import React, { useCallback, useContext, useState } from 'react';
import { View, Pressable, Image, Animated, ActivityIndicator } from 'react-native';
import Section from '@/components/layout/Section';
import { CardScroller } from '@/components/CardScroller';
import Card from '@/components/Card';
import AnimatedView from '@/components/AnimatedView';
import { ScrollContext } from './_layout';
import ThemedText from '@/components/ThemedText';
import { router } from 'expo-router';
import { useAuth } from '@/app/contexts/AuthContext';
import { getClientCuts, type ClientCut } from '@/api/cuts';
import { useFocusEffect } from '@react-navigation/native';
import Icon from '@/components/Icon';
import { Button } from '@/components/Button';

const PLACEHOLDER_IMAGE = require('@/assets/img/room-1.avif');

function formatCutSubtitle(cut: ClientCut): string {
  if (cut.barber?.name) return cut.barber.name;
  const d = cut.createdAt ? new Date(cut.createdAt) : null;
  if (d) return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  return '—';
}

const MyHaircutsScreen = () => {
  const scrollY = useContext(ScrollContext);
  const { apiToken } = useAuth();
  const [cuts, setCuts] = useState<ClientCut[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCuts = useCallback(() => {
    if (!apiToken) {
      setCuts([]);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    getClientCuts(apiToken, { limit: 50, orderBy: 'createdAt', orderDirection: 'desc' })
      .then((res) => setCuts(res.cuts ?? []))
      .catch(() => {
        setCuts([]);
        setError('Nepodařilo se načíst účesy. Zkus to znovu.');
      })
      .finally(() => setLoading(false));
  }, [apiToken]);

  useFocusEffect(useCallback(() => { loadCuts(); }, [loadCuts]));

  return (
    <ThemeScroller
      onScroll={Animated.event(
        [{ nativeEvent: { contentOffset: { y: scrollY } } }],
        { useNativeDriver: false }
      )}
      scrollEventThrottle={16}
    >
      <AnimatedView animation="scaleIn" className="flex-1 mt-4">
        <View className="p-10 items-center rounded-3xl bg-slate-200 mt-6 mb-8 dark:bg-dark-secondary">
          <View className="w-20 h-20 relative">
            <View className="w-full h-full rounded-xl relative z-20 overflow-hidden border-2 border-light-primary dark:border-dark-primary">
              <Image className="w-full h-full" source={{ uri: 'https://images.unsplash.com/photo-1526318896980-cf78c088247c?q=80&w=400' }} />
            </View>
            <View className="w-full h-full absolute top-0 left-8 rotate-12 rounded-xl overflow-hidden border-2 border-light-primary dark:border-dark-primary">
              <Image className="w-full h-full" source={{ uri: 'https://images.pexels.com/photos/69903/pexels-photo-69903.jpeg?auto=compress&cs=tinysrgb&w=1200' }} />
            </View>
            <View className="w-full h-full absolute top-0 right-8 -rotate-12 rounded-xl overflow-hidden border-2 border-light-primary dark:border-dark-primary">
              <Image className="w-full h-full" source={{ uri: 'https://images.pexels.com/photos/69903/pexels-photo-69903.jpeg?auto=compress&cs=tinysrgb&w=1200' }} />
            </View>
          </View>
          <ThemedText className="text-2xl font-semibold mt-4">New to hosting?</ThemedText>
          <ThemedText className="text-sm font-light text-center px-4">Discover how to start hosting and earn extra income</ThemedText>
          <Button title="Get started" className="mt-4" textClassName="text-white" onPress={() => router.push('/screens/add-property-start')} />
        </View>

        <Section
          header={
            <View className="flex-row items-center justify-between w-full pr-1">
              <View className="flex-1">
                <ThemedText className="text-lg font-semibold text-light-primary dark:text-dark-primary">
                  My haircuts
                </ThemedText>
                <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext mt-0.5">
                  Účesy, které máš u nás uložené. Můžeš si je pojmenovat a upravit.
                </ThemedText>
              </View>
              <Pressable onPress={() => router.push('/screens/haircut-add')} hitSlop={8}>
                <ThemedText className="text-base font-medium text-highlight">Přidat</ThemedText>
              </Pressable>
            </View>
          }
        >
          {loading ? (
            <View className="py-10 items-center">
              <ActivityIndicator size="large" />
              <ThemedText className="mt-2 text-light-subtext dark:text-dark-subtext">
                Načítám účesy…
              </ThemedText>
            </View>
          ) : error ? (
            <View className="py-8 px-4 items-center">
              <Icon name="Image" size={48} className="text-light-tertiary dark:text-dark-tertiary mb-3" />
              <ThemedText className="text-center text-light-subtext dark:text-dark-subtext mb-4">
                {error}
              </ThemedText>
              <Button title="Zkusit znovu" onPress={loadCuts} />
            </View>
          ) : cuts.length === 0 ? (
            <View className="py-10 px-4 items-center">
              <Icon name="Image" size={56} className="text-light-tertiary dark:text-dark-tertiary mb-4" />
              <ThemedText className="text-center text-light-subtext dark:text-dark-subtext mb-2">
                Zatím nemáš žádný uložený účes.
              </ThemedText>
              <ThemedText className="text-center text-light-subtext dark:text-dark-subtext mb-6">
                Po návštěvě ti ho může kadeřník přidat, nebo si ho přidej sám.
              </ThemedText>
              <View className="flex-row gap-3">
                <Button title="Přidat účes" onPress={() => router.push('/screens/haircut-add')} />
                <Button title="Hledat kadeřnictví" variant="outline" onPress={() => router.push('/screens/map')} />
              </View>
            </View>
          ) : (
            <CardScroller space={15} className="mt-1.5 pb-4">
              {cuts.map((cut) => {
                const imageSource =
                  cut.photos?.[0]?.media?.url
                    ? { uri: cut.photos[0].media.url }
                    : PLACEHOLDER_IMAGE;
                return (
                  <Card
                    key={cut.id}
                    title={cut.hairstyle || 'Untitled'}
                    rounded="2xl"
                    price={formatCutSubtitle(cut)}
                    width={160}
                    imageHeight={160}
                    image={imageSource}
                    onPress={() => router.push({ pathname: '/screens/haircut-detail', params: { id: cut.id } })}
                  />
                );
              })}
            </CardScroller>
          )}
        </Section>
      </AnimatedView>
    </ThemeScroller>
  );
};

export default MyHaircutsScreen;
