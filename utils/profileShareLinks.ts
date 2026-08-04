export const SHARE_OPEN_DELAY_MS = 300;
export const MENU_SHARE_OPEN_DELAY_MS = 50;

export interface ProfileShareLinks {
  facebook: string;
  telegram: string;
  whatsapp: string;
  email: string;
}

export function interpolateTemplate(
  template: string,
  vars: Record<string, string>
): string {
  return Object.entries(vars).reduce(
    (acc, [key, value]) => acc.replace(new RegExp(`\\{${key}\\}`, 'g'), value),
    template
  );
}

export function buildProfileShareLinks(
  shareUrl: string,
  displayName: string,
  emailSubject: string,
  emailBody: string
): ProfileShareLinks {
  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedText = encodeURIComponent(displayName);
  return {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`,
    whatsapp: `https://wa.me/?text=${encodeURIComponent(`${displayName}\n${shareUrl}`)}`,
    email: `mailto:?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`,
  };
}
