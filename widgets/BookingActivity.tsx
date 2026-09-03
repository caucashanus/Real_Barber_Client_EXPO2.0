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

  const REVIEW_STAGE = 7;
  const ACCENT = '#fbbf24';
  const NAVIGATE_ACCENT = '#60A5FA';
  const INSPIRE_ACCENT = '#A78BFA';
  const STAR_FILLED = '#fbbf24';
  const STAR_EMPTY = '#525252';
  const DIM = '#FFFFFF40';

  const isReviewStage = props.stage >= REVIEW_STAGE;
  const isException = props.stageKind === 'cancelled' || props.stageKind === 'rescheduled';
  const linkModifiers = props.deepLinkUrl?.trim()
    ? [widgetURL(props.deepLinkUrl.trim())]
    : [];

  const ctaKind = props.ctaKind ?? 'none';

  // Pevné epoch ms z props — widget si z nich skládá Date (jako expo delivery example).
  const windowStartDate = new Date(props.soonEpochMs);
  const appointmentDate = new Date(props.appointmentEpochMs);

  // Banner — stejný poměr stran jako expo DeliveryActivity.
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

  const titleRow = (
    <Text
      modifiers={[
        font({ weight: 'bold', size: 18 }),
        foregroundStyle('#FFFFFF'),
        lineLimit(2),
        minimumScaleFactor(0.85),
        multilineTextAlignment('leading'),
        frame({ maxWidth: Infinity, alignment: 'leading' }),
      ]}>
      {props.status}
    </Text>
  );
  // Stepped progress — 1:1 s expo/examples DeliveryActivity StepProgress.
  // Každý connector je ProgressView s timerInterval pro svůj slice [start, end].
  const StepProgress = ({
    stepIcons,
    startEpochMs,
    endEpochMs,
    stage,
    accent = ACCENT,
  }: {
    stepIcons: readonly SFSymbol[];
    startEpochMs: number;
    endEpochMs: number;
    stage: number;
    accent?: string;
  }) => {
    const totalStages = stepIcons.length;
    const segMs = (endEpochMs - startEpochMs) / (totalStages - 1);
    const cells = stepIcons.flatMap((icon, i) => {
      const step = <Image key={`s${i}`} systemName={icon} size={16} color="#FFFFFF" />;
      if (i === stepIcons.length - 1) return [step];
      const connector = (
        <ZStack key={`l${i}`} modifiers={[frame({ maxWidth: Infinity })]}>
          <Capsule modifiers={[foregroundStyle(DIM), frame({ height: 4, maxWidth: Infinity })]} />
          <ProgressView
            timerInterval={{
              lower: new Date(startEpochMs + i * segMs),
              upper: new Date(startEpochMs + (i + 1) * segMs),
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

  // Stage 0–4: 2 ikony (kalendář → hodiny/termín), progress T−90 → termín.
  // Stage 5–6: 2 ikony (nůžky → křeslo), progress termín → konec slotu.
  const BookingProgress = ({ accent = ACCENT }: { accent?: string }) => {
    if (props.stage <= 4) {
      return (
        <StepProgress
          stepIcons={['calendar.badge.clock', 'clock.fill']}
          startEpochMs={props.soonEpochMs}
          endEpochMs={props.appointmentEpochMs}
          stage={0}
          accent={accent}
        />
      );
    }

    return (
      <StepProgress
        stepIcons={['scissors', 'chair.lounge.fill']}
        startEpochMs={props.appointmentEpochMs}
        endEpochMs={props.endEpochMs}
        stage={props.stage >= 7 ? 1 : 0}
        accent={accent}
      />
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

  const usesStage0CountdownLabel = props.stage === 0 || props.stage === 2;

  const Stage0MinutesLabel = ({
    size,
    compact = false,
  }: {
    size: number;
    compact?: boolean;
  }) => {
    const remainingMin = Math.max(
      0,
      Math.ceil((props.appointmentEpochMs - props.nowEpochMs) / 60_000)
    );
    const labelSize = compact ? 13 : 20;

    return (
      <Text
        modifiers={[
          font({ weight: compact ? 'medium' : 'semibold', size: labelSize }),
          monospacedDigit(),
          foregroundStyle(ACCENT),
          lineLimit(1),
          ...(compact ? [frame({ width: 68, alignment: 'trailing' }), padding({ trailing: 4 })] : []),
        ]}>
        {'za ' + remainingMin + ' min'}
      </Text>
    );
  };

  const CountdownLabel = ({
    size,
    color,
    width,
  }: {
    size: number;
    color: string;
    width: number;
  }) => {
    const labelSize = size >= 14 ? 12 : 11;

    return (
      <HStack spacing={3}>
        <Text
          modifiers={[
            font({ weight: 'semibold', size: labelSize }),
            foregroundStyle(color),
            lineLimit(1),
          ]}>
          Za
        </Text>
        <Text
          timerInterval={{ lower: windowStartDate, upper: appointmentDate }}
          countsDown
          modifiers={[
            font({ weight: 'semibold', size: labelSize }),
            monospacedDigit(),
            foregroundStyle(color),
            frame({ width, alignment: 'trailing' }),
          ]}
        />
      </HStack>
    );
  };

  const DurationLabel = ({ size, color }: { size: number; color: string }) => {
    const labelSize = size >= 14 ? 12 : 11;
    const minutes = props.durationMinutes ?? 60;
    return (
      <Text
        modifiers={[
          font({ weight: 'semibold', size: labelSize }),
          foregroundStyle(color),
          lineLimit(1),
        ]}>
        cca {minutes} min
      </Text>
    );
  };

  const ctaPillColor =
    ctaKind === 'navigate'
      ? NAVIGATE_ACCENT
      : ctaKind === 'inspire'
        ? INSPIRE_ACCENT
        : ACCENT;

  const progressAccent =
    props.stage === 0 ? ACCENT : props.stage === 1 ? NAVIGATE_ACCENT : undefined;
  const bannerProgressAccent = progressAccent ?? '#FFFFFF';
  const islandProgressAccent = progressAccent ?? ACCENT;

  // Dynamic Island compact trailing — úzký obsah s pevnou šířkou (jako expo Eta).
  // Široké ActionPill by vytlačilo logo z compactLeading.
  const CompactIslandCta = () => {
    if (isReviewStage) {
      return (
        <Image
          systemName="star.fill"
          size={14}
          color={STAR_FILLED}
          modifiers={[padding({ trailing: 4 })]}
        />
      );
    }
    if (isException) return null;

    switch (ctaKind) {
      case 'countdown':
        if (usesStage0CountdownLabel) {
          return <Stage0MinutesLabel compact />;
        }
        return (
          <Text
            timerInterval={{ lower: windowStartDate, upper: appointmentDate }}
            countsDown
            modifiers={[
              font({ weight: 'medium', size: 13 }),
              monospacedDigit(),
              foregroundStyle(ACCENT),
              frame({ width: 46, alignment: 'trailing' }),
              padding({ trailing: 4 }),
            ]}
          />
        );
      case 'navigate':
        return (
          <HStack spacing={4} modifiers={[padding({ trailing: 4 })]}>
            <Text
              modifiers={[
                font({ weight: 'medium', size: 13 }),
                foregroundStyle(NAVIGATE_ACCENT),
                lineLimit(1),
                minimumScaleFactor(0.75),
              ]}>
              {props.ctaLabel ?? 'Navigovat'}
            </Text>
            <Image systemName="location.north.fill" size={14} color={NAVIGATE_ACCENT} />
          </HStack>
        );
      case 'inspire':
        return (
          <Image systemName="sparkles" size={14} color={INSPIRE_ACCENT} modifiers={[padding({ trailing: 4 })]} />
        );
      case 'duration':
        return (
          <Text
            modifiers={[
              font({ weight: 'medium', size: 13 }),
              foregroundStyle(ACCENT),
              lineLimit(1),
              padding({ trailing: 4 }),
            ]}>
            cca {props.durationMinutes ?? 60}m
          </Text>
        );
      default:
        return null;
    }
  };

  const CtaPill = ({ size, color }: { size: number; color: string }) => {
    if (isException || isReviewStage) return null;

    switch (ctaKind) {
      case 'navigate':
        return (
          <ActionPill
            size={size}
            color={color}
            icon="location.north.fill"
            label={props.ctaLabel ?? 'Navigovat'}
          />
        );
      case 'inspire':
        return (
          <ActionPill
            size={size}
            color={color}
            icon="sparkles"
            label={props.ctaLabel ?? 'Inspirace'}
          />
        );
      case 'countdown':
        if (usesStage0CountdownLabel) {
          return <Stage0MinutesLabel size={size} />;
        }
        return <CountdownLabel size={size} color={ACCENT} width={size >= 14 ? 52 : 46} />;
      case 'duration':
        return <DurationLabel size={size} color={ACCENT} />;
      default:
        return null;
    }
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
        {props.subtitle ? (
          <Text modifiers={[font({ size: 13 }), foregroundStyle('#A3A3A3'), lineLimit(2)]}>
            {props.subtitle}
          </Text>
        ) : null}
        <Text modifiers={[font({ weight: 'bold', size: 18 }), foregroundStyle('#FFFFFF')]}>
          {props.status}
        </Text>
        <ReviewStars size={32} spacing={8} centered />
      </VStack>
    </ZStack>
  );

  const showBookingProgress = !isException && props.stage !== 2 && props.stage !== 3;

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
        <HStack spacing={8} modifiers={[frame({ maxWidth: Infinity }), padding({ vertical: 2 })]}>
          <Logo uri={props.logoUri} size={40} />
          <Spacer />
          {!isReviewStage && !isException ? (
            props.stage === 2 ? (
              <Stage0MinutesLabel size={13} />
            ) : (
              <CtaPill size={13} color={ctaPillColor} />
            )
          ) : null}
        </HStack>
        {titleRow}
        {props.subtitle ? (
          <Text modifiers={[font({ size: 13 }), foregroundStyle('#A3A3A3'), lineLimit(2)]}>
            {props.subtitle}
          </Text>
        ) : null}
        {props.stage === 3 ? (
          <Text
            modifiers={[
              font({ weight: 'medium', size: 13 }),
              foregroundStyle(INSPIRE_ACCENT),
              lineLimit(2),
              multilineTextAlignment('leading'),
              frame({ maxWidth: Infinity, alignment: 'leading' }),
            ]}>
            Za chvíli se vám budeme věnovat...
          </Text>
        ) : null}
        {showBookingProgress ? <BookingProgress accent={bannerProgressAccent} /> : null}
      </VStack>
    </ZStack>
  );

  const IslandBrandText = ({
    size = 14,
    leading = 8,
  }: {
    size?: number;
    leading?: number;
  }) => (
    <Text
      modifiers={[
        font({ weight: 'semibold', size }),
        foregroundStyle('#FFFFFF'),
        lineLimit(1),
        padding({ leading }),
      ]}>
      Real Barber
    </Text>
  );

  const IslandCatalogText = ({
    size = 12,
    leading = 4,
  }: {
    size?: number;
    leading?: number;
  }) => (
    <Text
      modifiers={[
        font({ weight: 'semibold', size }),
        foregroundStyle('#FFFFFF'),
        lineLimit(1),
        minimumScaleFactor(0.75),
        padding({ leading }),
      ]}>
      RB · Katalog
    </Text>
  );

  const useIslandBrandText = props.stage === 0 || props.stage === 1 || props.stage === 2;
  const useIslandExpandedBrandText = useIslandBrandText || props.stage === 3;

  return {
    banner: isReviewStage ? reviewBanner : standardBanner,
    compactLeading:
      props.stage === 3 ? (
        <IslandCatalogText size={12} leading={4} />
      ) : useIslandBrandText ? (
        <IslandBrandText size={12} leading={4} />
      ) : (
        <Logo uri={props.logoUri} size={16} modifiers={[padding({ leading: 4 })]} />
      ),
    compactTrailing: <CompactIslandCta />,
    minimal:
      props.stage === 3 ? (
        <IslandCatalogText size={12} leading={4} />
      ) : useIslandBrandText ? (
        <IslandBrandText size={12} leading={4} />
      ) : (
        <Logo uri={props.logoUri} size={16} />
      ),
    expandedLeading: useIslandExpandedBrandText ? (
      <IslandBrandText size={14} leading={8} />
    ) : (
      <HStack spacing={6} modifiers={[padding({ leading: 8 })]}>
        <Logo uri={props.logoUri} size={16} />
        <Text
          modifiers={[
            font({ weight: 'semibold', size: 14 }),
            foregroundStyle('#FFFFFF'),
            lineLimit(1),
          ]}>
          Real Barber
        </Text>
      </HStack>
    ),
    expandedTrailing: isReviewStage ? (
      <HStack modifiers={[padding({ trailing: 6 })]}>
        <ReviewStars size={14} />
      </HStack>
    ) : (
      <HStack modifiers={[padding({ trailing: 6 })]}>
        <CtaPill size={14} color={ctaPillColor} />
      </HStack>
    ),
    expandedBottom: isReviewStage ? (
      <VStack alignment="leading" spacing={8} modifiers={[padding({ top: 4, horizontal: 6 })]}>
        {props.subtitle ? (
          <Text modifiers={[font({ size: 12 }), foregroundStyle('#A3A3A3'), lineLimit(2)]}>{props.subtitle}</Text>
        ) : null}
        <Text modifiers={[font({ weight: 'semibold', size: 14 }), foregroundStyle('#FFFFFF')]}>
          {props.status}
        </Text>
        <ReviewStars size={22} spacing={7} centered />
      </VStack>
    ) : (
      <VStack alignment="leading" spacing={10} modifiers={[padding({ top: 4, horizontal: 6 })]}>
        <Text modifiers={[font({ size: 13 }), foregroundStyle('#FFFFFFCC'), lineLimit(2)]}>
          {props.expandedSubtitle ?? props.subtitle ?? props.status}
        </Text>
        {showBookingProgress ? <BookingProgress accent={islandProgressAccent} /> : null}
      </VStack>
    ),
  };
};

export default createLiveActivity<BookingActivityProps>('BookingActivity', BookingActivity);
