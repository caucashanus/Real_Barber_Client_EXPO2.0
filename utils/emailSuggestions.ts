/** Běžné domény pro rychlé doplnění e-mailu po zadání „@“. */
export const EMAIL_DOMAIN_CHIPS = [
  'seznam.cz',
  'gmail.com',
  'atlas.cz',
  'email.cz',
  'post.cz',
  'outlook.com',
  'icloud.com',
  'centrum.cz',
  'volny.cz',
] as const;

/**
 * Vrátí domény k zobrazení jako čipy, pokud je v textu „@“ a doména ještě není kompletně jedna z nabízených.
 */
export function getEmailDomainChipSuggestions(emailValue: string): string[] {
  const trimmed = emailValue.trim();
  const at = trimmed.indexOf('@');
  if (at === -1) return [];

  const domainPart = trimmed.slice(at + 1).toLowerCase();
  const exactKnown = (EMAIL_DOMAIN_CHIPS as readonly string[]).includes(domainPart);
  if (exactKnown) return [];

  return (EMAIL_DOMAIN_CHIPS as readonly string[]).filter(
    (d) => domainPart === '' || d.startsWith(domainPart)
  );
}
