import { Redirect, useLocalSearchParams } from 'expo-router';

/** Legacy route — push notifikace a staré deep linky stále míří na `/screens/trip-detail`. */
export default function TripDetailLegacyRedirect() {
  const params = useLocalSearchParams<Record<string, string | string[]>>();
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value == null) continue;
    if (Array.isArray(value)) {
      for (const v of value) query.append(key, v);
    } else {
      query.set(key, value);
    }
  }
  const suffix = query.toString();
  return (
    <Redirect href={suffix ? `/screens/booking-detail?${suffix}` : '/screens/booking-detail'} />
  );
}
