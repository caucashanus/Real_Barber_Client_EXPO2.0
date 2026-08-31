import type { WidgetLocale } from "@/lib/rbicek/port/types/config";

export type { WidgetLocale };

export function dateLocale(locale: WidgetLocale): string {
  if (locale === "en") return "en-GB";
  if (locale === "uk") return "uk-UA";
  return "cs-CZ";
}

/** Strip em/en dashes and ASCII doubledash from user-facing copy. */
export function withoutDashes(text: string): string {
  return text
    .replace(/\s*[—–]\s*/g, ", ")
    .replace(/--+/g, ", ");
}
