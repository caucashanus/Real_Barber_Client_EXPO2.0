import React, { useEffect, useState } from 'react';
import { View, Pressable, StyleSheet, ScrollView } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

import Header from '@/components/Header';
import ThemedScroller from '@/components/ThemeScroller';
import ThemedText from '@/components/ThemedText';
import {
  cardDesigns,
  CARD_DESIGN_CATEGORY_ORDER,
  RBC_SELECTED_CARD_KEY,
  type CardDesign,
} from '@/constants/card-designs';
import { useAuth } from '@/app/contexts/AuthContext';
import RBLogo from '@/components/RBLogo';

const CARD_WIDTH = 160;
const CARD_HEIGHT = 260;

export default function CardDesignGalleryScreen() {
  const router = useRouter();
  const { client } = useAuth();
  const [selectedCardDesignId, setSelectedCardDesignId] = useState<string | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(RBC_SELECTED_CARD_KEY).then((savedId) => {
      if (savedId) setSelectedCardDesignId(savedId);
    }).catch(() => {});
  }, []);

  const displayName = (client?.name?.trim() || 'CARDHOLDER').substring(0, 8).toUpperCase();

  const byCategory = new Map<string, CardDesign[]>();
  for (const design of cardDesigns) {
    const cat = design.category;
    if (!byCategory.has(cat)) byCategory.set(cat, []);
    byCategory.get(cat)!.push(design);
  }
  const designSections = CARD_DESIGN_CATEGORY_ORDER.filter(
    (cat) => (byCategory.get(cat)?.length ?? 0) > 0
  ).map((category) => ({
    title: category,
    designs: byCategory.get(category) ?? [],
  }));

  const renderPreviewContent = (textColor: string) => (
    <View style={styles.cardPreviewContent}>
      <View style={styles.cardPreviewHeader}>
        <View style={styles.cardPreviewVerticalText}>
          <ThemedText style={[styles.cardPreviewDebit, { color: textColor }]}>DEBIT</ThemedText>
        </View>
        <View style={[styles.cardPreviewLogo, styles.cardPreviewVerticalText]}>
          <RBLogo width={30} height={18} fill={textColor} />
        </View>
      </View>
      <View style={styles.cardPreviewNumber}>
        <View style={styles.cardPreviewVerticalText}>
          <ThemedText style={[styles.cardPreviewNumberText, { color: textColor }]} numberOfLines={1}>
            **** ****
          </ThemedText>
        </View>
      </View>
      <View style={styles.cardPreviewFooter}>
        <View style={styles.cardPreviewVerticalText}>
          <ThemedText style={[styles.cardPreviewLabel, { color: textColor }]}>CARDHOLDER</ThemedText>
          <ThemedText style={[styles.cardPreviewName, { color: textColor }]} numberOfLines={1}>
            {displayName}
          </ThemedText>
        </View>
      </View>
    </View>
  );

  const renderCardPreview = (design: CardDesign) => {
    const isSelected = selectedCardDesignId === design.id;
    const textColor = design.textColor;

    return (
      <Pressable
        key={design.id}
        onPress={() => router.push(`/screens/rbc/design/${design.id}`)}
        style={styles.cardPreviewContainer}
      >
        {design.type === 'image' ? (
          <View style={[styles.cardPreview, isSelected && styles.cardPreviewSelected]}>
            <View style={styles.cardImageOnSide}>
              {typeof design.frontImage === 'number' && (
                <Image source={design.frontImage} style={StyleSheet.absoluteFillObject} contentFit="cover" />
              )}
            </View>
            <View style={styles.cardPreviewOverlay} />
            <View style={styles.cardPreviewContent}>
              <View style={styles.cardPreviewHeader}>
                <View style={styles.cardPreviewVerticalText}>
                  <ThemedText style={[styles.cardPreviewDebit, { color: textColor }]}>DEBIT</ThemedText>
                </View>
                <View style={[styles.cardPreviewLogo, styles.cardPreviewVerticalText]}>
                  <RBLogo width={30} height={18} fill={textColor} />
                </View>
              </View>
              <View style={styles.cardPreviewNumber}>
                <View style={styles.cardPreviewVerticalText}>
                  <ThemedText style={[styles.cardPreviewNumberText, { color: textColor }]}>**** ****</ThemedText>
                </View>
              </View>
              <View style={styles.cardPreviewFooter}>
                <View style={styles.cardPreviewVerticalText}>
                  <ThemedText style={[styles.cardPreviewLabel, { color: textColor }]}>CARDHOLDER</ThemedText>
                  <ThemedText style={[styles.cardPreviewName, { color: textColor }]} numberOfLines={1}>
                    {displayName}
                  </ThemedText>
                </View>
              </View>
            </View>
          </View>
        ) : (
          <LinearGradient
            colors={design.gradientColors ?? ['#667eea', '#764ba2']}
            start={design.gradientStart ?? { x: 0, y: 0 }}
            end={design.gradientEnd ?? { x: 1, y: 1 }}
            style={[styles.cardPreview, isSelected && styles.cardPreviewSelected]}
          >
            {renderPreviewContent(textColor)}
          </LinearGradient>
        )}
        <ThemedText
          className={`text-xs mt-2 text-center ${isSelected ? 'text-[#0EA5E9] font-semibold' : 'text-light-subtext dark:text-dark-subtext'}`}
          numberOfLines={1}
        >
          {design.name}
        </ThemedText>
      </Pressable>
    );
  };

  return (
    <>
      <Header showBackButton />
      <ThemedScroller className="flex-1 bg-light-primary dark:bg-dark-primary" scrollEventThrottle={16}>
        <View className="pb-8">
          {designSections.map(({ title, designs }) => (
            <View key={title} style={styles.section}>
              <View className="px-global mb-2">
                <ThemedText className="text-sm font-medium text-light-subtext dark:text-dark-subtext">
                  {title}
                </ThemedText>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.cardsScrollContent}
                style={styles.cardsScrollView}
              >
                {designs.map((d) => renderCardPreview(d))}
              </ScrollView>
            </View>
          ))}
        </View>
      </ThemedScroller>
    </>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: 16,
  },
  cardsScrollView: {
    marginVertical: 4,
  },
  cardsScrollContent: {
    paddingHorizontal: 16,
  },
  cardPreviewContainer: {
    width: CARD_WIDTH,
    marginRight: 16,
  },
  cardPreview: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  cardPreviewSelected: {
    borderColor: '#0EA5E9',
  },
  cardImageOnSide: {
    position: 'absolute',
    width: CARD_HEIGHT,
    height: CARD_WIDTH,
    left: (CARD_WIDTH - CARD_HEIGHT) / 2,
    top: (CARD_HEIGHT - CARD_WIDTH) / 2,
    transform: [{ rotate: '90deg' }],
    overflow: 'hidden',
  },
  cardPreviewOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  cardPreviewContent: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 8,
    zIndex: 10,
  },
  cardPreviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardPreviewVerticalText: {
    transform: [{ rotate: '90deg' }],
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
  },
  cardPreviewDebit: { fontSize: 8, opacity: 0.75 },
  cardPreviewLogo: { width: 30, height: 18, justifyContent: 'center', alignItems: 'center' },
  cardPreviewNumber: { marginVertical: 4 },
  cardPreviewNumberText: { fontSize: 11, fontWeight: '600', letterSpacing: 1 },
  cardPreviewFooter: { marginTop: 'auto' },
  cardPreviewLabel: { fontSize: 8, opacity: 0.75, marginBottom: 2 },
  cardPreviewName: { fontSize: 9, fontWeight: '500' },
});
