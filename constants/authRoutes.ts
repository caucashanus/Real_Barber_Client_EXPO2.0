export const LOGIN_PATH = '/screens/login' as const;

/** Po přihlášení — doplnění povinného e-mailu (stejný krok jako registrace). */
export const LOGIN_COMPLETE_EMAIL_PATH = '/screens/login-complete-email' as const;

/** Routes reachable without a valid apiToken. */
export const PUBLIC_ROUTE_PREFIXES = [
  '/screens/welcome',
  '/screens/login',
  '/screens/login-otp',
  '/screens/login-password',
  '/screens/forgot-password',
  '/screens/signup',
  '/screens/signup-summary',
] as const;

/** Login/signup flow – logged-in users are redirected away. */
export const AUTH_FLOW_ROUTE_PREFIXES = [
  '/screens/login',
  '/screens/login-otp',
  '/screens/login-password',
  '/screens/forgot-password',
  '/screens/signup',
  '/screens/signup-summary',
] as const;

export function isPublicRoute(pathname: string): boolean {
  if (!pathname || pathname === '/') return true;
  return PUBLIC_ROUTE_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export function isAuthFlowRoute(pathname: string): boolean {
  return AUTH_FLOW_ROUTE_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export function isLoginCompleteEmailRoute(pathname: string): boolean {
  return (
    pathname === LOGIN_COMPLETE_EMAIL_PATH ||
    pathname.startsWith(`${LOGIN_COMPLETE_EMAIL_PATH}/`)
  );
}
