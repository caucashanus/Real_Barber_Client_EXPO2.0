import { Asset } from 'expo-asset';
import { File } from 'expo-file-system';
import { widgetsDirectory } from 'expo-widgets';

const WIDGET_LOGO_FILE_NAME = 'realbarber-dark.png';
const WIDGET_LOGO_ASSET = require('../assets/img/widget/realbarber-dark.png');
/** 70×62 — stejný formát jako expo/examples/assets/images/logo.png (viditelné v Dynamic Island). */
const LIVE_ACTIVITY_LOGO_FILE_NAME = 'logo.png';
const LIVE_ACTIVITY_LOGO_ASSET = require('../assets/img/widget/realbarber-live-activity.png');

let cachedWidgetLogoUri: string | null = null;
let cachedLiveActivityLogoUri: string | null = null;

/**
 * Zkopíruje logo do sdíleného app group kontejneru (`widgetsDirectory`).
 * Stejný pattern jako expo/examples/with-widgets — widget i Live Activity čtou soubor přes `uiImage`.
 */
async function copyWidgetAsset(
  fileName: string,
  assetModule: number,
  overwrite = false
): Promise<string | null> {
  if (!widgetsDirectory) return null;

  const file = new File(widgetsDirectory, fileName);
  if (overwrite || !file.exists) {
    const asset = await Asset.fromModule(assetModule).downloadAsync();
    if (!asset.localUri) return null;
    await new File(asset.localUri).copy(file);
  }
  return file.uri;
}

/** Logo pro home screen widget (větší, 500×500). */
export async function ensureWidgetLogoUri(): Promise<string | null> {
  if (cachedWidgetLogoUri) return cachedWidgetLogoUri;

  try {
    cachedWidgetLogoUri = await copyWidgetAsset(WIDGET_LOGO_FILE_NAME, WIDGET_LOGO_ASSET);
    return cachedWidgetLogoUri;
  } catch (error) {
    if (__DEV__) {
      console.warn('[widget] logo copy failed', error);
    }
    return null;
  }
}

/**
 * Logo pro Live Activity — 70×62 `logo.png` jako v expo delivery example.
 * Kompaktní soubor je viditelný v Dynamic Island; velké dark PNG (500×500) v DI mizí.
 */
export async function ensureLiveActivityLogoUri(): Promise<string | null> {
  if (cachedLiveActivityLogoUri) return cachedLiveActivityLogoUri;

  try {
    const uri = await copyWidgetAsset(
      LIVE_ACTIVITY_LOGO_FILE_NAME,
      LIVE_ACTIVITY_LOGO_ASSET,
      true
    );
    if (uri) {
      cachedLiveActivityLogoUri = uri;
      return uri;
    }
  } catch (error) {
    if (__DEV__) {
      console.warn('[widget] live activity logo copy failed', error);
    }
  }

  // Fallback — stejná URI jako home widget, LA musí fungovat i bez kompaktního loga.
  return ensureWidgetLogoUri();
}
