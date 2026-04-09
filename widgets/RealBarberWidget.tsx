import { Text, VStack } from '@expo/ui/swift-ui';
import { font, foregroundStyle, padding } from '@expo/ui/swift-ui/modifiers';
import { createWidget, type WidgetEnvironment } from 'expo-widgets';

type RealBarberWidgetProps = {
  title: string;
  subtitle: string;
};

const RealBarberWidget = (props: RealBarberWidgetProps, environment: WidgetEnvironment) => {
  'widget';

  const accent = environment.colorScheme === 'dark' ? '#FFFFFF' : '#111827';

  return (
    <VStack spacing={6} modifiers={[padding({ all: 12 })]}>
      <Text modifiers={[font({ weight: 'bold', size: 16 }), foregroundStyle(accent)]}>
        {props.title}
      </Text>
      <Text modifiers={[font({ size: 12 }), foregroundStyle(accent)]}>{props.subtitle}</Text>
    </VStack>
  );
};

export default createWidget('RealBarberWidget', RealBarberWidget);

