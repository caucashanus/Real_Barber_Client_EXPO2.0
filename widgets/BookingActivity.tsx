import { Capsule, HStack, Image, ProgressView, Spacer, Text, VStack, ZStack } from '@expo/ui/swift-ui';
import {
  clipShape,
  containerBackground,
  font,
  foregroundStyle,
  frame,
  labelsHidden,
  lineLimit,
  ModifierConfig,
  monospacedDigit,
  multilineTextAlignment,
  padding,
  progressViewStyle,
  resizable,
  tint,
} from '@expo/ui/swift-ui/modifiers';
import { createLiveActivity, type LiveActivityEnvironment } from 'expo-widgets';
import type { SFSymbol } from 'sf-symbols-typescript';

import type { BookingActivityProps } from '@/utils/bookingLiveActivityData';

const BookingActivity = (props: BookingActivityProps, _env: LiveActivityEnvironment) => {
  'widget';

  const TOTAL_STAGES = 4;
  const ACCENT = '#fbbf24';
  const IN_PROGRESS = '#34d399';
  const DIM = '#FFFFFF40';
  const STEP_ICONS = ['calendar.badge.clock', 'clock.fill', 'chair.lounge.fill', 'checkmark.circle.fill'] as const;

  const nowDate = new Date(props.nowEpochMs);
  const appointmentDate = new Date(props.appointmentEpochMs);

  const Logo = ({ uri, size, modifiers }: { uri?: string; size?: number; modifiers?: ModifierConfig[] }) =>
    uri ? (
      <Image
        uiImage={uri}
        modifiers={[
          resizable(),
          frame({ width: size ?? 16, height: (size ?? 16) * 0.875 }),
          ...(modifiers ?? []),
        ]}
      />
    ) : null;

  const StepProgress = ({ stage, accent = ACCENT }: { stage: number; accent?: string }) => {
    const segMs = (props.endEpochMs - props.soonEpochMs) / (TOTAL_STAGES - 1);
    const cells = STEP_ICONS.flatMap((icon, i) => {
      const step = <Image key={`s${i}`} systemName={icon} size={16} color="#FFFFFF" />;
      if (i === STEP_ICONS.length - 1) return [step];
      const connector = (
        <ZStack key={`l${i}`} modifiers={[frame({ maxWidth: Infinity })]}>
          <Capsule modifiers={[foregroundStyle(DIM), frame({ height: 4, maxWidth: Infinity })]} />
          <ProgressView
            timerInterval={{
              lower: new Date(props.soonEpochMs + i * segMs),
              upper: new Date(props.soonEpochMs + (i + 1) * segMs),
            }}
            countsDown={false}
            modifiers={[
              progressViewStyle('linear'),
              tint(stage > i ? '#FFFFFF' : accent),
              labelsHidden(),
              frame({ maxWidth: Infinity }),
            ]}
          />
        </ZStack>
      );
      return [step, connector];
    });
    return (
      <HStack spacing={8} modifiers={[frame({ maxWidth: Infinity })]}>
        {cells}
      </HStack>
    );
  };

  const Eta = ({
    stage,
    size,
    color,
    width,
    deliveredIcon,
  }: {
    stage: number;
    size: number;
    color: string;
    width: number;
    deliveredIcon?: SFSymbol;
  }) =>
    stage >= TOTAL_STAGES - 1 ? (
      deliveredIcon ? (
        <Image systemName={deliveredIcon} size={Math.round(size * 1.6)} color={color} />
      ) : (
        <Text modifiers={[font({ weight: 'medium', size }), foregroundStyle(color)]}>Hotovo</Text>
      )
    ) : stage === 2 ? (
      <Text modifiers={[font({ weight: 'medium', size }), foregroundStyle(IN_PROGRESS)]}>Teď</Text>
    ) : stage === 0 ? null : (
      <Text
        timerInterval={{ lower: nowDate, upper: appointmentDate }}
        countsDown
        modifiers={[
          font({ weight: 'medium', size }),
          monospacedDigit(),
          foregroundStyle(color),
          multilineTextAlignment('trailing'),
          frame({ width, alignment: 'trailing' }),
        ]}
      />
    );

  const statusLine = (p: BookingActivityProps) => {
    const branch = p.branchName?.trim() ?? '';
    const employee = p.employeeName?.trim() ?? '';
    const time = p.timeLabel?.trim() ?? '';
    const detail = [branch, employee].filter(Boolean).join(' · ');
    return (
      [
        'Rezervace je potvrzená',
        time ? `Za chvíli termín ${time}` : 'Brzy termín',
        detail ? `Právě teď · ${detail}` : 'Právě teď',
        'Návštěva dokončena',
      ][p.stage] ?? p.status
    );
  };

  const subtitle = [props.branchName, props.employeeName, props.timeLabel].filter(Boolean).join(' · ');

  return {
    banner: (
      <ZStack modifiers={[containerBackground('#0F0F0F', 'widget'), clipShape('containerRelativeShape')]}>
        <VStack
          alignment="leading"
          spacing={12}
          modifiers={[frame({ maxWidth: Infinity, alignment: 'leading' }), padding({ all: 16 })]}>
          <HStack spacing={8}>
            <Text modifiers={[font({ weight: 'medium', size: 13 }), foregroundStyle('#FFFFFF')]}>
              Real Barber
            </Text>
            <Spacer />
            {props.stage !== 0 ? (
              <Eta
                stage={props.stage}
                size={13}
                color="#FFFFFFCC"
                width={48}
                deliveredIcon="checkmark.circle.fill"
              />
            ) : null}
          </HStack>
          <Text modifiers={[font({ weight: 'bold', size: 18 }), foregroundStyle('#FFFFFF')]}>
            {props.status}
          </Text>
          {subtitle ? (
            <Text modifiers={[font({ size: 13 }), foregroundStyle('#A3A3A3'), lineLimit(1)]}>
              {subtitle}
            </Text>
          ) : null}
          <StepProgress stage={props.stage} accent={props.stage >= 2 ? IN_PROGRESS : ACCENT} />
        </VStack>
      </ZStack>
    ),
    compactLeading: <Logo uri={props.logoUri} size={14} modifiers={[padding({ leading: 4 })]} />,
    compactTrailing: (
      <Eta
        stage={props.stage}
        size={13}
        color="#FFFFFF"
        width={46}
        deliveredIcon="checkmark.circle.fill"
      />
    ),
    minimal: <Logo uri={props.logoUri} size={16} />,
    expandedLeading: (
      <Text
        modifiers={[
          font({ weight: 'semibold', size: 14 }),
          foregroundStyle('#FFFFFF'),
          lineLimit(1),
          padding({ leading: 8 }),
        ]}>
        Real Barber
      </Text>
    ),
    expandedTrailing: (
      <HStack modifiers={[padding({ trailing: 6 })]}>
        <Eta stage={props.stage} size={14} color={ACCENT} width={52} deliveredIcon="checkmark.circle.fill" />
      </HStack>
    ),
    expandedBottom: (
      <VStack alignment="leading" spacing={10} modifiers={[padding({ top: 4, horizontal: 6 })]}>
        <Text modifiers={[font({ size: 13 }), foregroundStyle('#FFFFFFCC')]}>{statusLine(props)}</Text>
        <StepProgress stage={props.stage} />
      </VStack>
    ),
  };
};

export default createLiveActivity<BookingActivityProps>('BookingActivity', BookingActivity);
