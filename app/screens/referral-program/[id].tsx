import React, { useEffect, useMemo, useState } from 'react';
import { View, ActivityIndicator, ImageBackground, Share } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Header from '@/components/Header';
import ThemedScroller from '@/components/ThemeScroller';
import ThemedText from '@/components/ThemedText';
import Section from '@/components/layout/Section';
import Divider from '@/components/layout/Divider';
import { Button } from '@/components/Button';
import { useAuth } from '@/app/contexts/AuthContext';
import { useTranslation } from '@/app/hooks/useTranslation';
import { generateReferral, getReferrals, type ClientReferralItem, type ReferralActiveProgram } from '@/api/referrals';

const REFERRAL_SHARE_BASE = 'https://crm.xrb.cz/ref/';

function formatValidUntil(iso: string, locale: string): string {
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

export default function ReferralProgramDetailScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const programId = (Array.isArray(id) ? id[0] : id) ?? '';
  const router = useRouter();
  const { apiToken } = useAuth();
  const { t, locale } = useTranslation();

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

  const coverUri = program?.coverImageUrl?.trim() || null;
  const programReferrals = useMemo(
    () => referralsMade.filter((r) => r.programId === programId),
    [programId, referralsMade]
  );
  const validUntilText = program?.validUntil?.trim()
    ? formatValidUntil(program.validUntil, locale)
    : null;

  const onJoinProgram = async () => {
    if (!apiToken || !programId || !program) return;
    setJoining(true);
    setError(null);
    try {
      const res = await generateReferral(apiToken, {
        programId: program.id,
        coverImageUrl: program.coverImageUrl ?? null,
      });
      const referral = res.referral;
      const shareUrl = `${REFERRAL_SHARE_BASE}${encodeURIComponent(referral.code)}`;
      await Share.share({ message: shareUrl });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to share');
    } finally {
      setJoining(false);
    }
  };

  return (
    <View className="flex-1 bg-light-primary dark:bg-dark-primary">
      <Header title={program?.name ?? t('referralProgramTitle')} showBackButton />

      <ThemedScroller className="flex-1">
        {loading ? (
          <View className="py-10 items-center">
            <ActivityIndicator size="small" />
            <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext mt-2">
              {t('commonLoading')}
            </ThemedText>
          </View>
        ) : error ? (
          <View className="py-10 px-global">
            <ThemedText className="text-sm text-red-500 dark:text-red-400 text-center">
              {error}
            </ThemedText>
          </View>
        ) : !program ? (
          <View className="py-10 px-global">
            <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext text-center">
              {t('referralProgramNotFound')}
            </ThemedText>
          </View>
        ) : (
          <>
            {coverUri ? (
              <ImageBackground
                source={{ uri: coverUri }}
                className="mx-global mt-4 rounded-3xl overflow-hidden"
                style={{ minHeight: 500 }}
                imageStyle={{ borderRadius: 24 }}
              >
                <View className="flex-1 p-6 justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.40)' }}>
                  <ThemedText className="text-2xl font-bold text-white">{program.name}</ThemedText>
                  <ThemedText className="text-base text-white/90 mt-2">
                    {program.description?.trim() ? program.description : '—'}
                  </ThemedText>
                </View>
              </ImageBackground>
            ) : (
              <View className="mx-global mt-4 p-6 rounded-3xl bg-light-secondary dark:bg-dark-secondary">
                <ThemedText className="text-2xl font-bold">{program.name}</ThemedText>
                <ThemedText className="text-base text-light-subtext dark:text-dark-subtext mt-2">
                  {program.description?.trim() ? program.description : '—'}
                </ThemedText>
              </View>
            )}

            <Section title={t('referralProgramDetails')} titleSize="lg" className="px-global mt-8 mb-6">
              <View className="rounded-3xl bg-light-secondary dark:bg-dark-secondary overflow-hidden">
                {validUntilText ? (
                  <>
                    <View className="flex-row items-center justify-between px-5 py-4">
                      <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">
                        {t('referralProgramValidUntil')}
                      </ThemedText>
                      <ThemedText className="text-base font-semibold text-light-text dark:text-dark-text">
                        {validUntilText}
                      </ThemedText>
                    </View>
                    <Divider />
                  </>
                ) : null}

                <View className="flex-row items-center justify-between px-5 py-4">
                  <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">
                    {t('referralProgramReferrerReward')}
                  </ThemedText>
                  <ThemedText className="text-base font-semibold text-light-text dark:text-dark-text">
                    {program.referrerRewardAmount} RBC
                  </ThemedText>
                </View>
                <Divider />

                <View className="flex-row items-center justify-between px-5 py-4">
                  <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">
                    {t('referralProgramRefereeReward')}
                  </ThemedText>
                  <ThemedText className="text-base font-semibold text-light-text dark:text-dark-text">
                    {program.refereeRewardAmount ?? 0} RBC
                  </ThemedText>
                </View>
                <Divider />

                <View className="flex-row items-center justify-between px-5 py-4">
                  <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">
                    {t('referralProgramMinPurchase')}
                  </ThemedText>
                  <ThemedText className="text-base font-semibold text-light-text dark:text-dark-text">
                    {program.minPurchaseAmount} Kč
                  </ThemedText>
                </View>
              </View>
            </Section>

            <View className="px-global mt-6 pb-10">
              <Button
                title={t('referralProgramJoin')}
                loading={joining}
                onPress={onJoinProgram}
              />
              {programReferrals.length > 0 ? (
                <Button
                  title={t('referralProgramTrackInvites')}
                  variant="secondary"
                  className="mt-3"
                  onPress={() =>
                    router.push(`/screens/referral-program/${encodeURIComponent(programId)}/invites`)
                  }
                />
              ) : null}
            </View>
          </>
        )}
      </ThemedScroller>
    </View>
  );
}

