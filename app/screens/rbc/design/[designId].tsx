import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions, Alert, Animated } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

import Header from '@/components/Header';
import ThemedScroller from '@/components/ThemeScroller';
import ThemedText from '@/components/ThemedText';
import { Button } from '@/components/Button';
import { cardDesigns, RBC_SELECTED_CARD_KEY, type CardDesign } from '@/constants/card-designs';
import { useAuth } from '@/app/contexts/AuthContext';
import { useTranslation } from '@/app/hooks/useTranslation';
import RBLogo from '@/components/RBLogo';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_ASPECT_RATIO = 1.625;
const CARD_PADDING = 24;
const CARD_WIDTH = SCREEN_WIDTH - CARD_PADDING * 2;
const CARD_HEIGHT = CARD_WIDTH / CARD_ASPECT_RATIO;

export default function CardDesignDetailScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { designId } = useLocalSearchParams<{ designId: string }>();
  const { client } = useAuth();
  const cardScale = useRef(new Animated.Value(0)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;

  const design = React.useMemo(
    () => (designId ? cardDesigns.find((d) => d.id === designId) : undefined),
    [designId]
  );

  const displayName = (client?.name?.trim() || 'CARDHOLDER').toUpperCase();
  const clientId = client?.id ?? '';
  const cardNumber = `${clientId.substring(0, 4) || '0000'} **** **** ${clientId.substring(Math.max(0, clientId.length - 4)) || '0000'}`;

  useEffect(() => {
    if (!design) return;
    cardScale.setValue(0);
    cardOpacity.setValue(0);
    Animated.parallel([
      Animated.timing(cardOpacity, {
        toValue: 1,
        duration: 280,
        useNativeDriver: true,
      }),
      Animated.spring(cardScale, {
        toValue: 1,
        friction: 6,
        tension: 80,
        useNativeDriver: true,
      }),
    ]).start();
  }, [design?.id]);

  const handleUseDesign = async () => {
    if (!design) return;
    try {
      await AsyncStorage.setItem(RBC_SELECTED_CARD_KEY, design.id);
      Alert.alert('Design updated', `Card design set to: ${design.name}`, [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch {
      Alert.alert('Error', 'Could not save design.');
    }
  };

  if (!design) {
    return (
      <>
        <Header showBackButton />
        <View className="flex-1 items-center justify-center px-6 bg-light-primary dark:bg-dark-primary">
          <ThemedText className="text-base text-light-subtext dark:text-dark-subtext text-center">Design not found.</ThemedText>
          <Button title={t('rbcBack')} onPress={() => router.back()} className="mt-4" variant="outline" />
        </View>
      </>
    );
  }

  const textColor = design.textColor;
  const cardSize = { width: CARD_WIDTH, height: CARD_HEIGHT };
  const cardAnimatedStyle = {
    opacity: cardOpacity,
    transform: [
      { translateY: cardScale.interpolate({ inputRange: [0, 1], outputRange: [50, 0] }) },
      { scale: cardScale },
    ],
  };
  const cardContentEl = (
    <View style={styles.cardContent}>
      <View style={styles.cardHeader}>
        <ThemedText style={[styles.cardDebit, { color: textColor }]}>DEBIT</ThemedText>
        <View style={styles.cardLogo}>
          <RBLogo width={30} height={18} fill={textColor} />
        </View>
      </View>
      <View style={styles.cardNumberContainer}>
        <ThemedText style={[styles.cardNumber, { color: textColor }]} numberOfLines={1}>
          {cardNumber}
        </ThemedText>
      </View>
      <View style={styles.cardFooter}>
        <View>
          <ThemedText style={[styles.cardLabel, { color: textColor }]}>CARDHOLDER</ThemedText>
          <ThemedText style={[styles.cardHolder, { color: textColor }]} numberOfLines={1}>
            {displayName}
          </ThemedText>
        </View>
        <View>
          <ThemedText style={[styles.cardLabel, { color: textColor }]}>EXPIRES</ThemedText>
          <ThemedText style={[styles.cardExpiry, { color: textColor }]}>12/25</ThemedText>
        </View>
      </View>
    </View>
  );

  return (
    <>
      <Header showBackButton />
      <ThemedScroller className="flex-1 bg-light-primary dark:bg-dark-primary">
        <View className="px-6 pt-4 pb-8">
          <View className="items-center mb-6">
            <ThemedText className="text-xl font-semibold text-light-text dark:text-dark-text">{design.name}</ThemedText>
            <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext mt-1 text-center max-w-xs">
              Minimalist style. Use this design for your RBC card.
            </ThemedText>
          </View>

          <View style={styles.cardWrapper}>
            <Animated.View style={cardAnimatedStyle}>
              {design.type === 'image' && typeof design.frontImage === 'number' ? (
                <View style={[styles.card, cardSize]}>
                  <Image
                    source={design.frontImage}
                    style={StyleSheet.absoluteFillObject}
                    contentFit="cover"
                  />
                  <View style={styles.cardImageOverlay} />
                  <View style={[StyleSheet.absoluteFillObject, styles.cardImageContentWrap]}>
                    {cardContentEl}
                  </View>
                </View>
              ) : (
                <LinearGradient
                  colors={design.gradientColors ?? ['#667eea', '#764ba2']}
                  start={design.gradientStart ?? { x: 0, y: 0 }}
                  end={design.gradientEnd ?? { x: 1, y: 1 }}
                  style={[styles.card, cardSize]}
                >
                  {cardContentEl}
                </LinearGradient>
              )}
            </Animated.View>
          </View>

          <Button
            title={t('rbcUseThisDesign')}
            onPress={handleUseDesign}
            className="mt-6"
          />
        </View>
      </ThemedScroller>
    </>
  );
}

const styles = StyleSheet.create({
  cardWrapper: { alignItems: 'center', marginBottom: 8 },
  card: {
    borderRadius: 16,
    padding: 20,
    justifyContent: 'space-between',
    overflow: 'hidden',
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
  cardLogo: { width: 30, height: 18, justifyContent: 'center', alignItems: 'center' },
  cardNumberContainer: { marginVertical: 12 },
  cardNumber: { fontSize: 16, fontWeight: '600', letterSpacing: 2 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  cardLabel: { fontSize: 10, opacity: 0.75, marginBottom: 2 },
  cardHolder: { fontSize: 12, fontWeight: '500' },
  cardExpiry: { fontSize: 12, fontWeight: '500' },
});
