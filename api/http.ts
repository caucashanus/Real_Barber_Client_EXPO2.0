import { notifyUnauthorized } from './session';

/** Throws on 401 and triggers global session-expired redirect. */
export function checkAuthResponse(res: Response): void {
  if (res.status === 401) {
    notifyUnauthorized();
    throw new Error('Unauthorized');
  }
}
