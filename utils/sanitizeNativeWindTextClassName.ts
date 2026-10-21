import { Platform, StyleSheet, type StyleProp, type TextStyle } from 'react-native';

/** Tailwind `tracking-*` → RN `letterSpacing`; css-interop někdy nechá string → Android crash. */
const TRACKING_CLASS =
  /\btracking(?:-\[[^\]]+\]|-(?:wide|wider|widest|tight|tighter|normal))\b/g;

export function sanitizeNativeWindTextClassName(className?: string): string {
  if (!className?.trim()) return '';
  if (Platform.OS !== 'android') return className;
  return className.replace(TRACKING_CLASS, '').replace(/\s+/g, ' ').trim();
}

export function sanitizeTextStyleLetterSpacing(
  style?: StyleProp<TextStyle>
): StyleProp<TextStyle> | undefined {
  if (Platform.OS !== 'android' || style == null) return style;
  const flat = StyleSheet.flatten(style);
  if (!flat || typeof flat.letterSpacing !== 'string') return style;
  const raw = flat.letterSpacing.trim();
  const value = parseFloat(raw);
  if (Number.isNaN(value)) {
    const { letterSpacing: _removed, ...rest } = flat;
    return rest;
  }
  const fontSize = typeof flat.fontSize === 'number' ? flat.fontSize : 14;
  const letterSpacing = raw.endsWith('em') ? value * fontSize : value;
  return { ...flat, letterSpacing };
}
