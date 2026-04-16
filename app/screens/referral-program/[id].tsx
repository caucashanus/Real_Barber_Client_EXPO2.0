import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, ActivityIndicator, Animated, Share } from 'react-native';

import {
  generateReferral,
  getReferrals,
  type ClientReferralItem,
  type ReferralActiveProgram,
} from '@/api/referrals';
import { useAuth } from '@/app/contexts/AuthContext';
import { useTranslation } from '@/app/hooks/useTranslation';
import AnimatedView from '@/components/AnimatedView';
import { Button } from '@/components/Button';
import Header from '@/components/Header';
import Icon from '@/components/Icon';
import ImageCarousel from '@/components/ImageCarousel';
import ThemedFooter from '@/components/ThemeFooter';
import ThemedScroller from '@/components/ThemeScroller';
import ThemedText from '@/components/ThemedText';
import Divider from '@/components/layout/Divider';
import Section from '@/components/layout/Section';

const REFERRAL_SHARE_BASE = 'https://crm.xrb.cz/ref/';
const FALLBACK_COVER = require('@/assets/img/branches/Modrany.jpg');

function formatDate(iso: string, locale: string): string {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return iso;
  try {
    return new Intl.DateTimeFormat(locale === 'cs' ? 'cs-CZ' : 'en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(d);
  } catch {
    return d.toISOString().slice(0, 10);
  }
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-center justify-between py-3">
      <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">{label}</ThemedText>
      <ThemedText className="text-sm font-semibold">{value}</ThemedText>
    </View>
  );
}

export default function ReferralProgramDetailScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const programId = (Array.isArray(id) ? id[0] : id) ?? '';
  const router = useRouter();
  const { apiToken } = useAuth();
  const { t, locale } = useTranslation();
  const heroScrollY = useRef(new Animated.Value(0)).current;

  const [programs, setPrograms] = useState<ReferralActiveProgram[]>([]);
  const [referralsMade, setReferralsMade] = useState<ClientReferralItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    if (!apiToken || !programId) return;
    setLoading(true);
    setError(null);
    getReferrals(apiToken, { includeProgress: true })
      .then((r) => {
        setPrograms(r.activePrograms || []);
        setReferralsMade(r.referralsMade || []);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, [apiToken, programId]);

  const program = useMemo(
    () => programs.find((p) => p.id === programId) ?? null,
    [programId, programs]
  );

  const programReferrals = useMemo(
    () => referralsMade.filter((r) => r.programId === programId),
    [programId, referralsMade]
  );

  const onJoinProgram = async () => {
    if (!apiToken || !programId || !program) return;
    setJoining(true);
    setError(null);
    try {
      const res = await generateReferral(apiToken, {
        programId: program.id,
        coverImageUrl: program.coverImageUrl ?? null,
      });
      const shareUrl = `${REFERRAL_SHARE_BASE}${encodeURIComponent(res.referral.code)}`;
      await Share.share({ message: shareUrl });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to share');
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <>
        <Header title={t('referralProgramTitle')} showBackButton />
        <View className="flex-1 items-center justify-center bg-light-primary dark:bg-dark-primary">
          <ActivityIndicator size="large" />
          <ThemedText className="mt-2 text-light-subtext dark:text-dark-subtext">
            {t('commonLoading')}
          </ThemedText>
        </View>
      </>
    );
  }

  if (error || !program) {
    return (
      <>
        <Header title={t('referralProgramTitle')} showBackButton />
        <View className="flex-1 items-center justify-center bg-light-primary p-6 dark:bg-dark-primary">
          <ThemedText className="text-center text-red-500 dark:text-red-400">
            {error ?? t('referralProgramNotFound')}
          </ThemedText>
        </View>
      </>
    );
  }

  const coverUri = program.coverImageUrl?.trim() || null;
  const carouselImages: (string | number)[] = coverUri ? [coverUri] : [FALLBACK_COVER];
  const validUntilText = program.validUntil?.trim() ? formatDate(program.validUntil, locale) : null;
  const validFromText = program.validFrom?.trim() ? formatDate(program.validFrom, locale) : null;

  return (
    <>
      <Header title="" showBackButton />
      <ThemedScroller
        className="flex-1 px-0"
        keyboardShouldPersistTaps="handled"
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: heroScrollY } } }], {
          useNativeDriver: false,
        })}
        scrollEventThrottle={16}>
        <AnimatedView animation="fadeIn" duration={400} delay={100}>

          {/* Hero image */}
          <View className="px-global">
            <ImageCarousel
              height={300}
              rounded="2xl"
              images={carouselImages}
              scrollY={heroScrollY}
              stretchOnPullDown
            />
          </View>

          {/* Title + description */}
          <View className="px-global pb-4 pt-6">
            <ThemedText className="mb-2 text-2xl font-bold">{program.name}</ThemedText>
            {program.description?.trim() ? (
              <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">
                {program.description}
              </ThemedText>
            ) : null}
          </View>

          <Divider className="h-2 bg-light-secondary dark:bg-dark-darker" />

          {/* Rewards section */}
          <Section title={t('referralProgramDetails')} titleSize="lg" className="px-global pt-4">
            <View className="mt-4 overflow-hidden rounded-2xl bg-light-secondary dark:bg-dark-secondary">
              <View className="px-5">
                <InfoRow
                  label={t('referralProgramReferrerReward')}
                  value={`${program.referrerRewardAmount} RBC`}
                />
                <Divider />
                <InfoRow
                  label={t('referralProgramRefereeReward')}
                  value={`${program.refereeRewardAmount ?? 0} RBC`}
                />
                <Divider />
                <InfoRow
                  label={t('referralProgramMinPurchase')}
                  value={`${program.minPurchaseAmount} Kč`}
                />
                {validUntilText ? (
                  <>
                    <Divider />
                    <InfoRow label={t('referralProgramValidUntil')} value={validUntilText} />
                  </>
                ) : null}
              </View>
            </View>
          </Section>

          {/* My invites section */}
          {programReferrals.length > 0 ? (
            <>
              <Divider className="mt-6 h-2 bg-light-secondary dark:bg-dark-darker" />
              <Section
                title={t('referralProgramTrackInvites')}
                titleSize="lg"
                className="px-global pt-4">
                <View className="mt-4 overflow-hidden rounded-2xl bg-light-secondary dark:bg-dark-secondary">
                  {programReferrals.map((ref, i) => (
                    <React.Fragment key={ref.id}>
                      {i > 0 && <Divider />}
                      <View className="flex-row items-center justify-between px-5 py-3.5">
                        <View className="min-w-0 flex-1">
                          <ThemedText className="text-sm font-semibold" numberOfLines={1}>
                            {ref.referee?.name ?? ref.referralCode ?? '—'}
                          </ThemedText>
                          <ThemedText className="mt-0.5 text-xs text-light-subtext dark:text-dark-subtext">
                            {String(ref.status ?? '').toUpperCase()}
                          </ThemedText>
                        </View>
                        <Icon
                          name="ChevronRight"
                          size={16}
                          className="text-light-subtext dark:text-dark-subtext"
                        />
                      </View>
                    </React.Fragment>
                  ))}
                </View>
                <Button
                  title={t('referralProgramTrackInvites')}
                  variant="secondary"
                  className="mt-3"
                  onPress={() =>
                    router.push(
                      `/screens/referral-program/${encodeURIComponent(programId)}/invites`
                    )
                  }
                />
              </Section>
            </>
          ) : null}

          <View className="h-32" />
        </AnimatedView>
      </ThemedScroller>

      {/* Footer CTA */}
      <ThemedFooter>
        <View className="flex-row overflow-hidden rounded-2xl bg-light-secondary dark:bg-dark-secondary">
          <Button
            variant="ghost"
            size="small"
            title={t('referralProgramJoin')}
            loading={joining}
            onPress={onJoinProgram}
            className="flex-1 rounded-none rounded-bl-2xl px-0 py-3.5"
            textClassName="text-sm font-semibold text-neutral-800 dark:text-neutral-200"
          />
          <View className="w-px self-stretch bg-neutral-200 dark:bg-neutral-700" />
          <View className="flex-1">
            <Button
              variant="ghost"
              size="small"
              title="Moje pozvání"
              iconStart="Users"
              iconSize={16}
              onPress={() =>
                router.push(
                  `/screens/referral-program/${encodeURIComponent(programId)}/invites`
                )
              }
              className="rounded-none rounded-br-2xl px-0 py-3.5"
              textClassName="text-sm font-semibold text-neutral-800 dark:text-neutral-200"
            />
            {programReferrals.length > 0 && (
              <View className="absolute right-4 top-1 h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1">
                <ThemedText className="text-xs font-bold text-white">
                  {programReferrals.length}
                </ThemedText>
              </View>
            )}
          </View>
        </View>
      </ThemedFooter>
    </>
  );
}
