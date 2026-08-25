import { Asset } from 'expo-asset';
import { File } from 'expo-file-system';
import { widgetsDirectory } from 'expo-widgets';

const WIDGET_LOGO_FILE_NAME = 'realbarber-dark.png';
const WIDGET_LOGO_ASSET = require('../assets/img/widget/realbarber-dark.png');

let cachedLogoUri: string | null = null;

/** Zkopíruje logo do sdíleného app group kontejneru pro widget. */
export async function ensureWidgetLogoUri(): Promise<string | null> {
  if (cachedLogoUri) return cachedLogoUri;
  if (!widgetsDirectory) return null;

  try {
    const file = new File(widgetsDirectory, WIDGET_LOGO_FILE_NAME);
    if (!file.exists) {
      const asset = await Asset.fromModule(WIDGET_LOGO_ASSET).downloadAsync();
      if (!asset.localUri) return null;
      await new File(asset.localUri).copy(file);
    }
    cachedLogoUri = file.uri;
    return cachedLogoUri;
  } catch (error) {
    if (__DEV__) {
      console.warn('[widget] logo copy failed', error);
    }
    return null;
  }
}
