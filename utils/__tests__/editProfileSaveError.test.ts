import { describe, expect, it } from 'vitest';

import { CrmHttpError } from '@/api/http';
import { getEditProfileSaveErrorPresentation } from '@/utils/editProfileSaveError';

describe('getEditProfileSaveErrorPresentation', () => {
  it('maps 409 to email conflict copy (edit profile cannot change phone)', () => {
    const result = getEditProfileSaveErrorPresentation(
      new CrmHttpError('Phone number already exists', 409, {})
    );
    expect(result.titleKey).toBe('editProfileSaveConflictTitle');
    expect(result.bodyKey).toBe('editProfileSaveConflictBody');
  });

  it('maps legacy Error message from patchClientMe', () => {
    const result = getEditProfileSaveErrorPresentation(
      new Error('Phone number already exists')
    );
    expect(result.titleKey).toBe('editProfileSaveConflictTitle');
  });
});
