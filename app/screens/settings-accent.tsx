import React, { useRef, useState, useEffect } from 'react';
import { View } from 'react-native';
import Slider from '@react-native-community/slider';
import * as Haptics from 'expo-haptics';
import Header from '@/components/Header';
import ThemedScroller from '@/components/ThemeScroller';
import ThemedText from '@/components/ThemedText';
import Section from '@/components/layout/Section';
import { useAccentColor, DEFAULT_ACCENT } from '@/app/contexts/AccentColorContext';
import { useTranslation } from '@/app/hooks/useTranslation';
import useThemeColors from '@/app/contexts/ThemeColors';
import Icon from '@/components/Icon';

const SAT = 0.85;
const LIGHT = 0.5;

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex.replace(/^#/, ''));
  if (!result) return { r: 255, g: 32, b: 86 };
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  };
}

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }
  return { h: h * 360, s, l };
}

function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  h = h / 360;
  let r: number, g: number, b: number;
  if (s === 0) {
    r = g = b = l;
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
}

function hue2rgb(p: number, q: number, t: number): number {
  if (t < 0) t += 1;
  if (t > 1) t -= 1;
  if (t < 1 / 6) return p + (q - p) * 6 * t;
  if (t < 1 / 2) return q;
  if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
  return p;
}

function hueToHex(hue: number): string {
  const { r, g, b } = hslToRgb(hue, SAT, LIGHT);
  return '#' + [r, g, b].map((x) => Math.max(0, Math.min(255, x)).toString(16).padStart(2, '0')).join('');
}

function hexToHue(hex: string): number {
  const rgb = hexToRgb(hex);
  return rgbToHsl(rgb.r, rgb.g, rgb.b).h;
}

export default function SettingsAccentScreen() {
  const { t } = useTranslation();
  const { accentColor, setAccentColor } = useAccentColor();
  const colors = useThemeColors();
  const [hue, setHue] = useState(() => hexToHue(accentColor));
  const lastHapticStepRef = useRef<number | null>(null);

  useEffect(() => {
    setHue(hexToHue(accentColor));
  }, [accentColor]);

  const applyHue = (value: number) => {
    // Gentle haptic "ticks" while sliding (throttled by step).
    const step = Math.round(value / 6); // ~60 ticks across full range
    if (lastHapticStepRef.current !== step) {
      lastHapticStepRef.current = step;
      Haptics.selectionAsync().catch(() => {});
    }

    const h = hueToHex(value);
    setHue(value);
    setAccentColor(h);
  };

  return (
    <>
      <Header title={t('accentTitle')} showBackButton />
      <ThemedScroller className="flex-1">
        <Section titleSize="lg" className="px-global pt-4">
          <ThemedText className="mb-5 text-sm leading-6 text-light-subtext dark:text-dark-subtext">
            {t('accentExplanation')}
          </ThemedText>
          <View className="mb-6 h-24 rounded-2xl border border-light-border dark:border-dark-border items-center justify-center" style={{ backgroundColor: accentColor }}>
            <ThemedText
              className="text-lg font-medium"
              style={{
                color: (() => {
                  const { r, g, b } = hexToRgb(accentColor);
                  return r * 0.299 + g * 0.587 + b * 0.114 > 128 ? '#000' : '#fff';
                })(),
              }}
            >
              {accentColor}
            </ThemedText>
          </View>
          <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext mb-2">{t('accentHueSlider')}</ThemedText>
          <Slider
            minimumValue={0}
            maximumValue={360}
            value={hue}
            onValueChange={applyHue}
            minimumTrackTintColor={accentColor}
            maximumTrackTintColor="#ccc"
            thumbTintColor={accentColor}
          />

          <View
            pointerEvents="none"
            className="mt-8 rounded-2xl overflow-hidden border border-light-border dark:border-dark-border"
          >
            <View
              className="flex-row items-center justify-around py-3"
              style={{
                backgroundColor: colors.bg,
                borderTopColor: colors.secondary,
                borderTopWidth: 1,
              }}
            >
              <PreviewTabItem label={t('navHome')} icon="Search" focused />
              <PreviewTabItem label={t('navFavorites')} icon="Heart" focused={false} />
              <PreviewTabItem label={t('navBookings')} icon="CalendarPlus" focused={false} />
              <PreviewTabItem label={t('navProfile')} icon="CircleUser" focused={false} />
            </View>
          </View>
        </Section>
      </ThemedScroller>
    </>
  );
}

function PreviewTabItem(props: { label: string; icon: React.ComponentProps<typeof Icon>['name']; focused: boolean }) {
  const colors = useThemeColors();
  return (
    <View className="items-center justify-center px-2">
      <View className={props.focused ? 'opacity-100' : 'opacity-40'}>
        <Icon
          name={props.icon}
          size={26}
          strokeWidth={props.focused ? 2.1 : 1.7}
          color={props.focused ? colors.highlight : colors.icon}
        />
      </View>
      <ThemedText
        style={props.focused ? { color: colors.highlight } : undefined}
        className={`text-[9px] mt-px ${!props.focused ? 'text-neutral-500' : ''}`}
      >
        {props.label}
      </ThemedText>
    </View>
  );
}
