import React, { useEffect, useMemo, useState } from 'react';
import { View, ActivityIndicator, ImageBackground } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Header from '@/components/Header';
import ThemedScroller from '@/components/ThemeScroller';
import ThemedText from '@/components/ThemedText';
import Section from '@/components/layout/Section';
import { Button } from '@/components/Button';
import { useAuth } from '@/app/contexts/AuthContext';
import { useTranslation } from '@/app/hooks/useTranslation';
import { generateReferral, getReferrals, type ReferralActiveProgram, type ReferralGenerated } from '@/api/referrals';

const REFERRAL_BY_PROGRAM_STORAGE_KEY = '@referral_generated_by_program';

async function loadReferralMap(): Promise<Record<string, ReferralGenerated>> {
  try {
    const raw = await AsyncStorage.getItem(REFERRAL_BY_PROGRAM_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, ReferralGenerated>;
    if (!parsed || typeof parsed !== 'object') return {};
    return parsed;
  } catch {
    return {};
  }
}

async function saveReferral(programId: string, referral: ReferralGenerated): Promise<void> {
  const current = await loadReferralMap();
  const next = { ...current, [programId]: referral };
  try {
    await AsyncStorage.setItem(REFERRAL_BY_PROGRAM_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
}

export default function ReferralProgramDetailScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const programId = (Array.isArray(id) ? id[0] : id) ?? '';
  const { apiToken } = useAuth();
  const { t } = useTranslation();

  const [programs, setPrograms] = useState<ReferralActiveProgram[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);
  const [generated, setGenerated] = useState<ReferralGenerated | null>(null);

  useEffect(() => {
    if (!apiToken || !programId) return;
    setLoading(true);
    setError(null);
    getReferrals(apiToken)
      .then((r) => setPrograms(r.activePrograms || []))
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, [apiToken, programId]);

  useEffect(() => {
    if (!programId) return;
    loadReferralMap().then((m) => {
      setGenerated(m[programId] ?? null);
    });
  }, [programId]);

  const program = useMemo(
    () => programs.find((p) => p.id === programId) ?? null,
    [programId, programs]
  );

  const coverUri = program?.coverImageUrl?.trim() || null;

  const onJoinProgram = async () => {
    if (!apiToken || !program) return;
    setJoining(true);
    setError(null);
    try {
      const referral = await generateReferral(apiToken, {
        programId: program.id,
        coverImageUrl: program.coverImageUrl ?? null,
      });
      setGenerated(referral);
      await saveReferral(program.id, referral);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to generate');
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
                style={{ minHeight: 200 }}
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

            <Section title={t('referralProgramDetails')} titleSize="lg" className="px-global mt-8">
              <View className="rounded-2xl bg-light-secondary dark:bg-dark-secondary p-5">
                <View className="flex-row items-baseline justify-between">
                  <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">
                    {t('referralProgramReferrerReward')}
                  </ThemedText>
                  <ThemedText className="text-base font-semibold">
                    {program.referrerRewardAmount} RBC
                  </ThemedText>
                </View>

                <View className="flex-row items-baseline justify-between mt-4">
                  <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">
                    {t('referralProgramRefereeReward')}
                  </ThemedText>
                  <ThemedText className="text-base font-semibold">
                    {program.refereeRewardAmount ?? 0} RBC
                  </ThemedText>
                </View>

                <View className="flex-row items-baseline justify-between mt-4">
                  <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">
                    {t('referralProgramMinPurchase')}
                  </ThemedText>
                  <ThemedText className="text-base font-semibold">
                    {program.minPurchaseAmount} Kč
                  </ThemedText>
                </View>
              </View>
            </Section>

            <View className="px-global mt-6 pb-10">
              {generated?.code ? (
                <View className="mb-4 rounded-2xl bg-light-secondary dark:bg-dark-secondary p-5">
                  <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">
                    {t('referralProgramYourCode')}
                  </ThemedText>
                  <ThemedText className="text-xl font-bold mt-1">{generated.code}</ThemedText>
                </View>
              ) : null}
              <Button
                title={generated?.code ? t('referralProgramRegenerate') : t('referralProgramJoin')}
                loading={joining}
                onPress={onJoinProgram}
              />
            </View>
          </>
        )}
      </ThemedScroller>
    </View>
  );
}

