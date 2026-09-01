import { CONTACT_PHONE } from "@/lib/rbicek/port/data/branchesCatalog";
import { getFlowSnapshotConstants } from "@/lib/rbicek/flow/snapshot";
import { isOperatorOffHours, operatorHoursLabel } from "@/lib/rbicek/port/lib/operatorHours";
import { tSystem } from "@/lib/rbicek/port/i18n/system";
import type { FlowOption } from "@/lib/rbicek/port/types/chat";
import type { WidgetLocale } from "@/lib/rbicek/port/types/config";

/**
 * Temporary kill-switch for live operator handoff / WS chat.
 * Set to `true` to restore „Spojit s operátorem“ without deleting handoff code.
 */
export const LIVE_OPERATOR_ENABLED = getFlowSnapshotConstants().liveOperatorEnabled;

export const CONTACT_PHONE_DISPLAY = CONTACT_PHONE;
export const CONTACT_PHONE_E164 = CONTACT_PHONE.replace(/\s/g, "");

export const CONTACT_WHATSAPP_URL = `https://wa.me/${CONTACT_PHONE_E164.replace("+", "")}`;
export const CONTACT_TELEGRAM_URL = `https://t.me/${CONTACT_PHONE_E164}`;
export const CONTACT_SMS_URL = `sms:${CONTACT_PHONE_E164}`;
export const CONTACT_TEL_URL = `tel:${CONTACT_PHONE_E164}`;

/** @deprecated Label comes from flow snapshot (`follow_operator`). */
export const CONTACT_OPERATOR_CHIP_LABEL = "Kontaktovat podporu";

/** Bot copy on the contact node (phone CTA). */
export const CONTACT_OPERATOR_MESSAGE = `Napište nebo zavolejte na tel. ${CONTACT_PHONE_DISPLAY}`;

export const OPERATOR_CONTACT_NODE_ID = "operator_contact";

export function operatorEntryOption(
  locale: WidgetLocale = "cs",
): FlowOption {
  if (LIVE_OPERATOR_ENABLED) {
    return {
      id: "follow_operator",
      label: tSystem("connectOperator", locale),
      nextNodeId: "operator_live",
    };
  }
  return {
    id: "follow_operator",
    label: tSystem("contactOperatorChip", locale),
    nextNodeId: OPERATOR_CONTACT_NODE_ID,
  };
}

export function operatorContactMessage(
  now: Date = new Date(),
  locale: WidgetLocale = "cs",
): string {
  const base = tSystem("contactOperatorMessage", locale, {
    phone: CONTACT_PHONE_DISPLAY,
  });
  if (!isOperatorOffHours(now)) return base;
  return `${base}\n\n${tSystem("contactOffHours", locale, {
    hours: operatorHoursLabel(),
  })}`;
}

export function operatorContactChannelOptions(
  locale: WidgetLocale = "cs",
): FlowOption[] {
  return [
    {
      id: "contact_whatsapp",
      label: "WhatsApp",
      nextNodeId: OPERATOR_CONTACT_NODE_ID,
      action: "openUrl",
      url: CONTACT_WHATSAPP_URL,
    },
    {
      id: "contact_telegram",
      label: "Telegram",
      nextNodeId: OPERATOR_CONTACT_NODE_ID,
      action: "openUrl",
      url: CONTACT_TELEGRAM_URL,
    },
    {
      id: "contact_sms",
      label: "SMS",
      nextNodeId: OPERATOR_CONTACT_NODE_ID,
      action: "openUrl",
      url: CONTACT_SMS_URL,
    },
    {
      id: "contact_call",
      label: tSystem("call", locale),
      nextNodeId: OPERATOR_CONTACT_NODE_ID,
      action: "openUrl",
      url: CONTACT_TEL_URL,
    },
  ];
}
