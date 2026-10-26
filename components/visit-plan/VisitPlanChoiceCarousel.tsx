import { Image } from 'expo-image';
import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  View,
  type ImageSourcePropType,
} from 'react-native';

import ThemedText from '@/components/ThemedText';
import VisitPlanPagerDots from '@/components/visit-plan/VisitPlanPagerDots';
import { useAccentColor } from '@/contexts/AccentColorContext';
import { useTranslation } from '@/hooks/useTranslation';
import { fillTranslationParams } from '@/utils/fillTranslationParams';

const { width: SCREEN_W } = Dimensions.get('window');
/** Full-width page stride — prevents adjacent slide text from peeking while swiping. */
const PAGE_W = SCREEN_W;
const SLIDE_W = Math.min(SCREEN_W - 32, 420);
const SLIDE_TEXT_HORIZONTAL_PAD = 20;

/** Web parity — hero illustration nearly full slide width. */
function getChoiceHeroImageSize(slideWidth: number) {
  const width = Math.round(slideWidth * 0.94);
  const height = Math.round(width * 0.88);
  return { width, height };
}

export type VisitPlanChoiceCarouselOption<T extends string> = {
  value: T;
  title: string;
  description?: string;
  icon: ImageSourcePropType;
};

export type VisitPlanChoiceCarouselHandle = {
  scrollToIndex: (index: number) => void;
};

type Props<T extends string> = {
  options: readonly VisitPlanChoiceCarouselOption<T>[];
  value: T | null;
  /** Tap = potvrzení hodnoty; swipe/tečky jen náhled — mimo potvrzený slide volá `null`. */
  onChange: (value: T | null) => void;
};

function VisitPlanChoiceCarouselInner<T extends string>(
  { options, value, onChange }: Props<T>,
  ref: React.Ref<VisitPlanChoiceCarouselHandle>
) {
  const { t } = useTranslation();
  const { accentColor } = useAccentColor();
  const listRef = useRef<FlatList>(null);
  const skipScrollCommitRef = useRef(false);
  const [pageIndex, setPageIndex] = useState(() => {
    if (value == null) return 0;
    const i = options.findIndex((o) => o.value === value);
    return i >= 0 ? i : 0;
  });

  const confirmedIndex =
    value == null ? -1 : options.findIndex((option) => option.value === value);

  const commitPageIndex = useCallback(
    (index: number) => {
      const clamped = Math.max(0, Math.min(index, options.length - 1));
      setPageIndex(clamped);
      if (value != null && confirmedIndex >= 0 && confirmedIndex !== clamped) {
        onChange(null);
      }
    },
    [confirmedIndex, onChange, options.length, value]
  );

  const scrollToIndex = useCallback(
    (index: number) => {
      const clamped = Math.max(0, Math.min(index, options.length - 1));
      listRef.current?.scrollToOffset({ offset: clamped * PAGE_W, animated: true });
      commitPageIndex(clamped);
    },
    [commitPageIndex]
  );

  useImperativeHandle(ref, () => ({ scrollToIndex }), [scrollToIndex]);

  useEffect(() => {
    if (value == null) return;
    const i = options.findIndex((o) => o.value === value);
    if (i < 0) return;
    skipScrollCommitRef.current = true;
    setPageIndex(i);
    listRef.current?.scrollToOffset({ offset: i * PAGE_W, animated: false });
    requestAnimationFrame(() => {
      skipScrollCommitRef.current = false;
    });
  }, [options, value]);

  const onScrollSettled = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (skipScrollCommitRef.current) return;
    const idx = Math.round(e.nativeEvent.contentOffset.x / PAGE_W);
    commitPageIndex(idx);
  };

  return (
    <View className="pt-8" style={{ width: SCREEN_W, alignSelf: 'center' }}>
      <FlatList
        ref={listRef}
        data={options}
        horizontal
        pagingEnabled
        decelerationRate="fast"
        snapToInterval={PAGE_W}
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScrollSettled}
        onScrollEndDrag={onScrollSettled}
        style={{ width: PAGE_W, flexGrow: 0, overflow: 'hidden' }}
        keyExtractor={(item) => item.value}
        accessibilityLabel={t('visitPlanSetupChoiceCarouselAria')}
        renderItem={({ item }) => {
          const selected = value === item.value;
          const heroSize = getChoiceHeroImageSize(SLIDE_W);
          return (
            <View style={{ width: PAGE_W, overflow: 'hidden' }} className="items-center">
              <Pressable
                onPress={() => onChange(item.value)}
                accessibilityRole="button"
                accessibilityState={{ selected: selected }}
                style={{ width: SLIDE_W, paddingHorizontal: SLIDE_TEXT_HORIZONTAL_PAD }}
                className="items-center overflow-hidden active:opacity-90">
                <View
                  className="w-full items-center justify-center"
                  style={{ minHeight: heroSize.height }}>
                  <Image
                    source={item.icon}
                    style={{ width: heroSize.width, height: heroSize.height }}
                    contentFit="contain"
                  />
                </View>
                <ThemedText
                  className="mt-3 w-full text-center text-2xl font-semibold"
                  style={selected ? { color: accentColor } : undefined}>
                  {item.title}
                </ThemedText>
                {item.description ? (
                  <ThemedText className="mt-2 w-full text-center text-sm leading-5 text-light-subtext dark:text-dark-subtext">
                    {item.description}
                  </ThemedText>
                ) : null}
              </Pressable>
            </View>
          );
        }}
      />

      {options.length > 1 ? (
        <View className="mt-20 items-center" style={{ width: SCREEN_W }}>
          <VisitPlanPagerDots
            count={options.length}
            activeIndex={pageIndex}
            variant="onSurface"
            onPressIndex={scrollToIndex}
            getDotAccessibilityLabel={(current, total) =>
              fillTranslationParams(t('visitPlanSetupChoiceDotAria'), { current, total })
            }
          />
        </View>
      ) : null}
    </View>
  );
}

const VisitPlanChoiceCarousel = forwardRef(VisitPlanChoiceCarouselInner) as <T extends string>(
  props: Props<T> & { ref?: React.Ref<VisitPlanChoiceCarouselHandle> }
) => React.ReactElement | null;

export default VisitPlanChoiceCarousel;
