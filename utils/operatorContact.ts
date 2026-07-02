import { Linking } from 'react-native';

export const OPERATOR_SUPPORT_E164 = '+420608332881';
export const OPERATOR_SUPPORT_DISPLAY = '+420 608 332 881';
const OPERATOR_PHONE_DIGITS = '420608332881';

export function buildOperatorPhoneUrl(): string {
  return `tel:${OPERATOR_SUPPORT_E164}`;
}

export function buildOperatorWhatsAppUrl(): string {
  return `https://wa.me/${OPERATOR_PHONE_DIGITS}`;
}

export function buildOperatorTelegramUrl(): string {
  return `tg://resolve?phone=${OPERATOR_PHONE_DIGITS}`;
}

export async function openOperatorPhone(): Promise<void> {
  await Linking.openURL(buildOperatorPhoneUrl());
}

export async function openOperatorWhatsApp(): Promise<void> {
  await Linking.openURL(buildOperatorWhatsAppUrl());
}

export async function openOperatorTelegram(): Promise<void> {
  const nativeUrl = buildOperatorTelegramUrl();
  try {
    const canOpen = await Linking.canOpenURL(nativeUrl);
    if (canOpen) {
      await Linking.openURL(nativeUrl);
      return;
    }
  } catch {
    // fall through to https
  }
  await Linking.openURL(`https://t.me/+${OPERATOR_PHONE_DIGITS}`);
}
