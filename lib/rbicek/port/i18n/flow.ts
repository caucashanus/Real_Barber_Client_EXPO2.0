import type { FlowOption } from "@/lib/rbicek/port/types/chat";
import type { WidgetLocale } from "@/lib/rbicek/port/types/config";
import { withoutDashes } from "@/lib/rbicek/port/i18n/locale";
import flowEn from "@/lib/rbicek/port/i18n/catalogs/flow.en.json";
import flowUk from "@/lib/rbicek/port/i18n/catalogs/flow.uk.json";

type FlowCatalog = {
  labels: Record<string, string>;
  messages: Record<string, string>;
  messageLoggedIn?: Record<string, string>;
};

const CATALOGS: Record<"en" | "uk", FlowCatalog> = {
  en: flowEn as FlowCatalog,
  uk: flowUk as FlowCatalog,
};

function catalog(locale: WidgetLocale | undefined): FlowCatalog | null {
  if (locale === "en" || locale === "uk") return CATALOGS[locale];
  return null;
}

export function flowMessage(
  nodeId: string | undefined,
  fallback: string,
  locale: WidgetLocale | undefined,
): string {
  const clean = withoutDashes(fallback);
  if (!nodeId) return clean;
  const hit = catalog(locale)?.messages[nodeId];
  return hit ? withoutDashes(hit) : clean;
}

export function flowMessageLoggedIn(
  nodeId: string | undefined,
  fallback: string,
  locale: WidgetLocale | undefined,
): string {
  const clean = withoutDashes(fallback);
  if (!nodeId) return clean;
  const hit = catalog(locale)?.messageLoggedIn?.[nodeId];
  return hit ? withoutDashes(hit) : clean;
}

export function flowLabel(
  optionId: string,
  fallback: string,
  locale: WidgetLocale | undefined,
): string {
  const clean = withoutDashes(fallback);
  const hit = catalog(locale)?.labels[optionId];
  return hit ? withoutDashes(hit) : clean;
}

export function localizeOptions(
  options: FlowOption[],
  locale: WidgetLocale | undefined,
): FlowOption[] {
  if (!locale || locale === "cs") {
    return options.map((option) => ({
      ...option,
      label: withoutDashes(option.label),
      sublabel: option.sublabel
        ? withoutDashes(option.sublabel)
        : option.sublabel,
    }));
  }
  return options.map((option) => ({
    ...option,
    label: flowLabel(option.id, option.label, locale),
    sublabel: option.sublabel
      ? flowLabel(`${option.id}__sub`, option.sublabel, locale)
      : option.sublabel,
  }));
}
