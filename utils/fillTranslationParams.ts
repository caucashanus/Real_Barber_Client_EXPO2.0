/** Nahradí `{key}` v řetězci z locales (app nemá ICU). */
export function fillTranslationParams(
  template: string,
  params: Record<string, string | number>
): string {
  return Object.entries(params).reduce(
    (acc, [key, value]) => acc.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value)),
    template
  );
}
