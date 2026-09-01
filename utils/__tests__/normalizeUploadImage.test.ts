import { describe, expect, it } from 'vitest';

import { buildNormalizedUploadFilename } from '@/utils/uploadImageInput';

describe('buildNormalizedUploadFilename', () => {
  it('converts HEIC and other extensions to .jpg', () => {
    expect(buildNormalizedUploadFilename('IMG_1234.HEIC')).toBe('IMG_1234.jpg');
    expect(buildNormalizedUploadFilename('photo.heif')).toBe('photo.jpg');
    expect(buildNormalizedUploadFilename('shot.webp')).toBe('shot.jpg');
    expect(buildNormalizedUploadFilename('legacy.jpeg')).toBe('legacy.jpg');
  });

  it('falls back when name is missing', () => {
    expect(buildNormalizedUploadFilename(undefined)).toMatch(/^upload-\d+\.jpg$/);
    expect(buildNormalizedUploadFilename('   ')).toMatch(/^upload-\d+\.jpg$/);
  });
});
