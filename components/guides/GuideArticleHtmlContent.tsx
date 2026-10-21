import React, { useCallback, useState } from 'react';
import { View } from 'react-native';
import { WebView } from 'react-native-webview';

import { useTheme } from '@/contexts/ThemeContext';

type Props = {
  html: string;
  className?: string;
};

function wrapGuideHtml(body: string, isDark: boolean): string {
  const bg = isDark ? '#0F0F0F' : '#ffffff';
  const text = isDark ? '#f5f5f5' : '#111111';
  const sub = isDark ? '#a1a1a1' : '#64748b';
  return `<!DOCTYPE html>
<html><head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1"/>
<style>
  body { font-family: -apple-system, system-ui, sans-serif; font-size: 16px; line-height: 1.55; margin: 0; padding: 0;
    color: ${text}; background: ${bg}; }
  h2, h3 { font-size: 1.15em; margin: 1.1em 0 0.5em; }
  p, li { margin: 0.65em 0; }
  ul, ol { padding-left: 1.25em; }
  a { color: #FF4F31; }
  img { max-width: 100%; height: auto; border-radius: 8px; }
  strong { font-weight: 600; }
  .muted { color: ${sub}; }
</style></head><body>${body}</body></html>`;
}

const HEIGHT_SCRIPT = `
(function () {
  function post() {
    var h = document.documentElement.scrollHeight || document.body.scrollHeight;
    window.ReactNativeWebView.postMessage(String(h));
  }
  post();
  if (typeof ResizeObserver !== 'undefined') {
    new ResizeObserver(post).observe(document.body);
  } else {
    setTimeout(post, 400);
  }
})();
true;
`;

/** Rich HTML z ArticlePublic.content — výška podle obsahu, scroll řeší rodič. */
export default function GuideArticleHtmlContent({ html, className = '' }: Props) {
  const { isDark } = useTheme();
  const [height, setHeight] = useState(320);

  const onMessage = useCallback((event: { nativeEvent: { data: string } }) => {
    const next = Number.parseInt(event.nativeEvent.data, 10);
    if (Number.isFinite(next) && next > 0) {
      setHeight(Math.min(next + 16, 12000));
    }
  }, []);

  if (!html.trim()) {
    return null;
  }

  return (
    <View className={className} style={{ width: '100%', height }}>
      <WebView
        originWhitelist={['*']}
        source={{ html: wrapGuideHtml(html, isDark) }}
        scrollEnabled={false}
        style={{ flex: 1, backgroundColor: 'transparent' }}
        onMessage={onMessage}
        injectedJavaScript={HEIGHT_SCRIPT}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}
