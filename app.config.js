/**
 * Dynamická konfigurace Expo – doplní Google Maps API klíč pro Android (react-native-maps).
 * Bez něj MapView na Androidu často spadne při startu.
 *
 * Lokálně: v kořeni projektu vytvoř `.env` s řádkem
 *   GOOGLE_MAPS_ANDROID_API_KEY=tvůj_klíč
 * (v Google Cloud Console: Maps SDK for Android zapnuté, klíč může být omezený na balíček com.realbarber.client)
 *
 * EAS build: `eas env:create --name GOOGLE_MAPS_ANDROID_API_KEY --value ...` (production)
 */
module.exports = ({ config }) => {
  const apiKey = process.env.GOOGLE_MAPS_ANDROID_API_KEY ?? '';
  if (process.env.EAS_BUILD === 'true' && !apiKey) {
    console.warn(
      '[expo] GOOGLE_MAPS_ANDROID_API_KEY není nastavený — MapView na Androidu pravděpodobně spadne. Nastav secret v EAS nebo proměnnou v eas.json → env.'
    );
  }
  return {
    ...config,
    android: {
      ...config.android,
      config: {
        ...config.android?.config,
        googleMaps: {
          apiKey,
        },
      },
    },
  };
};
