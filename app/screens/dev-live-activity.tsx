import type { LiveActivity } from 'expo-widgets';
import React, { useMemo, useRef, useState } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/Button';
import Header from '@/components/Header';
import ThemedScroller from '@/components/ThemeScroller';
import ThemedText from '@/components/ThemedText';
import { RealBarberLiveActivity } from '@/widgets';

type Props = {
  title: string;
  startAt: string;
  endAt: string;
  branchName?: string;
};

export default function DevLiveActivityScreen() {
  const [minutes, setMinutes] = useState(15);
  const [error, setError] = useState<string | null>(null);
  const [instancesCount, setInstancesCount] = useState<number>(0);
  const instanceRef = useRef<LiveActivity<Props> | null>(null);

  const initialProps = useMemo<Props>(
    () => ({
      title: 'RB TEST',
      startAt: new Date(Date.now() + 60_000).toISOString(),
      endAt: new Date(Date.now() + (60_000 + minutes * 60_000)).toISOString(),
      branchName: 'Test pobočka',
    }),
    [minutes]
  );

  const refreshInstances = () => {
    try {
      setInstancesCount(RealBarberLiveActivity.getInstances().length);
    } catch {
      setInstancesCount(0);
    }
  };

  return (
    <View className="flex-1 bg-light-primary dark:bg-dark-primary">
      <Header showBackButton title="Live Activity (Dev)" />
      <ThemedScroller className="p-global">
        <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">
          Start / Update / End pro test Live Activity.
        </ThemedText>
        <ThemedText className="mt-2 text-xs text-light-subtext dark:text-dark-subtext">
          Instances: {instancesCount}
        </ThemedText>
        {error ? (
          <ThemedText className="mt-2 text-xs text-red-600 dark:text-red-400">{error}</ThemedText>
        ) : null}

        <View className="mt-4 gap-2">
          <Button
            title="Start"
            onPress={() => {
              try {
                setError(null);
                instanceRef.current = RealBarberLiveActivity.start(initialProps, 'realbarber://');
                refreshInstances();
              } catch (e) {
                setError(e instanceof Error ? e.message : String(e));
              }
            }}
          />
          <Button
            title="End ALL"
            variant="secondary"
            onPress={() => {
              try {
                setError(null);
                const instances = RealBarberLiveActivity.getInstances();
                instances.forEach((inst) => {
                  inst.end('immediate').catch(() => {});
                });
              } catch (e) {
                setError(e instanceof Error ? e.message : String(e));
              } finally {
                instanceRef.current = null;
                refreshInstances();
              }
            }}
          />
          <Button
            title="Update (+1 min)"
            variant="outline"
            onPress={() => {
              setMinutes((m) => {
                const next = m + 1;
                try {
                  setError(null);
                  const baseStart = new Date(Date.now() + 60_000);
                  instanceRef.current?.update({
                    title: 'RB TEST',
                    startAt: baseStart.toISOString(),
                    endAt: new Date(baseStart.getTime() + next * 60_000).toISOString(),
                    branchName: 'Test pobočka',
                  });
                  refreshInstances();
                } catch (e) {
                  setError(e instanceof Error ? e.message : String(e));
                }
                return next;
              });
            }}
          />
          <Button
            title="End"
            variant="outline"
            onPress={() => {
              try {
                setError(null);
                instanceRef.current?.end(
                  'default',
                  {
                    title: 'RB TEST',
                    startAt: new Date().toISOString(),
                    endAt: new Date().toISOString(),
                    branchName: 'Test pobočka',
                  },
                  new Date()
                );
              } catch {}
              instanceRef.current = null;
              refreshInstances();
            }}
          />
          <Button title="Refresh instances" variant="outline" onPress={refreshInstances} />
        </View>
      </ThemedScroller>
    </View>
  );
}
