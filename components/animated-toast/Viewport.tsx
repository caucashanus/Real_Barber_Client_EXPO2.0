import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { FullWindowOverlay } from 'react-native-screens';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Toast } from '@/components/animated-toast/Toast';
import { useToast } from '@/components/animated-toast/ToastContext';

const OVERLAY_Z_INDEX = 9999;

function ToastViewportLayers() {
  const { toasts } = useToast();
  const insets = useSafeAreaInsets();

  const topToasts = toasts.filter((toast) => toast.options.position === 'top');
  const bottomToasts = toasts.filter((toast) => toast.options.position === 'bottom');

  const topAnchor = Math.max(insets.top, 12) + 8;

  return (
    <View pointerEvents="box-none" style={styles.overlay}>
      {topToasts.length > 0 ? (
        <View pointerEvents="box-none" style={[styles.viewport, styles.topViewport]}>
          {topToasts.map((toast, arrayIndex) => {
            const displayIndex = topToasts.length - 1 - arrayIndex;
            return (
              <Toast key={toast.id} toast={toast} index={displayIndex} anchorTop={topAnchor} />
            );
          })}
        </View>
      ) : null}
      {bottomToasts.length > 0 ? (
        <View
          pointerEvents="box-none"
          style={[styles.viewport, styles.bottomViewport, { paddingBottom: insets.bottom }]}>
          {bottomToasts.map((toast, arrayIndex) => {
            const displayIndex = bottomToasts.length - 1 - arrayIndex;
            return <Toast key={toast.id} toast={toast} index={displayIndex} />;
          })}
        </View>
      ) : null}
    </View>
  );
}

/** Nad native stackem (iOS: FullWindowOverlay), jinak absolute overlay; dotyky mimo toast projdou. */
export function ToastViewport() {
  const { toasts } = useToast();
  if (toasts.length === 0) return null;

  const layers = <ToastViewportLayers />;

  if (Platform.OS === 'ios') {
    return (
      <FullWindowOverlay unstable_accessibilityContainerViewIsModal={false}>
        {layers}
      </FullWindowOverlay>
    );
  }

  return layers;
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: OVERLAY_Z_INDEX,
    elevation: OVERLAY_Z_INDEX,
  },
  viewport: {
    position: 'absolute',
    left: 0,
    right: 0,
    paddingHorizontal: 16,
  },
  topViewport: {
    top: 0,
  },
  bottomViewport: {
    bottom: 0,
  },
});
