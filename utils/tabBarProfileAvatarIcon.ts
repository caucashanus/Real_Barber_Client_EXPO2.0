import { PixelRatio, type ImageSourcePropType } from 'react-native';

import { TAB_BAR_AVATAR_SIZE } from '@/components/TabBarProfileAvatar';

const iconCache = new Map<string, ImageSourcePropType>();

export function hashTabBarProfileAvatarUri(uri: string): string {
  let hash = 0;
  for (let i = 0; i < uri.length; i += 1) {
    hash = (hash * 31 + uri.charCodeAt(i)) | 0;
  }
  return Math.abs(hash).toString(36);
}

/** Sized image source for NativeTabs — remote URIs need explicit dimensions on iOS. */
export function createTabBarProfileAvatarIconSource(uri: string): ImageSourcePropType {
  return {
    uri,
    width: TAB_BAR_AVATAR_SIZE,
    height: TAB_BAR_AVATAR_SIZE,
    scale: PixelRatio.get(),
  };
}

export function getCachedTabBarProfileAvatarIcon(uri: string): ImageSourcePropType | undefined {
  return iconCache.get(uri);
}

export function cacheTabBarProfileAvatarIcon(uri: string, fileUri: string): ImageSourcePropType {
  const source = createTabBarProfileAvatarIconSource(fileUri);
  iconCache.set(uri, source);
  return source;
}

export function buildCircularTabBarAvatarHtml(dataUri: string, pixelSize: number): string {
  const radius = pixelSize / 2;

  return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=${pixelSize}, height=${pixelSize}">
</head>
<body style="margin:0;padding:0;background:transparent;">
  <canvas id="c" width="${pixelSize}" height="${pixelSize}"></canvas>
  <script>
    (function () {
      var img = new Image();
      img.onload = function () {
        var canvas = document.getElementById('c');
        var ctx = canvas.getContext('2d');
        ctx.beginPath();
        ctx.arc(${radius}, ${radius}, ${radius}, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        var scale = Math.max(${pixelSize} / img.width, ${pixelSize} / img.height);
        var width = img.width * scale;
        var height = img.height * scale;
        ctx.drawImage(img, (${pixelSize} - width) / 2, (${pixelSize} - height) / 2, width, height);
        window.ReactNativeWebView.postMessage(canvas.toDataURL('image/png'));
      };
      img.onerror = function () {
        window.ReactNativeWebView.postMessage('');
      };
      img.src = ${JSON.stringify(dataUri)};
    })();
  </script>
</body>
</html>`;
}
