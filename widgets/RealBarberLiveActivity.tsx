import { Image, Text, VStack } from '@expo/ui/swift-ui';
import { font, foregroundStyle, padding } from '@expo/ui/swift-ui/modifiers';
import { createLiveActivity, type LiveActivityEnvironment } from 'expo-widgets';

type RealBarberLiveActivityProps = {
  title: string;
  minutesRemaining: number;
};

const RealBarberLiveActivity = (
  props: RealBarberLiveActivityProps,
  environment: LiveActivityEnvironment
) => {
  'widget';

  const accent = environment.colorScheme === 'dark' ? '#FFFFFF' : '#111827';

  return {
    banner: (
      <VStack modifiers={[padding({ all: 12 })]}>
        <Text modifiers={[font({ weight: 'bold' }), foregroundStyle(accent)]}>{props.title}</Text>
        <Text>{props.minutesRemaining} min</Text>
      </VStack>
    ),
    compactLeading: <Image systemName="scissors" color={accent} />,
    compactTrailing: <Text>{props.minutesRemaining}m</Text>,
    minimal: <Image systemName="scissors" color={accent} />,
    expandedLeading: (
      <VStack modifiers={[padding({ all: 12 })]}>
        <Image systemName="scissors" color={accent} />
        <Text modifiers={[font({ size: 12 })]}>Real Barber</Text>
      </VStack>
    ),
    expandedTrailing: (
      <VStack modifiers={[padding({ all: 12 })]}>
        <Text modifiers={[font({ weight: 'bold', size: 20 })]}>{props.minutesRemaining}</Text>
        <Text modifiers={[font({ size: 12 })]}>min</Text>
      </VStack>
    ),
    expandedBottom: (
      <VStack modifiers={[padding({ all: 12 })]}>
        <Text>Pokračuje…</Text>
      </VStack>
    ),
  };
};

export default createLiveActivity('RealBarberLiveActivity', RealBarberLiveActivity);

