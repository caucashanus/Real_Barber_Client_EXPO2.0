import { Asset } from 'expo-asset';
import { Image } from 'expo-image';
import { VideoView, useVideoPlayer } from 'expo-video';
import React, { useEffect, useState } from 'react';
import {
  Dimensions,
  Platform,
  StyleSheet,
  View,
  type ImageSourcePropType,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import ThemedText from '@/components/ThemedText';
import {
  VISIT_PLAN_ONBOARDING_CTA_TOP_GAP,
  visitPlanOnboardingFooterReserveHeight,
} from '@/components/visit-plan/onboarding/visitPlanOnboardingLayout';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

type Props = {
  title: string;
  description?: string;
  imageSource?: ImageSourcePropType;
  videoSource?: number;
  mediaActive?: boolean;
  /** Hero — primární CTA dole (Pokračovat). */
  footer?: React.ReactNode;
  /** Benefit slidy — prázdný blok stejné výšky jako hero CTA dole. */
  reserveFooterSpace?: boolean;
  header?: React.ReactNode;
};

async function resolveBundledVideoUri(moduleId: number): Promise<string> {
  const asset = Asset.fromModule(moduleId);
  if (!asset.downloaded) {
    await asset.downloadAsync();
  }
  return asset.localUri ?? asset.uri;
}

function BackgroundVideoPlayer({ uri, active }: { uri: string; active: boolean }) {
  const player = useVideoPlayer(uri, (p) => {
    p.loop = true;
    p.muted = true;
  });

  useEffect(() => {
    const sub = player.addListener('statusChange', ({ status }) => {
      if (status === 'readyToPlay' && active) {
        player.play();
      }
    });
    if (active) {
      player.play();
    } else {
      player.pause();
    }
    return () => sub.remove();
  }, [active, player]);

  return (
    <VideoView
      player={player}
      style={styles.mediaFill}
      contentFit="cover"
      nativeControls={false}
      {...(Platform.OS === 'android' ? { surfaceType: 'textureView' as const } : {})}
    />
  );
}

function BackgroundVideo({
  moduleId,
  active,
}: {
  moduleId: number;
  active: boolean;
}) {
  const [uri, setUri] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    resolveBundledVideoUri(moduleId)
      .then((resolved) => {
        if (!cancelled) setUri(resolved);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [moduleId]);

  if (!uri) {
    return <View style={styles.mediaFill} className="bg-black" />;
  }

  return <BackgroundVideoPlayer uri={uri} active={active} />;
}

/** Fullscreen photo/video onboarding slide (parita PhotoOnboardingScreen). */
export default function VisitPlanPhotoOnboardingScreen({
  title,
  description,
  imageSource,
  videoSource,
  mediaActive = true,
  footer,
  reserveFooterSpace = false,
  header,
}: Props) {
  const insets = useSafeAreaInsets();
  const footerReserveH = visitPlanOnboardingFooterReserveHeight();
  const showFooterSpacer = reserveFooterSpace && !footer;

  return (
    <View style={styles.screen}>
      <View style={styles.mediaLayer} pointerEvents="none">
        {imageSource != null ? (
          <Image source={imageSource} style={styles.mediaFill} contentFit="cover" />
        ) : null}
        {videoSource != null ? (
          <BackgroundVideo moduleId={videoSource} active={mediaActive} />
        ) : null}
        <View style={styles.mediaDim} />
      </View>

      <View style={{ paddingTop: insets.top }} className="z-10 px-2">
        {header}
      </View>

      <View
        className="z-10 px-global"
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          paddingBottom: Math.max(insets.bottom, 16),
        }}>
        <ThemedText className="text-3xl font-bold text-white">{title}</ThemedText>
        {description ? (
          <ThemedText className="mt-3 text-base leading-6 text-white/90">{description}</ThemedText>
        ) : null}
        {footer ? (
          <View style={{ marginTop: VISIT_PLAN_ONBOARDING_CTA_TOP_GAP }}>{footer}</View>
        ) : null}
        {showFooterSpacer ? <View style={{ height: footerReserveH }} /> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    width: SCREEN_W,
    minHeight: SCREEN_H,
    backgroundColor: '#000',
  },
  mediaLayer: {
    ...StyleSheet.absoluteFill,
    width: SCREEN_W,
    height: SCREEN_H,
  },
  mediaFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: SCREEN_W,
    height: SCREEN_H,
  },
  mediaDim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
});
