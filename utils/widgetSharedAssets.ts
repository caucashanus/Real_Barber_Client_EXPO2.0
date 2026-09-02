import { Asset } from 'expo-asset';
import { File } from 'expo-file-system';
import { widgetsDirectory } from 'expo-widgets';

const WIDGET_LOGO_FILE_NAME = 'realbarber-dark.png';
const WIDGET_LOGO_ASSET = require('../assets/img/widget/realbarber-dark.png');
const LIVE_ACTIVITY_LOGO_FILE_NAME = 'realbarber-live-activity.png';
const LIVE_ACTIVITY_LOGO_ASSET = require('../assets/img/widget/realbarber-live-activity.png');

let cachedLogoUri: string | null = null;
let cachedLiveActivityLogoUri: string | null = null;

async function copyWidgetAsset(fileName: string, assetModule: number): Promise<string | null> {
  if (!widgetsDirectory) return null;

  const file = new File(widgetsDirectory, fileName);
  if (!file.exists) {
    const asset = await Asset.fromModule(assetModule).downloadAsync();
    if (!asset.localUri) return null;
    await new File(asset.localUri).copy(file);
  }
  return file.uri;
}

/** Zkopíruje logo do sdíleného app group kontejneru pro widget. */
export async function ensureWidgetLogoUri(): Promise<string | null> {
  if (cachedLogoUri) return cachedLogoUri;

  try {
    cachedLogoUri = await copyWidgetAsset(WIDGET_LOGO_FILE_NAME, WIDGET_LOGO_ASSET);
    return cachedLogoUri;
  } catch (error) {
    if (__DEV__) {
      console.warn('[widget] logo copy failed', error);
    }
    return null;
  }
}

/**
 * Logo pro Live Activity / Dynamic Island — 70×62 RGBA (stejný formát jako expo/examples logo.png).
 */
export async function ensureLiveActivityLogoUri(): Promise<string | null> {
  if (cachedLiveActivityLogoUri) return cachedLiveActivityLogoUri;

  try {
    cachedLiveActivityLogoUri = await copyWidgetAsset(
      LIVE_ACTIVITY_LOGO_FILE_NAME,
      LIVE_ACTIVITY_LOGO_ASSET
    );
    return cachedLiveActivityLogoUri;
  } catch (error) {
    if (__DEV__) {
      console.warn('[widget] live activity logo copy failed', error);
    }
    return null;
  }
}
