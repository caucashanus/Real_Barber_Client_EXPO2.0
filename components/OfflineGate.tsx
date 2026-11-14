import React, { useCallback } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { FullWindowOverlay } from 'react-native-screens';

import { useToast } from '@/components/animated-toast';
import OfflineRetryToastContent from '@/components/animated-toast/OfflineRetryToastContent';
import OfflineScreen from '@/components/OfflineScreen';
import { useTranslation } from '@/hooks/useTranslation';
import { useNetworkConnectivity } from '@/hooks/useNetworkConnectivity';

const OFFLINE_RETRY_TOAST_MS = 1800;
const OFFLINE_OVERLAY_Z_INDEX = 10000;

interface OfflineGateProps {
  children: React.ReactNode;
}

function OfflineGateOverlay({ children }: { children: React.ReactNode }) {
  if (Platform.OS === 'ios') {
    return (
      <FullWindowOverlay unstable_accessibilityContainerViewIsModal>
        <View className="flex-1 bg-light-primary dark:bg-dark-primary">{children}</View>
      </FullWindowOverlay>
    );
  }

  return (
    <View
      pointerEvents="auto"
      style={[StyleSheet.absoluteFillObject, { zIndex: OFFLINE_OVERLAY_Z_INDEX, elevation: OFFLINE_OVERLAY_Z_INDEX }]}
      className="bg-light-primary dark:bg-dark-primary">
      {children}
    </View>
  );
}

/** Offline přes celou appku — navigace zůstává namontovaná (bez GO_BACK po reconnectu). */
export default function OfflineGate({ children }: OfflineGateProps) {
  const { t } = useTranslation();
  const { show, dismissAll } = useToast();
  const { offline, checking, recheck } = useNetworkConnectivity();

  const handleRetry = useCallback(async () => {
    const stillOffline = await recheck();
    if (!stillOffline) return;

    dismissAll();
    show(<OfflineRetryToastContent message={t('offlineRetryStillOffline')} />, {
      position: 'top',
      duration: OFFLINE_RETRY_TOAST_MS,
      type: 'default',
    });
  }, [dismissAll, recheck, show, t]);

  return (
    <View className="flex-1">
      <View className="flex-1" pointerEvents={offline ? 'none' : 'auto'}>
        {children}
      </View>
      {offline ? (
        <OfflineGateOverlay>
          <OfflineScreen onRetry={handleRetry} retrying={checking} />
        </OfflineGateOverlay>
      ) : null}
    </View>
  );
}