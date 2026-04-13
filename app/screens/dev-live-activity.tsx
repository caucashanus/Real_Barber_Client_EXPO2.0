import React, { useMemo, useRef, useState } from 'react';
import { View } from 'react-native';

import { useAccentColor } from '@/app/contexts/AccentColorContext';
import { Button } from '@/components/Button';
import Header from '@/components/Header';
import ThemedScroller from '@/components/ThemeScroller';
import ThemedText from '@/components/ThemedText';
import {
  type RBLiveActivityHandle,
  rbLiveActivityEndAll,
  rbLiveActivityGetCount,
  rbLiveActivityStart,
} from '@/lib/rb-live-activity';

type Props = {
  /** Small caption (Bolt-style top). */
  subtitle: string;
  /** Large minutes line. */
  title: string;
  detailLine: string;
  progress01: number;
  startAt: string;
  endAt: string;
  branchName?: string;
  accentHex: string;
};

function formatDevSlotRange(startIso: string, endIso: string): string {
  const s = new Date(startIso);
  const e = new Date(endIso);
  const fmt = (d: Date) => d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  return `${fmt(s)}–${fmt(e)}`;
}

export default function DevLiveActivityScreen() {
  const { accentColor } = useAccentColor();
  const [minutes, setMinutes] = useState(15);
  const [error, setError] = useState<string | null>(null);
  const [instancesCount, setInstancesCount] = useState<number>(0);
  const instanceRef = useRef<RBLiveActivityHandle | null>(null);

  const initialProps = useMemo<Props>(() => {
    const startAt = new Date(Date.now() + 60_000).toISOString();
    const endAt = new Date(Date.now() + (60_000 + minutes * 60_000)).toISOString();
    const startMs = new Date(startAt).getTime();
    const now = Date.now();
    const minutesToStart = Math.max(1, Math.ceil((startMs - now) / 60_000));
    const progress01 = Math.min(1, Math.max(0, 1 - (startMs - now) / (60 * 60 * 1000)));
    return {
      subtitle: 'Začátek za',
      title: `${minutesToStart} min`,
      detailLine: formatDevSlotRange(startAt, endAt),
      progress01,
      startAt,
      endAt,
      branchName: 'Test pobočka',
      accentHex: accentColor,
    };
  }, [minutes, accentColor]);

  const refreshInstances = () => {
    void rbLiveActivityGetCount()
      .then(setInstancesCount)
      .catch(() => setInstancesCount(0));
  };

  const applyOrStart = async (props: Props) => {
    setError(null);
    if (instanceRef.current) {
      await instanceRef.current.update(props);
    } else {
      instanceRef.current = await rbLiveActivityStart(props, 'realbarber://');
    }
    refreshInstances();
  };

  const makeUpcomingProps = (): Props => {
    const startAt = new Date(Date.now() + 30 * 60_000).toISOString();
    const endAt = new Date(Date.now() + (30 * 60_000 + 45 * 60_000)).toISOString();
    const startMs = new Date(startAt).getTime();
    const now = Date.now();
    const minutesToStart = Math.max(1, Math.ceil((startMs - now) / 60_000));
    const progress01 = Math.min(1, Math.max(0, 1 - (startMs - now) / (60 * 60 * 1000)));
    return {
      subtitle: 'Začátek za',
      title: `${minutesToStart} min`,
      detailLine: formatDevSlotRange(startAt, endAt),
      progress01,
      startAt,
      endAt,
      branchName: 'Test pobočka',
      accentHex: accentColor,
    };
  };

  const makeActiveProps = (): Props => {
    const startAt = new Date(Date.now() - 10 * 60_000).toISOString();
    const endAt = new Date(Date.now() + 20 * 60_000).toISOString();
    const startMs = new Date(startAt).getTime();
    const endMs = new Date(endAt).getTime();
    const now = Date.now();
    const slotMs = Math.max(60_000, endMs - startMs);
    const minutesLeft = Math.max(1, Math.ceil((endMs - now) / 60_000));
    const progress01 = Math.min(1, Math.max(0, (now - startMs) / slotMs));
    return {
      subtitle: 'Končí za',
      title: `${minutesLeft} min`,
      detailLine: formatDevSlotRange(startAt, endAt),
      progress01,
      startAt,
      endAt,
      branchName: 'Test pobočka',
      accentHex: accentColor,
    };
  };

  const makeReviewProps = (): Props => {
    const startAt = new Date(Date.now() - 30 * 60_000).toISOString();
    const endAt = new Date(Date.now() + 15 * 60_000).toISOString();
    return {
      subtitle: 'Ohodnoťte rezervaci',
      title: 'Děkujeme!',
      detailLine: 'Tap pro hodnocení',
      progress01: -1,
      startAt,
      endAt,
      branchName: 'Test pobočka',
      accentHex: accentColor,
    };
  };

  const makeCancelledProps = (): Props => {
    const startAt = new Date(Date.now() - 30 * 60_000).toISOString();
    const endAt = new Date(Date.now() + 15 * 60_000).toISOString();
    return {
      subtitle: 'Rezervace zrušena',
      title: 'Zrušeno',
      detailLine: 'Změna se projeví do 5 min',
      progress01: -1,
      startAt,
      endAt,
      branchName: 'Test pobočka',
      accentHex: accentColor,
    };
  };

  return (
    <View className="flex-1 bg-light-primary dark:bg-dark-primary">
      <Header showBackButton title="Live Activity (Dev)" />
      <ThemedScroller className="p-global">
        <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">
          Start / Update / End — ActivityKit přes RBActivityBridge; UI Live Activity je ve widget
          extension (targets/realbarber-widget).
        </ThemedText>
        <ThemedText className="mt-2 text-xs text-light-subtext dark:text-dark-subtext">
          Instances (tracked): {instancesCount}
        </ThemedText>
        {error ? (
          <ThemedText className="mt-2 text-xs text-red-600 dark:text-red-400">{error}</ThemedText>
        ) : null}

        <View className="mt-4 gap-2">
          <Button
            title="Start"
            onPress={() => {
              void (async () => {
                try {
                  setError(null);
                  instanceRef.current = await rbLiveActivityStart(initialProps, 'realbarber://');
                  refreshInstances();
                } catch (e) {
                  setError(e instanceof Error ? e.message : String(e));
                }
              })();
            }}
          />
          <Button
            title="End ALL"
            variant="secondary"
            onPress={() => {
              void (async () => {
                try {
                  setError(null);
                  await rbLiveActivityEndAll();
                } catch (e) {
                  setError(e instanceof Error ? e.message : String(e));
                } finally {
                  instanceRef.current = null;
                  refreshInstances();
                }
              })();
            }}
          />
          <Button
            title="Update (+1 min)"
            variant="outline"
            onPress={() => {
              setMinutes((m) => {
                const next = m + 1;
                void (async () => {
                  try {
                    setError(null);
                    const baseStart = new Date(Date.now() + 60_000);
                    const startIso = baseStart.toISOString();
                    const endIso = new Date(baseStart.getTime() + next * 60_000).toISOString();
                    const startMs = baseStart.getTime();
                    const progress01 = Math.min(
                      1,
                      Math.max(0, 1 - (startMs - Date.now()) / (60 * 60 * 1000))
                    );
                    await instanceRef.current?.update({
                      subtitle: 'Začátek za',
                      title: `${next} min`,
                      detailLine: formatDevSlotRange(startIso, endIso),
                      progress01,
                      startAt: startIso,
                      endAt: endIso,
                      branchName: 'Test pobočka',
                      accentHex: accentColor,
                    });
                    refreshInstances();
                  } catch (e) {
                    setError(e instanceof Error ? e.message : String(e));
                  }
                })();
                return next;
              });
            }}
          />
          <Button
            title="End"
            variant="outline"
            onPress={() => {
              void (async () => {
                try {
                  setError(null);
                  await instanceRef.current?.end();
                } catch {
                  // ignore
                } finally {
                  instanceRef.current = null;
                  refreshInstances();
                }
              })();
            }}
          />
          <Button title="Refresh instances" variant="outline" onPress={refreshInstances} />
        </View>

        <View className="mt-8">
          <ThemedText className="text-base font-semibold">Preview states</ThemedText>
          <ThemedText className="mt-1 text-xs text-light-subtext dark:text-dark-subtext">
            Tlačítka buď založí instanci, nebo updatují tu běžící (stejný activityId).
          </ThemedText>
          <View className="mt-3 gap-2">
            <Button
              title="Preview: Upcoming"
              variant="outline"
              onPress={() => {
                void applyOrStart(makeUpcomingProps()).catch((e) =>
                  setError(e instanceof Error ? e.message : String(e))
                );
              }}
            />
            <Button
              title="Preview: Active"
              variant="outline"
              onPress={() => {
                void applyOrStart(makeActiveProps()).catch((e) =>
                  setError(e instanceof Error ? e.message : String(e))
                );
              }}
            />
            <Button
              title="Preview: Review"
              variant="outline"
              onPress={() => {
                void applyOrStart(makeReviewProps()).catch((e) =>
                  setError(e instanceof Error ? e.message : String(e))
                );
              }}
            />
            <Button
              title="Preview: Cancelled"
              variant="outline"
              onPress={() => {
                void applyOrStart(makeCancelledProps()).catch((e) =>
                  setError(e instanceof Error ? e.message : String(e))
                );
              }}
            />
          </View>
        </View>
      </ThemedScroller>
    </View>
  );
}
