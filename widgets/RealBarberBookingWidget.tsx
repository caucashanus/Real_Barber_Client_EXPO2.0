import {
  AccessoryWidgetBackground,
  Circle,
  HStack,
  Image,
  Spacer,
  Text,
  VStack,
  ZStack,
} from '@expo/ui/swift-ui';
import {
  containerBackground,
  font,
  foregroundStyle,
  frame,
  lineLimit,
  padding,
  resizable,
  truncationMode,
  widgetURL,
} from '@expo/ui/swift-ui/modifiers';
import { createWidget, type WidgetEnvironment } from 'expo-widgets';

import type { RealBarberBookingWidgetProps } from '@/utils/widgetBookingData';

const RealBarberBookingWidget = (
  props: RealBarberBookingWidgetProps,
  environment: WidgetEnvironment
) => {
  'widget';

  const linkModifiers = props.deepLinkUrl?.trim()
    ? [widgetURL(props.deepLinkUrl.trim())]
    : [];

  if (environment.widgetFamily === 'accessoryInline') {
    return <Text modifiers={linkModifiers}>{props.lockScreenLine ?? 'Real Barber'}</Text>;
  }

  if (
    environment.widgetFamily === 'accessoryRectangular' ||
    environment.widgetFamily === 'accessoryCircular'
  ) {
    return (
      <ZStack modifiers={linkModifiers}>
        <AccessoryWidgetBackground />
        <Text modifiers={[font({ size: 12 }), foregroundStyle('secondary')]}>
          {props.lockScreenLine ?? 'Real Barber'}
        </Text>
      </ZStack>
    );
  }

  const isMedium = environment.widgetFamily === 'systemMedium';
  const logoSize = isMedium ? 26 : 22;
  const scheduleSize = isMedium ? 16 : 15;
  const detailsSize = isMedium ? 12 : 11;
  const white = foregroundStyle('#FFFFFF');
  const muted = foregroundStyle('#A3A3A3');
  const homeModifiers = [
    containerBackground('#0F0F0F', 'widget'),
    padding({ all: 12 }),
    ...linkModifiers,
  ];

  const scheduleLine = props.hasBooking
    ? props.dateLabel && props.timeLabel
      ? props.dateLabel + ' ' + props.timeLabel
      : props.dateLabel ?? props.timeLabel ?? ''
    : 'Real Barber';

  let detailsLine = props.branchName?.trim() ?? '';
  if (props.hasBooking && isMedium) {
    const employeePart = props.employeeName?.trim() ?? '';
    const servicePart = props.serviceName?.trim() ?? '';
    if (employeePart) {
      detailsLine = detailsLine ? detailsLine + ' · ' + employeePart : employeePart;
    }
    if (servicePart) {
      detailsLine = detailsLine ? detailsLine + ' · ' + servicePart : servicePart;
    }
  }

  const detailsText = props.hasBooking
    ? detailsLine
    : 'Žádná nadcházející rezervace';

  return (
    <VStack modifiers={homeModifiers}>
      <HStack alignment="center">
        <Image
          assetName="RBWidgetLogo"
          modifiers={[frame({ width: logoSize, height: logoSize }), resizable()]}
        />
        <Spacer />
        {props.hasBooking ? (
          <Circle
            modifiers={[
              frame({ width: 8, height: 8 }),
              foregroundStyle(props.isInProgress ? '#34d399' : '#fbbf24'),
            ]}
          />
        ) : null}
      </HStack>
      <Spacer />
      <HStack>
        <Text
          modifiers={[
            font({ weight: props.hasBooking ? 'semibold' : 'bold', size: scheduleSize }),
            white,
          ]}>
          {scheduleLine}
        </Text>
        <Spacer />
      </HStack>
      <HStack>
        <Text
          modifiers={[
            font({ size: detailsSize }),
            muted,
            lineLimit(1),
            truncationMode('tail'),
          ]}>
          {detailsText}
        </Text>
        <Spacer />
      </HStack>
    </VStack>
  );
};

export default createWidget('RealBarberBookingWidget', RealBarberBookingWidget);
