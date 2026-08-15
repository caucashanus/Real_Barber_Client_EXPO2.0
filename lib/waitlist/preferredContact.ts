export type WaitlistPreferredContact = 'phone' | 'sms' | 'whatsapp' | 'telegram' | 'email';

export const WAITLIST_PREFERRED_CONTACT_DEFAULT: WaitlistPreferredContact = 'phone';

export const WAITLIST_PREFERRED_CONTACT_ORDER: readonly WaitlistPreferredContact[] = [
  'phone',
  'sms',
  'whatsapp',
  'telegram',
  'email',
] as const;

export function isWaitlistPreferredContact(value: string): value is WaitlistPreferredContact {
  return (WAITLIST_PREFERRED_CONTACT_ORDER as readonly string[]).includes(value);
}

export function isValidWaitlistEmail(email: string): boolean {
  const trimmed = email.trim();
  if (!trimmed || trimmed.length > 120) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
}

export function isValidWaitlistPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 9;
}

export type WaitlistContactPickerSelection =
  | { type: 'channel'; contact: WaitlistPreferredContact }
  | { type: 'alternate' };

/** Payload mapping for „Jiný telefon/email“. API vždy vyžaduje `phone`. */
export function buildAlternateWaitlistPayload(params: {
  profilePhone: string;
  alternatePhone: string;
  alternateEmail: string;
}): {
  phone: string;
  clientEmail: string | null;
  preferredContact: WaitlistPreferredContact;
} {
  const altPhone = params.alternatePhone.trim();
  const altEmail = params.alternateEmail.trim();

  if (altPhone && altEmail) {
    return { phone: altPhone, clientEmail: altEmail, preferredContact: 'phone' };
  }
  if (altPhone) {
    return { phone: altPhone, clientEmail: null, preferredContact: 'phone' };
  }
  return {
    phone: params.profilePhone,
    clientEmail: altEmail || null,
    preferredContact: 'email',
  };
}
