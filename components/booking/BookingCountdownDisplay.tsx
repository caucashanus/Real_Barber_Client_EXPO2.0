import React, { useEffect, useRef, useState } from 'react';
import { Animated, View } from 'react-native';

import ThemedText from '@/components/ThemedText';
import { useTranslation } from '@/hooks/useTranslation';
import { getBookingCountdownParts, type BookingCountdownParts } from '@/utils/bookingCountdownParts';

const AnimatedNumber = ({ value, className }: { value: number; className?: string }) => {
  const [displayValue, setDisplayValue] = useState(value);
  const prevValue = useRef(value);
  const countAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (value === prevValue.current) return;
    const startValue = prevValue.current;
    prevValue.current = value;
    countAnim.setValue(0);
    const listener = countAnim.addListener(({ value: v }) => {
      setDisplayValue(Math.round(startValue + (value - startValue) * v));
    });
    Animated.timing(countAnim, { toValue: 1, duration: 400, useNativeDriver: false }).start();
    return () => {
      countAnim.removeListener(listener);
    };
  }, [value, countAnim]);

  const safe = Number.isFinite(displayValue) ? displayValue : 0;
  return <ThemedText className={className}>{safe}</ThemedText>;
};

type Props = {
  target: Date;
  /** `sm` = pill v seznamu rezervací (výchozí). */
  textSize?: 'sm' | 'xs';
  /** Pill — stejná typografie u „Za“, jednotek i čísel (parita web badge). */
  variant?: 'default' | 'pill';
};

export default function BookingCountdownDisplay({
  target,
  textSize = 'sm',
  variant = 'default',
}: Props) {
  const { t } = useTranslation();
  const [parts, setParts] = useState<BookingCountdownParts | null>(() =>
    getBookingCountdownParts(target)
  );

  useEffect(() => {
    const tick = () => setParts(getBookingCountdownParts(target));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target]);

  if (!parts) return null;

  const textClass =
    variant === 'pill'
      ? 'text-xs font-semibold tabular-nums text-neutral-800 dark:text-neutral-200'
      : textSize === 'xs'
        ? 'text-xs text-light-subtext dark:text-dark-subtext'
        : 'text-sm text-light-subtext dark:text-dark-subtext';

  if (parts.type === 'days') {
    return (
      <View className="flex-row items-center">
        <ThemedText className={textClass}>{t('tripsIn')} </ThemedText>
        <AnimatedNumber value={parts.days} className={textClass} />
        <ThemedText className={textClass}> {t('tripsDays')}</ThemedText>
      </View>
    );
  }
  if (parts.type === 'hours') {
    return (
      <View className="flex-row items-center">
        <ThemedText className={textClass}>{t('tripsIn')} </ThemedText>
        <AnimatedNumber value={parts.hours} className={textClass} />
        <ThemedText className={textClass}> {t('tripsHours')} </ThemedText>
        <AnimatedNumber value={parts.minutes} className={textClass} />
        <ThemedText className={textClass}> {t('tripsMinutes')}</ThemedText>
      </View>
    );
  }
  return (
    <View className="flex-row items-center">
      <AnimatedNumber value={parts.minutes} className={textClass} />
      <ThemedText className={textClass}> {t('tripsMinutes')} </ThemedText>
      <AnimatedNumber value={parts.seconds} className={textClass} />
      <ThemedText className={textClass}> {t('tripsSeconds')}</ThemedText>
    </View>
  );
}
