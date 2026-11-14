import { CRM_BASE } from '@/api/http';

const PROBE_TIMEOUT_MS = 2000;

const PROBE_URLS = [
  'https://clients3.google.com/generate_204',
  CRM_BASE,
] as const;

async function fetchReachable(url: string, method: 'HEAD' | 'GET'): Promise<boolean> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);

  try {
    const res = await fetch(url, { method, signal: controller.signal });
    return res.status === 204 || res.ok || (res.status > 0 && res.status < 500);
  } catch {
    return false;
  } finally {
    clearTimeout(timeoutId);
  }
}

/** Skutečný reachability test — paralelně CRM + Google 204. */
export async function probeInternetReachability(): Promise<boolean> {
  const results = await Promise.all([
    fetchReachable(PROBE_URLS[0], 'GET'),
    fetchReachable(PROBE_URLS[1], 'HEAD'),
  ]);
  return results.some(Boolean);
}