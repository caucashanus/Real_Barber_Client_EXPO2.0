import { Image } from 'expo-image';
import React, { useCallback, useEffect, useRef } from 'react';
import { Animated, Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTranslation } from '@/hooks/useTranslation';
import Icon from '@/components/Icon';
import ThemedText from '@/components/ThemedText';

/** Nad action sheety, nested drawery i ostatní Modaly — vždy poslední vrstva. */
const COPY_FEEDBACK_LAYER_Z_INDEX = 2_147_483_647;

const COPY_FEEDBACK_MASCOT = require('@/assets/img/copy-feedback-toast.png');

interface CopyFeedbackProps {
  message: string;
  duration?: number;
  onHide?: () => void;
  isVisible: boolean;
}

/** Krátké potvrzení po zkopírování — toast nahoře na obrazovce. */
export default function CopyFeedback({
  message,
  duration = 1800,
  onHide,
  isVisible,
}: CopyFeedbackProps) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const translateY = useRef(new Animated.Value(-24)).current;
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);

  const dismiss = useCallback(() => {
    animationRef.current?.stop();
    Animated.timing(translateY, {
      toValue: -24,
      duration: 140,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) onHide?.();
    });
  }, [onHide, translateY]);

  useEffect(() => {
    if (!isVisible) return;

    translateY.setValue(-24);

    animationRef.current = Animated.sequence([
      Animated.timing(translateY, {
        toValue: 0,
        duration: 160,
        useNativeDriver: true,
      }),
      Animated.delay(duration),
      Animated.timing(translateY, {
        toValue: -24,
        duration: 160,
        useNativeDriver: true,
      }),
    ]);

    animationRef.current.start(({ finished }) => {
      if (finished) onHide?.();
    });

    return () => {
      animationRef.current?.stop();
    };
  }, [duration, isVisible, onHide, translateY]);

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="none"
      statusBarTranslucent
      presentationStyle="overFullScreen"
      pointerEvents="box-none"
      onRequestClose={dismiss}>
      <View pointerEvents="box-none" style={styles.modalRoot}>
        <Animated.View
          pointerEvents="box-none"
          style={[
            styles.container,
            {
              top: Math.max(insets.top, 12) + 8,
              transform: [{ translateY }],
            },
          ]}>
          <View style={styles.card} className="relative w-full rounded-2xl py-2.5 pl-2.5 pr-3 pt-3">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('sheetClose')}
              onPress={dismiss}
              hitSlop={8}
              className="absolute right-2 top-2 z-10 rounded-full p-1 active:opacity-70">
              <Icon name="X" size={16} color="#ffffff" strokeWidth={2.5} />
            </Pressable>

            <View className="flex-row items-center gap-3 pr-7">
              <Image
                source={COPY_FEEDBACK_MASCOT}
                style={styles.mascot}
                contentFit="contain"
                accessibilityIgnoresInvertColors
              />
              <ThemedText className="min-w-0 flex-1 text-sm font-medium text-white">
                {message}
              </ThemedText>
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    zIndex: COPY_FEEDBACK_LAYER_Z_INDEX,
    elevation: COPY_FEEDBACK_LAYER_Z_INDEX,
  },
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: COPY_FEEDBACK_LAYER_Z_INDEX,
    elevation: COPY_FEEDBACK_LAYER_Z_INDEX,
  },
  card: {
    backgroundColor: '#171717',
  },
  mascot: {
    width: 52,
    height: 52,
  },
});
