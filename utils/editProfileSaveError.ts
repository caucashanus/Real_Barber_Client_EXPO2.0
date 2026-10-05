import { CrmHttpError } from '@/api/http';
import type { TranslationKey } from '@/locales';

export type EditProfileSaveErrorPresentation = {
  titleKey: TranslationKey;
  bodyKey: TranslationKey;
};

/** Map PATCH /me failures to user-facing copy (409 from CRM may say "phone" for email conflict). */
export function getEditProfileSaveErrorPresentation(
  err: unknown
): EditProfileSaveErrorPresentation {
  if (err instanceof CrmHttpError) {
    if (err.status === 409) {
      return {
        titleKey: 'editProfileSaveConflictTitle',
        bodyKey: 'editProfileSaveConflictBody',
      };
    }
    if (err.status === 400) {
      return {
        titleKey: 'editProfileSaveFailedTitle',
        bodyKey: 'editProfileSaveInvalidBody',
      };
    }
  }

  if (err instanceof Error) {
    if (err.message === 'Phone number already exists') {
      return {
        titleKey: 'editProfileSaveConflictTitle',
        bodyKey: 'editProfileSaveConflictBody',
      };
    }
    if (err.message === 'Invalid input data') {
      return {
        titleKey: 'editProfileSaveFailedTitle',
        bodyKey: 'editProfileSaveInvalidBody',
      };
    }
    if (err.message === 'Failed to update profile') {
      return {
        titleKey: 'editProfileSaveFailedTitle',
        bodyKey: 'editProfileSaveGenericBody',
      };
    }
  }

  return {
    titleKey: 'editProfileSaveFailedTitle',
    bodyKey: 'editProfileSaveGenericBody',
  };
}
