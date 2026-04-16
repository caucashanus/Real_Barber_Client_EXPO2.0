import * as Clipboard from 'expo-clipboard';
import React, { useMemo, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';

import { useAccentColor } from '@/app/contexts/AccentColorContext';
import { Button } from '@/components/Button';
import Header from '@/components/Header';
import ThemedScroller from '@/components/ThemeScroller';
import ThemedText from '@/components/ThemedText';
import {
  type RBLiveActivityHandle,
  type RBLiveActivityState,
  rbLiveActivityEndAll,
  rbLiveActivityGetCount,
  rbLiveActivityStart,
  rbLiveActivityWaitForPushToken,
} from '@/lib/rb-live-activity';

function formatDevSlotRange(startIso: string, endIso: string): string {
  const start = new Date(startIso);
  const end = new Date(endIso);
  const fmt = (date: Date) =>
    date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  return `${fmt(start)}–${fmt(end)}`;
}

export default function DevLiveActivityScreen() {
  const { accentColor } = useAccentColor();
  const [minutes, setMinutes] = useState(15);
  const [error, setError] = useState<string | null>(null);
  const [instancesCount, setInstancesCount] = useState<number>(0);
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [tokenCopied, setTokenCopied] = useState(false);
  const instanceRef = useRef<RBLiveActivityHandle | null>(null);

  const initialState = useMemo<RBLiveActivityState>(() => {
    const startAt = new Date(Date.now() + 60_000).toISOString();
    const endAt = new Date(Date.now() + (60_000 + minutes * 60_000)).toISOString();
    return {
      phase: 'scheduled',
      presentation: 'normal',
      labelText: 'Začátek za',
      startAt,
      endAt,
      branchName: 'Hagibor',
      timeRangeText: formatDevSlotRange(startAt, endAt),
      employeeName: 'Bára',
      employeeAvatarUrl: 'https://randomuser.me/api/portraits/women/44.jpg',
      priceFormatted: '450 Kč',
      accentHex: accentColor,
    };
  }, [minutes, accentColor]);

  const refreshInstances = () => {
    rbLiveActivityGetCount()
      .then(setInstancesCount)
      .catch(() => setInstancesCount(0));
  };

  const applyOrStart = async (state: RBLiveActivityState) => {
    setError(null);
    if (instanceRef.current) {
      await instanceRef.current.update(state);
    } else {
      instanceRef.current = await rbLiveActivityStart('dev-booking', state, 'realbarber://');
    }
    refreshInstances();
  };

  const makeUpcomingState = (): RBLiveActivityState => {
    const startAt = new Date(Date.now() + 30 * 60_000).toISOString();
    const endAt = new Date(Date.now() + (30 * 60_000 + 45 * 60_000)).toISOString();
    return {
      phase: 'scheduled',
      presentation: 'normal',
      labelText: 'Začátek za',
      startAt,
      endAt,
      branchName: 'Hagibor',
      timeRangeText: formatDevSlotRange(startAt, endAt),
      employeeName: 'Bára',
      employeeAvatarUrl: 'https://randomuser.me/api/portraits/women/44.jpg',
      priceFormatted: '450 Kč',
      accentHex: accentColor,
    };
  };

  const makeActiveState = (): RBLiveActivityState => {
    const startAt = new Date(Date.now() - 10 * 60_000).toISOString();
    const endAt = new Date(Date.now() + 20 * 60_000).toISOString();
    return {
      phase: 'active',
      presentation: 'normal',
      labelText: 'Končí za',
      startAt,
      endAt,
      branchName: 'Test pobočka',
      timeRangeText: formatDevSlotRange(startAt, endAt),
      employeeName: 'Martin',
      employeeAvatarUrl: 'https://randomuser.me/api/portraits/men/32.jpg',
      priceFormatted: '450 Kč',
      accentHex: accentColor,
    };
  };

  const makeReviewState = (): RBLiveActivityState => {
    const startAt = new Date(Date.now() - 30 * 60_000).toISOString();
    const endAt = new Date(Date.now() - 15 * 60_000).toISOString();
    return {
      phase: 'finished',
      presentation: 'review',
      labelText: 'Ohodnoťte rezervaci',
      headlineText: 'Děkujeme!',
      startAt,
      endAt,
      branchName: 'Test pobočka',
      accentHex: accentColor,
    };
  };

  const makeCancelledState = (): RBLiveActivityState => {
    const startAt = new Date(Date.now() - 30 * 60_000).toISOString();
    const endAt = new Date(Date.now() - 15 * 60_000).toISOString();
    return {
      phase: 'finished',
      presentation: 'cancelled',
      labelText: 'Rezervace zrušena',
      headlineText: 'Zrušeno',
      detailText: 'Klepněte pro detail rezervace',
      startAt,
      endAt,
      branchName: 'Test pobočka',
      accentHex: accentColor,
    };
  };

  const makeRescheduledState = (): RBLiveActivityState => {
    const startAt = new Date(Date.now() + 20 * 60_000).toISOString();
    const endAt = new Date(Date.now() + 50 * 60_000).toISOString();
    return {
      phase: 'scheduled',
      presentation: 'rescheduled',
      labelText: 'Rezervace přesunuta',
      headlineText: 'Změna rezervace',
      detailText: 'Klepněte pro detail',
      startAt,
      endAt,
      timeRangeText: formatDevSlotRange(startAt, endAt),
      branchName: 'Hagibor',
      employeeName: 'Bára',
      employeeAvatarUrl: 'https://randomuser.me/api/portraits/women/44.jpg',
      accentHex: accentColor,
    };
  };

  return (
    <View className="flex-1 bg-light-primary dark:bg-dark-primary">
      <Header showBackButton title="Live Activity (Dev)" />
      <ThemedScroller className="p-global">
        <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">
          Start / update / end pres ActivityKit. Dev screen nyni pouziva explicitni
          `phase/presentation` model stejne jako produkcni orchestrace.
        </ThemedText>
        <ThemedText className="mt-2 text-xs text-light-subtext dark:text-dark-subtext">
          Instances (tracked): {instancesCount}
        </ThemedText>
        {error ? (
          <ThemedText className="mt-2 text-xs text-red-600 dark:text-red-400">{error}</ThemedText>
        ) : null}

        {pushToken ? (
          <Pressable
            className="mt-3 rounded-lg bg-light-secondary dark:bg-dark-secondary p-3"
            onPress={() => {
              Clipboard.setStringAsync(pushToken).catch(() => undefined);
              setTokenCopied(true);
            }}
          >
            <ThemedText className="text-xs font-semibold text-light-text dark:text-dark-text mb-1">
              Push Token {tokenCopied ? '(copied!)' : '(tap to copy)'}
            </ThemedText>
            <ThemedText
              className="text-[10px] text-light-subtext dark:text-dark-subtext"
              numberOfLines={3}
            >
              {pushToken}
            </ThemedText>
          </Pressable>
        ) : null}

        <View className="mt-4 gap-2">
          <Button
            title="Start"
            onPress={() => {
              const startLiveActivity = async () => {
                try {
                  setError(null);
                  setPushToken(null);
                  setTokenCopied(false);
                  const handle = await rbLiveActivityStart(
                    'dev-booking',
                    initialState,
                    'realbarber://screens/trip-detail?id=dev-booking'
                  );
                  instanceRef.current = handle;
                  refreshInstances();
                  const token = await rbLiveActivityWaitForPushToken(handle.id);
                  setPushToken(token);
                } catch (e) {
                  setError(e instanceof Error ? e.message : String(e));
                }
              };
              startLiveActivity().catch(() => undefined);
            }}
          />
          <Button
            title="End ALL"
            variant="secondary"
            onPress={() => {
              const endAllActivities = async () => {
                try {
                  setError(null);
                  await rbLiveActivityEndAll();
                } catch (e) {
                  setError(e instanceof Error ? e.message : String(e));
                } finally {
                  instanceRef.current = null;
                  refreshInstances();
                }
              };
              endAllActivities().catch(() => undefined);
            }}
          />
          <Button
            title="Update (+1 min)"
            variant="outline"
            onPress={() => {
              setMinutes((m) => {
                const next = m + 1;
                const updateMinutes = async () => {
                  try {
                    setError(null);
                    const startAt = new Date(Date.now() + 60_000).toISOString();
                    const endAt = new Date(Date.now() + (60_000 + next * 60_000)).toISOString();
                    await instanceRef.current?.update({
                      phase: 'scheduled',
                      presentation: 'normal',
                      labelText: 'Začátek za',
                      startAt,
                      endAt,
                      branchName: 'Hagibor',
                      timeRangeText: formatDevSlotRange(startAt, endAt),
                      employeeName: 'Bára',
                      employeeAvatarUrl: 'https://randomuser.me/api/portraits/women/44.jpg',
                      priceFormatted: '450 Kč',
                      accentHex: accentColor,
                    });
                    refreshInstances();
                  } catch (e) {
                    setError(e instanceof Error ? e.message : String(e));
                  }
                };
                updateMinutes().catch(() => undefined);
                return next;
              });
            }}
          />
          <Button
            title="End"
            variant="outline"
            onPress={() => {
              const endCurrentActivity = async () => {
                try {
                  setError(null);
                  await instanceRef.current?.end();
                } catch {
                  // ignore
                } finally {
                  instanceRef.current = null;
                  refreshInstances();
                }
              };
              endCurrentActivity().catch(() => undefined);
            }}
          />
          <Button
            title="Upcoming"
            variant="ghost"
            onPress={() => {
              applyOrStart(makeUpcomingState()).catch((e) =>
                setError(e instanceof Error ? e.message : String(e))
              );
            }}
          />
          <Button
            title="Active"
            variant="ghost"
            onPress={() => {
              applyOrStart(makeActiveState()).catch((e) =>
                setError(e instanceof Error ? e.message : String(e))
              );
            }}
          />
          <Button
            title="Rescheduled"
            variant="ghost"
            onPress={() => {
              applyOrStart(makeRescheduledState()).catch((e) =>
                setError(e instanceof Error ? e.message : String(e))
              );
            }}
          />
          <Button
            title="Review"
            variant="ghost"
            onPress={() => {
              applyOrStart(makeReviewState()).catch((e) =>
                setError(e instanceof Error ? e.message : String(e))
              );
            }}
          />
          <Button
            title="Cancelled"
            variant="ghost"
            onPress={() => {
              applyOrStart(makeCancelledState()).catch((e) =>
                setError(e instanceof Error ? e.message : String(e))
              );
            }}
          />
        </View>
      </ThemedScroller>
    </View>
  );
}
