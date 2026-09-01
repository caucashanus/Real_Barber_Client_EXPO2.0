import type { ImagePickerAsset } from 'expo-image-picker';

export const UPLOAD_IMAGE_JPEG_MIME = 'image/jpeg';
/** CRM upload limit 15 MB — keep reasonable max edge for phone photos. */
export const UPLOAD_IMAGE_MAX_EDGE = 4096;
export const UPLOAD_IMAGE_JPEG_QUALITY = 0.85;

export interface NormalizeUploadImageInput {
  uri: string;
  name?: string;
  mimeType?: string;
  width?: number;
  height?: number;
}

export function buildNormalizedUploadFilename(name?: string | null): string {
  const trimmed = name?.trim();
  if (trimmed) {
    const base =
      trimmed
        .replace(/\.[^.]+$/, '')
        .replace(/[^\w.-]+/g, '_')
        .slice(0, 120) || 'upload';
    return `${base}.jpg`;
  }
  return `upload-${Date.now()}.jpg`;
}

export function uploadInputFromPickerAsset(
  asset: Pick<ImagePickerAsset, 'uri' | 'fileName' | 'mimeType' | 'width' | 'height'>,
  extra?: { title?: string; alt?: string; flagId?: string }
): NormalizeUploadImageInput & { title?: string; alt?: string; flagId?: string } {
  return {
    uri: asset.uri,
    name: asset.fileName ?? undefined,
    mimeType: asset.mimeType ?? undefined,
    width: asset.width,
    height: asset.height,
    ...extra,
  };
}
