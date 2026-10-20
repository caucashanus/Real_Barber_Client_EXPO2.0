import { uploadClientMedia } from '@/api/client';

/** Nahraje lokální URI přes CRM `POST /api/client/media` → veřejné URL pro kids-watch payload. */
export async function uploadKidsWatchHaircutPhotoUrls(
  apiToken: string,
  uris: readonly string[]
): Promise<string[]> {
  const urls: string[] = [];
  for (const uri of uris) {
    if (!uri.trim()) continue;
    const media = await uploadClientMedia(apiToken, {
      uri,
      title: 'Kids watch haircut',
      alt: 'Haircut inspiration',
    });
    urls.push(media.url);
  }
  return urls;
}
