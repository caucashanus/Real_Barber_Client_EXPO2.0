import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useRef, useState } from 'react';
import { View, Pressable, Animated, Dimensions, StyleSheet, ActivityIndicator } from 'react-native';

import { getRbCoinsBalance, getRbCoinsHistory } from '@/api/rb-coins';
import { useAuth } from '@/app/contexts/AuthContext';
import { useTranslation } from '@/app/hooks/useTranslation';
import Header from '@/components/Header';
import Icon from '@/components/Icon';
import RBLogo from '@/components/RBLogo';
import ThemedScroller from '@/components/ThemeScroller';
import ThemedText from '@/components/ThemedText';
import { cardDesigns, RBC_SELECTED_CARD_KEY, type CardDesign } from '@/constants/card-designs';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_ASPECT_RATIO = 1.625;
const CARD_PADDING = 24;
const CARD_WIDTH = SCREEN_WIDTH - CARD_PADDING * 2;
const CARD_HEIGHT = CARD_WIDTH / CARD_ASPECT_RATIO;

function formatBalance(value: number): string {
  return value.toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

export default function RBCScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { apiToken, client } = useAuth();
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCardDesign, setSelectedCardDesign] = useState<CardDesign>(cardDesigns[0]);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const flipAnimation = useRef(new Animated.Value(0)).current;

  const displayName = client?.name?.trim() || 'CARDHOLDER';
  const clientId = client?.id ?? '';

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        try {
          const savedId = await AsyncStorage.getItem(RBC_SELECTED_CARD_KEY);
          if (savedId && !cancelled) {
            const design = cardDesigns.find((d) => d.id === savedId);
            if (design) setSelectedCardDesign(design);
          }
        } catch {
          // ignore
        }
      })();
      return () => {
        cancelled = true;
      };
    }, [])
  );

  React.useEffect(() => {
    if (!apiToken) {
      setBalance(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    Promise.all([
      getRbCoinsBalance(apiToken).then((r) => r.balance),
      getRbCoinsHistory(apiToken, { limit: 5 }).catch(() => ({ data: [] })),
    ])
      .then(([bal]) => {
        setBalance(bal);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Error'))
      .finally(() => setLoading(false));
  }, [apiToken]);

  const handleFlipCard = () => {
    const next = !isFlipped;
    setIsFlipped(next);
    Animated.timing(flipAnimation, {
      toValue: next ? 1 : 0,
      duration: 600,
      useNativeDriver: true,
    }).start();
  };

  const toggleShowDetails = () => setShowDetails((p) => !p);

  const cardNumberMasked = `${clientId.substring(0, 4) || '0000'} **** **** ${clientId.substring(Math.max(0, clientId.length - 4)) || '0000'}`;
  const cardNumberFull =
    clientId.length >= 16
      ? `${clientId.slice(0, 4)} ${clientId.slice(4, 8)} ${clientId.slice(8, 12)} ${clientId.slice(12, 16)}`
      : `${clientId.substring(0, 4) || '0000'} 0000 0000 ${clientId.substring(Math.max(0, clientId.length - 4)) || '0000'}`;

  const frontOpacity = flipAnimation.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 1, 0],
  });
  const frontRotateY = flipAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });
  const backOpacity = flipAnimation.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0, 1],
  });
  const backRotateY = flipAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['180deg', '360deg'],
  });

  const cardContent = (design: CardDesign, isBack: boolean) => {
    const textColor = design.textColor;
    if (isBack) {
      return (
        <View style={styles.cardBackContent}>
          <View style={[styles.cardBackMagnetic, { backgroundColor: `rgba(0,0,0,0.3)` }]} />
          <View style={styles.cardBackCVV}>
            <ThemedText style={[styles.cardBackLabel, { color: textColor }]}>CVV</ThemedText>
            <View style={styles.cardBackCVVBox}>
              <ThemedText style={[styles.cardBackCVVText, { color: textColor }]}>
                {showDetails ? '123' : '•••'}
              </ThemedText>
            </View>
          </View>
        </View>
      );
    }
    return (
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <ThemedText style={[styles.cardDebit, { color: textColor }]}>DEBIT</ThemedText>
          <View style={styles.cardLogo}>
            <RBLogo width={30} height={18} fill={textColor} />
          </View>
        </View>
        <View style={styles.cardNumberContainer}>
          <ThemedText style={[styles.cardNumber, { color: textColor }]} numberOfLines={1}>
            {showDetails ? cardNumberFull : cardNumberMasked}
          </ThemedText>
        </View>
        <View style={styles.cardFooter}>
          <View>
            <ThemedText style={[styles.cardLabel, { color: textColor }]}>CARDHOLDER</ThemedText>
            <ThemedText style={[styles.cardHolder, { color: textColor }]} numberOfLines={1}>
              {showDetails ? displayName.toUpperCase() : '••••••••'}
            </ThemedText>
          </View>
          <View>
            <ThemedText style={[styles.cardLabel, { color: textColor }]}>EXPIRES</ThemedText>
            <ThemedText style={[styles.cardExpiry, { color: textColor }]}>
              {showDetails ? '12/25' : '••/••'}
            </ThemedText>
          </View>
        </View>
      </View>
    );
  };

  const renderCardSide = (
    design: CardDesign,
    isBack: boolean,
    opacity: Animated.AnimatedInterpolation<number>,
    rotateY: Animated.AnimatedInterpolation<string | number>
  ) => {
    const cardSize = { width: CARD_WIDTH, height: CARD_HEIGHT };
    const animatedStyle = [styles.cardSide, { opacity, transform: [{ rotateY }] }];
    if (design.type === 'image') {
      const source = isBack
        ? (design.backImage ?? design.frontImage)
        : (design.frontImage ?? design.backImage);
      return (
        <Animated.View style={animatedStyle} pointerEvents="none">
          <View style={[styles.card, cardSize]}>
            {typeof source === 'number' && (
              <Image source={source} style={StyleSheet.absoluteFillObject} contentFit="cover" />
            )}
            <View style={styles.cardImageOverlay} />
            <View
              style={[StyleSheet.absoluteFillObject, styles.cardImageContentWrap]}
              pointerEvents="none">
              {cardContent(design, isBack)}
            </View>
          </View>
        </Animated.View>
      );
    }
    const colors = design.gradientColors ?? ['#667eea', '#764ba2'];
    const start = design.gradientStart ?? { x: 0, y: 0 };
    const end = design.gradientEnd ?? { x: 1, y: 1 };
    return (
      <Animated.View style={animatedStyle} pointerEvents="none">
        <LinearGradient colors={colors} start={start} end={end} style={[styles.card, cardSize]}>
          {cardContent(design, isBack)}
        </LinearGradient>
      </Animated.View>
    );
  };

  return (
    <>
      <Header showBackButton />
      <ThemedScroller className="flex-1 bg-light-primary dark:bg-dark-primary">
        <View className="px-6 pb-6 pt-4">
          {/* Balance */}
          <View className="mb-6">
            <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">
              {t('rbcYourBalance')}
            </ThemedText>
            {loading ? (
              <ActivityIndicator size="small" className="mt-2" />
            ) : error ? (
              <ThemedText className="mt-1 text-lg text-red-500 dark:text-red-400">
                {error}
              </ThemedText>
            ) : (
              <View className="mt-1 flex-row items-baseline">
                <ThemedText className="text-3xl font-bold text-light-text dark:text-dark-text">
                  {formatBalance(balance ?? 0)}
                </ThemedText>
                <ThemedText className="ml-2 text-lg font-semibold text-light-subtext dark:text-dark-subtext">
                  RBC
                </ThemedText>
              </View>
            )}
          </View>

          {/* Card */}
          <View style={styles.cardContainer}>
            <Pressable
              onPress={handleFlipCard}
              style={[styles.cardFlipContainer, { height: CARD_HEIGHT }]}>
              <View style={styles.cardFlipInner}>
                {renderCardSide(selectedCardDesign, false, frontOpacity, frontRotateY)}
                {renderCardSide(selectedCardDesign, true, backOpacity, backRotateY)}
              </View>
            </Pressable>
            <Pressable
              onPress={toggleShowDetails}
              className="mt-3 flex-row items-center justify-center gap-2">
              <Icon name={showDetails ? 'EyeOff' : 'Eye'} size={18} />
              <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">
                {showDetails ? t('rbcHideDetails') : t('rbcShowDetails')}
              </ThemedText>
            </Pressable>
          </View>

          {/* Actions */}
          <View className="mt-8 flex-row justify-around border-t border-light-secondary py-4 dark:border-dark-secondary">
            <Pressable
              onPress={() => router.push('/screens/transfer-select-recipient')}
              className="items-center">
              <View className="h-14 w-14 items-center justify-center rounded-full bg-light-secondary dark:bg-dark-secondary">
                <Icon name="Send" size={22} color="#0EA5E9" />
              </View>
              <ThemedText className="mt-2 text-xs text-light-text dark:text-dark-text">
                {t('rbcSend')}
              </ThemedText>
            </Pressable>
            <Pressable
              onPress={() => router.push('/screens/rbc/historie')}
              className="items-center">
              <View className="h-14 w-14 items-center justify-center rounded-full bg-light-secondary dark:bg-dark-secondary">
                <Icon name="Clock" size={22} />
              </View>
              <ThemedText className="mt-2 text-xs text-light-text dark:text-dark-text">
                {t('rbcHistory')}
              </ThemedText>
            </Pressable>
            <Pressable onPress={() => router.push('/screens/rbc/design')} className="items-center">
              <View className="h-14 w-14 items-center justify-center rounded-full bg-light-secondary dark:bg-dark-secondary">
                <Icon name="Palette" size={22} />
              </View>
              <ThemedText className="mt-2 text-xs text-light-text dark:text-dark-text">
                {t('rbcDesign')}
              </ThemedText>
            </Pressable>
          </View>
        </View>
      </ThemedScroller>
    </>
  );
}

const styles = StyleSheet.create({
  cardContainer: { marginBottom: 8 },
  cardFlipContainer: { width: '100%', alignSelf: 'center' },
  cardFlipInner: { width: '100%', height: '100%', position: 'relative' },
  cardSide: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    backfaceVisibility: 'hidden',
    alignItems: 'center',
  },
  card: {
    borderRadius: 16,
    padding: 20,
    justifyContent: 'space-between',
    overflow: 'hidden',
    alignSelf: 'center',
  },
  cardImageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.12)',
  },
  cardImageContentWrap: {
    padding: 20,
    justifyContent: 'space-between',
  },
  cardContent: { flex: 1, justifyContent: 'space-between' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardDebit: { fontSize: 10, letterSpacing: 1, opacity: 0.9 },
  cardLogo: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardNumberContainer: { marginVertical: 12 },
  cardNumber: { fontSize: 16, fontWeight: '600', letterSpacing: 2 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  cardLabel: { fontSize: 10, opacity: 0.75, marginBottom: 2 },
  cardHolder: { fontSize: 12, fontWeight: '500' },
  cardExpiry: { fontSize: 12, fontWeight: '500' },
  cardBackContent: { flex: 1, justifyContent: 'space-between', paddingVertical: 20 },
  cardBackMagnetic: { height: 48, borderRadius: 4, marginTop: 12, marginBottom: 16 },
  cardBackCVV: { alignItems: 'flex-end' },
  cardBackLabel: { fontSize: 10, opacity: 0.75, marginBottom: 4 },
  cardBackCVVBox: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    minWidth: 72,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  cardBackCVVText: { fontSize: 16, fontWeight: '600' },
});
