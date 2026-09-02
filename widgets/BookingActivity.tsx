import { Capsule, HStack, Image, ProgressView, Spacer, Text, VStack, ZStack } from '@expo/ui/swift-ui';
import {
  clipShape,
  containerBackground,
  font,
  foregroundStyle,
  frame,
  labelsHidden,
  lineLimit,
  minimumScaleFactor,
  ModifierConfig,
  monospacedDigit,
  multilineTextAlignment,
  padding,
  progressViewStyle,
  resizable,
  strokeBorder,
  tint,
  widgetURL,
} from '@expo/ui/swift-ui/modifiers';
import { createLiveActivity, type LiveActivityEnvironment } from 'expo-widgets';
import type { SFSymbol } from 'sf-symbols-typescript';

import type { BookingActivityProps } from '@/utils/bookingLiveActivityData';

const BookingActivity = (props: BookingActivityProps, _env: LiveActivityEnvironment) => {
  'widget';

  const TOTAL_STAGES = 4;
  const REVIEW_STAGE = TOTAL_STAGES - 1;
  const ACCENT = '#fbbf24';
  const IN_PROGRESS = '#34d399';
  const STAR_FILLED = '#fbbf24';
  const STAR_EMPTY = '#525252';
  const DIM = '#FFFFFF40';
  const STEP_ICONS = ['calendar.badge.clock', 'clock.fill', 'chair.lounge.fill', 'star.fill'] as const;
  const isReviewStage = props.stage >= REVIEW_STAGE;
  const linkModifiers = props.deepLinkUrl?.trim()
    ? [widgetURL(props.deepLinkUrl.trim())]
    : [];

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

  const ActionPill = ({
    size,
    color,
    icon,
    label,
    content,
  }: {
    size: number;
    color: string;
    icon?: SFSymbol;
    label?: string;
    content?: React.ReactNode;
  }) => {
    const labelSize = size >= 14 ? 12 : 11;
    const textModifiers = [
      font({ weight: 'semibold', size: labelSize }),
      foregroundStyle(color),
      lineLimit(1),
      minimumScaleFactor(0.75),
    ];

    return (
      <HStack
        spacing={4}
        modifiers={[
          padding({ horizontal: 10, vertical: 4 }),
          strokeBorder({ color, style: { lineWidth: 1 }, shape: 'capsule' }),
        ]}>
        {icon ? <Image systemName={icon} size={Math.max(10, size - 1)} color={color} /> : null}
        {content ?? <Text modifiers={textModifiers}>{label}</Text>}
      </HStack>
    );
  };

  const NavigatePill = ({ size, color }: { size: number; color: string }) => (
    <ActionPill size={size} color={color} icon="location.north.fill" label="Navigovat" />
  );

  const SharePill = ({ size, color }: { size: number; color: string }) => (
    <ActionPill
      size={size}
      color={color}
      icon="square.and.arrow.up"
      label="Sdílet rezervaci"
    />
  );

  const CountdownLabel = ({ size, color }: { size: number; color: string }) => {
    const labelSize = size >= 14 ? 12 : 11;
    const textModifiers = [
      font({ weight: 'semibold', size: labelSize }),
      foregroundStyle(color),
      lineLimit(1),
      minimumScaleFactor(0.75),
    ];

    return (
      <HStack spacing={3}>
        <Text modifiers={textModifiers}>Za</Text>
        <Text
          timerInterval={{ lower: nowDate, upper: appointmentDate }}
          countsDown
          modifiers={[...textModifiers, monospacedDigit()]}
        />
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
    stage >= TOTAL_STAGES - 1 ? null : stage === 2 ? (
      <SharePill size={size} color={color} />
    ) : stage === 0 ? (
      <NavigatePill size={size} color={color} />
    ) : (
      <CountdownLabel size={size} color={ACCENT} />
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

  const ReviewStars = ({
    size = 22,
    centered = false,
    spacing = 6,
  }: {
    size?: number;
    centered?: boolean;
    spacing?: number;
  }) => {
    const stars = (
      <HStack spacing={spacing}>
        {([1, 2, 3, 4, 5] as const).map((rating) => {
          const filled =
            props.existingReviewRating != null && rating <= props.existingReviewRating;
          return (
            <Image
              key={rating}
              systemName={filled ? 'star.fill' : 'star'}
              size={size}
              color={filled ? STAR_FILLED : STAR_EMPTY}
            />
          );
        })}
      </HStack>
    );

    if (!centered) return stars;

    return (
      <HStack modifiers={[frame({ maxWidth: Infinity })]}>
        <Spacer />
        {stars}
        <Spacer />
      </HStack>
    );
  };

  const subtitle = [props.branchName, props.employeeName, props.timeLabel].filter(Boolean).join(' · ');

  const reviewBanner = (
    <ZStack
      modifiers={[
        containerBackground('#0F0F0F', 'widget'),
        clipShape('containerRelativeShape'),
        ...linkModifiers,
      ]}>
      <VStack
        alignment="leading"
        spacing={12}
        modifiers={[frame({ maxWidth: Infinity, alignment: 'leading' }), padding({ all: 16 })]}>
        <Text modifiers={[font({ weight: 'medium', size: 13 }), foregroundStyle('#FFFFFF')]}>
          Real Barber
        </Text>
        {subtitle ? (
          <Text modifiers={[font({ size: 13 }), foregroundStyle('#A3A3A3'), lineLimit(1)]}>
            {subtitle}
          </Text>
        ) : null}
        <Text modifiers={[font({ weight: 'bold', size: 18 }), foregroundStyle('#FFFFFF')]}>
          {props.status}
        </Text>
        <ReviewStars size={32} spacing={8} centered />
      </VStack>
    </ZStack>
  );

  const standardBanner = (
    <ZStack
      modifiers={[
        containerBackground('#0F0F0F', 'widget'),
        clipShape('containerRelativeShape'),
        ...linkModifiers,
      ]}>
      <VStack
        alignment="leading"
        spacing={12}
        modifiers={[frame({ maxWidth: Infinity, alignment: 'leading' }), padding({ all: 16 })]}>
        <HStack spacing={8}>
          <Text modifiers={[font({ weight: 'medium', size: 13 }), foregroundStyle('#FFFFFF')]}>
            Real Barber
          </Text>
          <Spacer />
          {props.stage < REVIEW_STAGE ? (
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
  );

  return {
    banner: isReviewStage ? reviewBanner : standardBanner,
    compactLeading: <Logo uri={props.logoUri} size={14} modifiers={[padding({ leading: 4 })]} />,
    compactTrailing: isReviewStage ? (
      <Image systemName="star.fill" size={14} color={STAR_FILLED} modifiers={[padding({ trailing: 4 })]} />
    ) : (
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
    expandedTrailing: isReviewStage ? (
      <HStack modifiers={[padding({ trailing: 6 })]}>
        <ReviewStars size={14} />
      </HStack>
    ) : (
      <HStack modifiers={[padding({ trailing: 6 })]}>
        <Eta stage={props.stage} size={14} color={ACCENT} width={52} deliveredIcon="checkmark.circle.fill" />
      </HStack>
    ),
    expandedBottom: isReviewStage ? (
      <VStack alignment="leading" spacing={8} modifiers={[padding({ top: 4, horizontal: 6 })]}>
        {subtitle ? (
          <Text modifiers={[font({ size: 12 }), foregroundStyle('#A3A3A3'), lineLimit(1)]}>{subtitle}</Text>
        ) : null}
        <Text modifiers={[font({ weight: 'semibold', size: 14 }), foregroundStyle('#FFFFFF')]}>
          {props.status}
        </Text>
        <ReviewStars size={22} spacing={7} centered />
      </VStack>
    ) : (
      <VStack alignment="leading" spacing={10} modifiers={[padding({ top: 4, horizontal: 6 })]}>
        <Text modifiers={[font({ size: 13 }), foregroundStyle('#FFFFFFCC')]}>{statusLine(props)}</Text>
        <StepProgress stage={props.stage} />
      </VStack>
    ),
  };
};

export default createLiveActivity<BookingActivityProps>('BookingActivity', BookingActivity);
