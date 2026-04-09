import { Text, VStack } from '@expo/ui/swift-ui';
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

const RealBarberLiveActivity = (
  props: RealBarberLiveActivityProps,
  environment: LiveActivityEnvironment
) => {
  'widget';

  const accent = environment.colorScheme === 'dark' ? '#FFFFFF' : '#111827';
  const debugLine = props.title?.trim() ? props.title.trim() : 'RB TEST';

  return {
    banner: (
      <VStack modifiers={[padding({ all: 12 })]}>
        <Text modifiers={[font({ weight: 'bold', size: 18 }), foregroundStyle(accent)]}>
          RB LIVE OK
        </Text>
        <Text modifiers={[font({ size: 12 }), foregroundStyle(accent)]}>{debugLine}</Text>
      </VStack>
    ),
  };
};

export default createLiveActivity('RealBarberLiveActivity', RealBarberLiveActivity);
