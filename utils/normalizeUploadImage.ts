import { requireOptionalNativeModule } from 'expo-modules-core';

import {
  buildNormalizedUploadFilename,
  UPLOAD_IMAGE_JPEG_MIME,
  UPLOAD_IMAGE_JPEG_QUALITY,
  UPLOAD_IMAGE_MAX_EDGE,
  type NormalizeUploadImageInput,
} from '@/utils/uploadImageInput';

export type { NormalizeUploadImageInput } from '@/utils/uploadImageInput';
export {
  buildNormalizedUploadFilename,
  uploadInputFromPickerAsset,
  UPLOAD_IMAGE_JPEG_MIME,
  UPLOAD_IMAGE_MAX_EDGE,
  UPLOAD_IMAGE_JPEG_QUALITY,
} from '@/utils/uploadImageInput';

export const IMAGE_MANIPULATOR_UNAVAILABLE_MESSAGE =
  'Zpracování fotek není k dispozici. Aktualizujte aplikaci na nejnovější verzi.';

function resizeActionsForDimensions(
  width?: number,
  height?: number
): { resize: { width: number } | { height: number } }[] {
  if (!width || !height) return [];
  if (width <= UPLOAD_IMAGE_MAX_EDGE && height <= UPLOAD_IMAGE_MAX_EDGE) return [];
  if (width >= height) {
    return [{ resize: { width: UPLOAD_IMAGE_MAX_EDGE } }];
  }
  return [{ resize: { height: UPLOAD_IMAGE_MAX_EDGE } }];
}

/**
 * Converts HEIC/HEIF/WebP/PNG/… to JPEG before CRM multipart upload.
 * Requires native `expo-image-manipulator` in the dev/production build.
 */
export async function normalizeImageForUpload(
  input: NormalizeUploadImageInput
): Promise<NormalizeUploadImageInput> {
  const uri = input.uri?.trim();
  if (!uri) {
    throw new Error('Chybí soubor fotky.');
  }

  if (!requireOptionalNativeModule('ExpoImageManipulator')) {
    throw new Error(IMAGE_MANIPULATOR_UNAVAILABLE_MESSAGE);
  }

  const { manipulateAsync, SaveFormat } = await import('expo-image-manipulator');
  const result = await manipulateAsync(uri, resizeActionsForDimensions(input.width, input.height), {
    compress: UPLOAD_IMAGE_JPEG_QUALITY,
    format: SaveFormat.JPEG,
  });

  return {
    uri: result.uri,
    name: buildNormalizedUploadFilename(input.name),
    mimeType: UPLOAD_IMAGE_JPEG_MIME,
    width: result.width,
    height: result.height,
  };
}
