import { router } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { RefreshControl, View } from 'react-native';
import { ActionSheetRef } from 'react-native-actions-sheet';

import { CrmHttpError } from '@/api/http';
import { useAccentColor } from '@/contexts/AccentColorContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  ensureReferralShareUrl,
  mapReferralShareError,
  useReferralDashboard,
} from '@/hooks/useReferralDashboard';
import { useTranslation } from '@/hooks/useTranslation';
import Header from '@/components/Header';
import ReferralHomeStep from '@/components/referral/ReferralHomeStep';
import ReferralInvitesStep from '@/components/referral/ReferralInvitesStep';
import ReferralRulesStep from '@/components/referral/ReferralRulesStep';
import { ReferralQrSheet } from '@/components/referral/ReferralQrSheet';
import { ReferralRbcInfoSheet } from '@/components/referral/ReferralRbcInfoSheet';
import { ReferralShareSheet } from '@/components/referral/ReferralShareSheet';
import SiteLoadingSpinner from '@/components/SiteLoadingSpinner';
import SurfaceCard from '@/components/layout/SurfaceCard';
import ThemeScroller from '@/components/ThemeScroller';
import ThemedText from '@/components/ThemedText';
import Icon from '@/components/Icon';
import {
  DEFAULT_ATTRIBUTION_TTL_DAYS,
  DEFAULT_REFERRER_REWARD_RBC,
  type ReferralDashboardStep,
} from '@/utils/referralDashboardHelpers';

export default function ReferralDashboardScreen() {
  const { apiToken, signOutToLogin } = useAuth();
  const { t } = useTranslation();
  const { accentColor } = useAccentColor();
  const { data, loading, refreshing, error, refresh } = useReferralDashboard();

  const [step, setStep] = useState<ReferralDashboardStep>('home');
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [shareLoading, setShareLoading] = useState(false);
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);

  const shareSheetRef = useRef<ActionSheetRef>(null);
  const qrSheetRef = useRef<ActionSheetRef>(null);
  const rbcSheetRef = useRef<ActionSheetRef>(null);

  const rewardRbc = data?.config.referrerRewardRbc ?? DEFAULT_REFERRER_REWARD_RBC;
  const ttlDays = data?.config.attributionTtlDays ?? DEFAULT_ATTRIBUTION_TTL_DAYS;

  useEffect(() => {
    const existing = data?.shareLink?.url?.trim();
    if (existing) setShareUrl(existing);
  }, [data?.shareLink?.url]);

  const handleBack = useCallback(() => {
    if (step === 'rules' || step === 'invites') {
      setStep('home');
      return;
    }
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/wallet');
  }, [step]);

  const resolveShareUrl = useCallback(async (): Promise<string | null> => {
    if (!apiToken) return null;
    if (shareUrl) return shareUrl;
    setShareLoading(true);
    setShareFeedback(null);
    try {
      const url = await ensureReferralShareUrl(apiToken, data);
      setShareUrl(url);
      return url;
    } catch (e) {
      if (e instanceof CrmHttpError && e.status === 401) {
        await signOutToLogin();
        return null;
      }
      setShareFeedback(mapReferralShareError(e, t));
      return null;
    } finally {
      setShareLoading(false);
    }
  }, [apiToken, data, shareUrl, signOutToLogin, t]);

  const handleShare = useCallback(async () => {
    const url = await resolveShareUrl();
    if (url) shareSheetRef.current?.show();
  }, [resolveShareUrl]);

  const handleQr = useCallback(async () => {
    const url = await resolveShareUrl();
    if (url) qrSheetRef.current?.show();
  }, [resolveShareUrl]);

  const renderStep = () => {
    if (!data?.enabled) return null;

    switch (step) {
      case 'home':
        return (
          <ReferralHomeStep
            onInvite={() => setStep('rules')}
            onMyInvites={() => setStep('invites')}
          />
        );
      case 'rules':
        return (
          <ReferralRulesStep
            rewardRbc={rewardRbc}
            ttlDays={ttlDays}
            shareLoading={shareLoading}
            shareFeedback={shareFeedback}
            onShare={handleShare}
            onQr={handleQr}
            onMyInvites={() => setStep('invites')}
            onRbcInfo={() => rbcSheetRef.current?.show()}
          />
        );
      case 'invites':
        return (
          <ReferralInvitesStep
            invites={data.invites}
            ttlDays={ttlDays}
            onInvite={() => setStep('home')}
          />
        );
      default:
        return null;
    }
  };

  return (
    <>
      <Header showBackButton onBackPress={handleBack} />
      <ThemeScroller
        className="px-global pb-8"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={accentColor} />
        }>
        {loading && !data ? (
          <View className="items-center py-16">
            <SiteLoadingSpinner />
          </View>
        ) : error && !data ? (
          <SurfaceCard rounded="2xl" className="mt-4 p-5">
            <ThemedText className="text-center text-light-subtext dark:text-dark-subtext">
              {error}
            </ThemedText>
          </SurfaceCard>
        ) : data && data.enabled !== true ? (
          <SurfaceCard rounded="2xl" className="mt-4 items-center p-8">
            <Icon name="Gift" size={32} className="text-light-subtext dark:text-dark-subtext" />
            <ThemedText className="mt-4 text-center text-lg font-semibold">
              {t('referralComingSoon')}
            </ThemedText>
            <ThemedText className="mt-2 text-center text-sm text-light-subtext dark:text-dark-subtext">
              {t('referralProgramInactive')}
            </ThemedText>
          </SurfaceCard>
        ) : data ? (
          renderStep()
        ) : null}
      </ThemeScroller>

      {shareUrl ? <ReferralShareSheet ref={shareSheetRef} shareUrl={shareUrl} /> : null}
      {shareUrl ? <ReferralQrSheet ref={qrSheetRef} shareUrl={shareUrl} /> : null}
      <ReferralRbcInfoSheet ref={rbcSheetRef} rewardRbc={rewardRbc} />
    </>
  );
}
