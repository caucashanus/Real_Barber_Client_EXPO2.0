import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  PanResponder,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';

import { getSheetHandleIndicatorColor } from '@/components/layout/SurfaceCard';
import { HOME_FAST_BOOK_WHEN_STACK_SCRIM } from '@/components/home/fast-book/homeFastBookSheetUi';
import useThemeColors from '@/contexts/ThemeColors';

const SCRIM_FADE_MS = 220;
const HANDLE_DISMISS_DY = 48;
const HANDLE_DISMISS_VY = 0.85;
const DOCK_DISMISS_MS = 220;

const Z_STACK_SCRIM = 10;
const Z_DOCK = 20;

function SheetHandle() {
  const colors = useThemeColors();
  return (
    <View style={styles.handleWrap}>
      <View
        style={[
          styles.handleBar,
          { backgroundColor: getSheetHandleIndicatorColor(colors.isDark) },
        ]}
      />
    </View>
  );
}

/** Vnitřní scrim nad rodičovským obsahem (tap zavře vnořený panel). */
export function ActionSheetStackScrim({ onDismiss }: { onDismiss: () => void }) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: SCRIM_FADE_MS,
      useNativeDriver: true,
    }).start();
  }, [progress]);

  const scrimOpacity = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, HOME_FAST_BOOK_WHEN_STACK_SCRIM],
  });

  return (
    <Pressable
      style={[StyleSheet.absoluteFill, styles.stackScrimHit]}
      onPress={onDismiss}
      accessibilityRole="button"
      accessibilityLabel="Zavřít">
      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, styles.stackScrimFill, { opacity: scrimOpacity }]}
      />
    </Pressable>
  );
}

type NestedDockProps = {
  panelBackgroundColor: string;
  onDismiss: () => void;
  children: React.ReactNode;
};

/** Vnořený panel dole ve stacku — stejná animace jako homepage fast-book when. */
export function ActionSheetNestedDock({
  panelBackgroundColor,
  onDismiss,
  children,
}: NestedDockProps) {
  const colors = useThemeColors();
  const dragY = useRef(new Animated.Value(0)).current;
  const panelHeightRef = useRef(320);
  const openSpringRanRef = useRef(false);

  useEffect(() => {
    dragY.setValue(0);
    openSpringRanRef.current = false;
  }, [dragY]);

  const snapBack = useCallback(() => {
    Animated.spring(dragY, {
      toValue: 0,
      useNativeDriver: true,
      damping: 22,
      stiffness: 280,
      mass: 0.8,
    }).start();
  }, [dragY]);

  const dismissWithSlide = useCallback(() => {
    Animated.timing(dragY, {
      toValue: panelHeightRef.current,
      duration: DOCK_DISMISS_MS,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) onDismiss();
    });
  }, [dragY, onDismiss]);

  const handlePan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, g) =>
          g.dy > 2 && Math.abs(g.dy) > Math.abs(g.dx),
        onPanResponderMove: (_, g) => {
          dragY.setValue(Math.max(0, g.dy));
        },
        onPanResponderRelease: (_, g) => {
          if (g.dy > HANDLE_DISMISS_DY || g.vy > HANDLE_DISMISS_VY) {
            dismissWithSlide();
            return;
          }
          snapBack();
        },
        onPanResponderTerminate: () => {
          snapBack();
        },
      }),
    [dismissWithSlide, dragY, snapBack]
  );

  const runOpenSpring = useCallback(() => {
    if (openSpringRanRef.current) return;
    const h = panelHeightRef.current;
    if (h <= 0) return;
    openSpringRanRef.current = true;
    dragY.setValue(h);
    Animated.spring(dragY, {
      toValue: 0,
      useNativeDriver: true,
      damping: 24,
      stiffness: 280,
      mass: 0.85,
    }).start();
  }, [dragY]);

  return (
    <Animated.View
      onLayout={(event) => {
        panelHeightRef.current = Math.ceil(event.nativeEvent.layout.height);
        if (openSpringRanRef.current || panelHeightRef.current <= 0) return;
        requestAnimationFrame(() => {
          requestAnimationFrame(runOpenSpring);
        });
      }}
      style={[
        styles.dock,
        styles.dockOverlay,
        {
          backgroundColor: panelBackgroundColor,
          borderTopColor: colors.border,
          transform: [{ translateY: dragY }],
        },
      ]}>
      <View {...handlePan.panHandlers} style={styles.handleHit}>
        <SheetHandle />
      </View>
      {children}
    </Animated.View>
  );
}

export const actionSheetNestedStackStyles = StyleSheet.create({
  stack: { position: 'relative' },
  baseLayer: { zIndex: 0 },
  stackScrimHit: { zIndex: Z_STACK_SCRIM },
  stackScrimFill: { backgroundColor: '#000000' },
  handleWrap: { alignItems: 'center', paddingTop: 8, paddingBottom: 4 },
  handleBar: { width: 45, height: 6, borderRadius: 100 },
  dock: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  dockOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: Z_DOCK,
  },
  handleHit: { minHeight: 28, justifyContent: 'center' },
});

const styles = actionSheetNestedStackStyles;
