import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Button, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

import BookingActivity from '@/widgets/BookingActivity';
import DeliveryActivity from '@/widgets/DeliveryActivity';
import {
  BOOKING_REVIEW_STAGE,
  BOOKING_STAGE_COUNT,
  BOOKING_STAGE_LABELS,
  buildBookingActivityProps,
} from '@/utils/bookingLiveActivityData';
import { createBookingLiveActivityPreviewBookingAt } from '@/utils/bookingLiveActivityFixtures';
import { ensureLiveActivityLogoUri } from '@/utils/widgetSharedAssets';

const STAGE_KINDS = ['normal', 'cancelled', 'rescheduled'] as const;
/** Jako expo delivery example — krátké okno, aby šel vidět live countdown + progress. */
const PREVIEW_LA_WINDOW_MS = 10 * 60 * 1000;

function endOtherLiveActivities(): void {
  DeliveryActivity.getInstances().forEach((instance) => instance.end('immediate'));
  BookingActivity.getInstances().forEach((instance) => instance.end('immediate'));
}

export default function BookingLiveActivityPreviewScreen() {
  const [stage, setStage] = useState(0);
  const [stageKind, setStageKind] = useState<(typeof STAGE_KINDS)[number]>('normal');
  const [logoUri, setLogoUri] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const activityRef = useRef<ReturnType<typeof BookingActivity.start> | null>(null);
  const laWindowRef = useRef<{ startEpochMs: number; appointmentEpochMs: number } | null>(null);

  const ensurePreviewWindow = useCallback(() => {
    if (!laWindowRef.current) {
      const startEpochMs = Date.now();
      laWindowRef.current = {
        startEpochMs,
        appointmentEpochMs: startEpochMs + PREVIEW_LA_WINDOW_MS,
      };
    }
    return laWindowRef.current;
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'ios') return;
    void ensureLiveActivityLogoUri().then(setLogoUri);
    return () => {
      activityRef.current?.end('immediate');
      activityRef.current = null;
    };
  }, []);

  const buildProps = useCallback(
    (targetStage: number, kind: (typeof STAGE_KINDS)[number]) => {
      const window = ensurePreviewWindow();
      const booking = createBookingLiveActivityPreviewBookingAt(
        new Date(window.appointmentEpochMs),
        kind === 'cancelled'
          ? { status: 'cancelled' }
          : kind === 'rescheduled'
            ? { status: 'rescheduled' }
            : undefined
      );
      return buildBookingActivityProps(booking, logoUri, Date.now(), {
        forcedStage: targetStage,
        stageKind: kind,
        laStartEpochMs: window.startEpochMs,
      });
    },
    [ensurePreviewWindow, logoUri]
  );

  const applyStage = useCallback(
    (targetStage: number, kind: (typeof STAGE_KINDS)[number] = stageKind) => {
      if (!logoUri || Platform.OS !== 'ios') return;
      endOtherLiveActivities();
      activityRef.current = null;
      const props = buildProps(targetStage, kind);
      activityRef.current = BookingActivity.start(props, props.deepLinkUrl);
      setRunning(true);
      setStage(targetStage);
      setStageKind(kind);
    },
    [buildProps, logoUri, stageKind]
  );

  const startFromStage0 = () => {
    laWindowRef.current = null;
    setStageKind('normal');
    applyStage(0, 'normal');
  };

  const endActivity = () => {
    activityRef.current?.end('immediate');
    activityRef.current = null;
    laWindowRef.current = null;
    setRunning(false);
  };

  if (Platform.OS !== 'ios') {
    return (
      <View style={styles.container}>
        <Text style={styles.heading}>Booking Live Activity preview</Text>
        <Text style={styles.hint}>Pouze iOS — vyžaduje dev build s expo-widgets.</Text>
        <Button title="Zpět" onPress={() => router.back()} />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heading}>Booking Live Activity</Text>
      <Text style={styles.hint}>
        Nový lifecycle (8 stavů, T−90 start). Klepněte na stage pro update na Lock Screen / Dynamic
        Island.
      </Text>

      <Text style={styles.warning}>
        Stage 2 = „Kdo se o vás dnes postará?“ + subtitle s jménem barbera. Tap → detail
        rezervace. Stage 0 = logo Real
        Barber. Pokud vidíte starou delivery aktivitu, ukončete ji (End LA) a spusťte znovu.
      </Text>

      <Text style={styles.meta}>
        Aktuální: stage {stage} — {BOOKING_STAGE_LABELS[stage] ?? '?'} ({stageKind})
      </Text>
      {!logoUri ? (
        <Text style={styles.hint}>Načítám logo do sdíleného úložiště widgetů…</Text>
      ) : null}

      <View style={styles.row}>
        <Button
          title={running ? 'End LA' : 'Start (stage 0)'}
          onPress={running ? endActivity : startFromStage0}
          disabled={!logoUri}
        />
      </View>

      <Text style={styles.section}>Stages 0–{BOOKING_REVIEW_STAGE}</Text>
      <View style={styles.stageGrid}>
        {Array.from({ length: BOOKING_STAGE_COUNT }, (_, i) => (
          <View key={i} style={styles.stageCell}>
            <Button title={`${i}`} onPress={() => applyStage(i, 'normal')} disabled={!logoUri} />
            <Text style={styles.stageLabel} numberOfLines={2}>
              {BOOKING_STAGE_LABELS[i]}
            </Text>
          </View>
        ))}
      </View>

      <Text style={styles.section}>Výjimky</Text>
      <View style={styles.row}>
        <Button title="Zrušeno" onPress={() => applyStage(stage, 'cancelled')} disabled={!logoUri} />
        <Button title="Přesunuto" onPress={() => applyStage(stage, 'rescheduled')} disabled={!logoUri} />
      </View>

      <Button title="Zpět" onPress={() => router.back()} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#fff',
    alignItems: 'stretch',
    gap: 12,
    padding: 24,
    paddingBottom: 48,
  },
  heading: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  hint: {
    textAlign: 'center',
    color: '#666',
    marginBottom: 8,
  },
  warning: {
    textAlign: 'center',
    color: '#b45309',
    backgroundColor: '#fffbeb',
    padding: 12,
    borderRadius: 8,
    overflow: 'hidden',
  },
  meta: {
    textAlign: 'center',
    fontWeight: '600',
  },
  section: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  stageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  stageCell: {
    width: 72,
    alignItems: 'center',
    gap: 4,
  },
  stageLabel: {
    fontSize: 9,
    textAlign: 'center',
    color: '#444',
  },
});
