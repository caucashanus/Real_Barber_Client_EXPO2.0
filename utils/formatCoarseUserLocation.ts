import * as Location from 'expo-location';

/** Hrubá poloha pro home (čtvrť / ulice) — bez GPS souřadnic v UI. */
export async function resolveCoarseUserLocationLabel(
  latitude: number,
  longitude: number
): Promise<string> {
  try {
    const results = await Location.reverseGeocodeAsync({ latitude, longitude });
    const place = results[0];
    if (!place) return '';

    const district = place.district?.trim() || place.subregion?.trim() || '';
    const city = place.city?.trim() || place.region?.trim() || '';
    const street = place.street?.trim() || '';

    if (district && city && district !== city) {
      return `${city} – ${district}`;
    }
    if (street && district) {
      return `${district} – ${street}`;
    }
    if (street && city) {
      return `${city} – ${street}`;
    }
    return district || city || street || place.name?.trim() || '';
  } catch {
    return '';
  }
}
