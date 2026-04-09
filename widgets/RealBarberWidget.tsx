import { HStack, Image, Text, VStack } from '@expo/ui/swift-ui';
import { font, foregroundStyle, padding } from '@expo/ui/swift-ui/modifiers';
import { createWidget, type WidgetEnvironment } from 'expo-widgets';

type RealBarberWidgetProps = {
  title: string;
  subtitle: string;
  /** Local file URI for SwiftUI Image (see Image uiImage prop). */
  logoUri?: string;
};

const RealBarberWidget = (props: RealBarberWidgetProps, environment: WidgetEnvironment) => {
  'widget';

  const accent = environment.colorScheme === 'dark' ? '#FFFFFF' : '#111827';

  return (
    <HStack spacing={10} modifiers={[padding({ all: 12 })]}>
      <VStack spacing={4}>
        {props.logoUri ? (
          <Image uiImage={props.logoUri} size={34} />
        ) : (
          <Text modifiers={[font({ weight: 'bold', size: 18 }), foregroundStyle(accent)]}>RB</Text>
        )}
        <Image systemName="scissors" color={accent} size={16} />
      </VStack>
      <VStack spacing={4}>
        <Text modifiers={[font({ weight: 'bold', size: 16 }), foregroundStyle(accent)]}>
          {props.title}
        </Text>
        <Text modifiers={[font({ size: 12 }), foregroundStyle(accent)]}>{props.subtitle}</Text>
      </VStack>
    </HStack>
  );
};

export default createWidget('RealBarberWidget', RealBarberWidget);
