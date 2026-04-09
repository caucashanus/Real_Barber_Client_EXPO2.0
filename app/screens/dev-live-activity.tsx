import React, { useMemo, useRef, useState } from 'react';
import { View } from 'react-native';
import type { LiveActivity } from 'expo-widgets';

import Header from '@/components/Header';
import ThemedScroller from '@/components/ThemeScroller';
import ThemedText from '@/components/ThemedText';
import { Button } from '@/components/Button';
import { RealBarberLiveActivity } from '@/widgets';

type Props = {
  title: string;
  startAt: string;
  endAt: string;
  branchName?: string;
};

export default function DevLiveActivityScreen() {
  const [minutes, setMinutes] = useState(15);
  const instanceRef = useRef<LiveActivity<Props> | null>(null);

  const initialProps = useMemo<Props>(
    () => ({
      title: 'Real Barber',
      startAt: new Date(Date.now() + 60_000).toISOString(),
      endAt: new Date(Date.now() + (60_000 + minutes * 60_000)).toISOString(),
      branchName: 'Test pobočka',
    }),
    [minutes]
  );

  return (
    <View className="flex-1 bg-light-primary dark:bg-dark-primary">
      <Header showBackButton title="Live Activity (Dev)" />
      <ThemedScroller className="p-global">
        <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">
          Start / Update / End pro test Live Activity.
        </ThemedText>

        <View className="mt-4 gap-2">
          <Button
            title="Start"
            onPress={() => {
              try {
                instanceRef.current = RealBarberLiveActivity.start(initialProps, 'realbarber://');
              } catch {}
            }}
          />
          <Button
            title="Update (+1 min)"
            variant="outline"
            onPress={() => {
              setMinutes((m) => {
                const next = m + 1;
                try {
                  const baseStart = new Date(Date.now() + 60_000);
                  instanceRef.current?.update({
                    title: 'Real Barber',
                    startAt: baseStart.toISOString(),
                    endAt: new Date(baseStart.getTime() + next * 60_000).toISOString(),
                    branchName: 'Test pobočka',
                  });
                } catch {}
                return next;
              });
            }}
          />
          <Button
            title="End"
            variant="secondary"
            onPress={() => {
              try {
                instanceRef.current?.end(
                  'default',
                  {
                    title: 'Real Barber',
                    startAt: new Date().toISOString(),
                    endAt: new Date().toISOString(),
                    branchName: 'Test pobočka',
                  },
                  new Date()
                );
              } catch {}
              instanceRef.current = null;
            }}
          />
        </View>
      </ThemedScroller>
    </View>
  );
}

