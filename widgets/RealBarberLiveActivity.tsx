import { Image, Text, VStack } from '@expo/ui/swift-ui';
import { font, foregroundStyle, padding } from '@expo/ui/swift-ui/modifiers';
import { createLiveActivity, type LiveActivityEnvironment } from 'expo-widgets';

type RealBarberLiveActivityProps = {
  title: string;
  /** ISO string */
  startAt: string;
  /** ISO string */
  endAt: string;
  branchName?: string;
};

function clamp01(v: number): number {
  if (!Number.isFinite(v)) return 0;
  return Math.max(0, Math.min(1, v));
}

function diffMinutes(a: Date, b: Date): number {
  return Math.max(0, Math.round((b.getTime() - a.getTime()) / 60_000));
}

const RealBarberLiveActivity = (
  props: RealBarberLiveActivityProps,
  environment: LiveActivityEnvironment
) => {
  'widget';

  const accent = environment.colorScheme === 'dark' ? '#FFFFFF' : '#111827';

  const now = environment.date;
  const start = new Date(props.startAt);
  const end = new Date(props.endAt);

  const isBefore = now.getTime() < start.getTime();
  const isDuring = now.getTime() >= start.getTime() && now.getTime() <= end.getTime();

  const minutesToStart = diffMinutes(now, start);
  const minutesToEnd = diffMinutes(now, end);
  const totalMs = end.getTime() - start.getTime();
  const elapsedMs = now.getTime() - start.getTime();
  const progress = isDuring ? clamp01(elapsedMs / (totalMs || 1)) : 0;

  const primaryLine = isBefore ? `Začíná za ${minutesToStart} min` : isDuring ? 'Probíhá' : 'Dokončeno';
  const secondaryLine = isBefore
    ? (props.branchName ? props.branchName : '')
    : isDuring
      ? `Konec za ${minutesToEnd} min`
      : '';

  const minutesBadge = isBefore ? minutesToStart : isDuring ? minutesToEnd : 0;

  return {
    banner: (
      <VStack modifiers={[padding({ all: 12 })]}>
        <Text modifiers={[font({ weight: 'bold' }), foregroundStyle(accent)]}>{props.title}</Text>
        <Text modifiers={[foregroundStyle(accent)]}>{primaryLine}</Text>
        {secondaryLine ? <Text modifiers={[font({ size: 12 }), foregroundStyle(accent)]}>{secondaryLine}</Text> : null}
        {isDuring ? (
          <Text modifiers={[font({ size: 12 }), foregroundStyle(accent)]}>
            {Math.round(progress * 100)}%
          </Text>
        ) : null}
      </VStack>
    ),
    compactLeading: <Image systemName="scissors" color={accent} />,
    compactTrailing: <Text>{minutesBadge}m</Text>,
    minimal: <Image systemName="scissors" color={accent} />,
    expandedLeading: (
      <VStack modifiers={[padding({ all: 12 })]}>
        <Image systemName="scissors" color={accent} />
        <Text modifiers={[font({ size: 12 })]}>Real Barber</Text>
      </VStack>
    ),
    expandedTrailing: (
      <VStack modifiers={[padding({ all: 12 })]}>
        <Text modifiers={[font({ weight: 'bold', size: 20 })]}>{minutesBadge}</Text>
        <Text modifiers={[font({ size: 12 })]}>min</Text>
      </VStack>
    ),
    expandedBottom: (
      <VStack modifiers={[padding({ all: 12 })]}>
        <Text modifiers={[foregroundStyle(accent)]}>{primaryLine}</Text>
        {secondaryLine ? <Text modifiers={[font({ size: 12 }), foregroundStyle(accent)]}>{secondaryLine}</Text> : null}
      </VStack>
    ),
  };
};

export default createLiveActivity('RealBarberLiveActivity', RealBarberLiveActivity);

