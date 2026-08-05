import {
  buildOperatorPhoneUrl,
  buildOperatorTelegramUrl,
  buildOperatorWhatsAppUrl,
  OPERATOR_SUPPORT_E164,
} from '@/utils/operatorContact';

function withQueryParam(url: string, key: string, value: string): string {
  const parsed = new URL(url);
  parsed.searchParams.set(key, value);
  return parsed.toString();
}

export function buildBranchProfileSmsLink(message: string): string {
  return `sms:${OPERATOR_SUPPORT_E164}?body=${encodeURIComponent(message)}`;
}

export function buildBranchProfileWhatsAppLink(message: string): string {
  return withQueryParam(buildOperatorWhatsAppUrl(), 'text', message);
}

export function buildBranchProfileTelegramLink(message: string): string {
  return withQueryParam('https://t.me/+420608332881', 'text', message);
}

export { buildOperatorPhoneUrl };
