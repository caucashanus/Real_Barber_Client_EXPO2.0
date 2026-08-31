import type { Locale } from '@/contexts/LanguageContext';

type CustomerAiWidgetLocale = 'cs' | 'en' | 'ru';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function mapAppLocaleToCustomerAi(locale: Locale): CustomerAiWidgetLocale {
  if (locale === 'uk') return 'ru';
  return locale;
}

export function buildCustomerAiWidgetHtml(options: {
  publicKey: string;
  widgetSrc: string;
  locale: Locale;
}): string {
  const publicKey = escapeHtml(options.publicKey);
  const widgetSrc = escapeHtml(options.widgetSrc);
  const locale = mapAppLocaleToCustomerAi(options.locale);

  return `<!DOCTYPE html>
<html lang="${locale}">
  <head>
    <meta charset="utf-8" />
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover"
    />
    <style>
      html, body {
        margin: 0;
        padding: 0;
        width: 100%;
        height: 100%;
        background: #ffffff;
        overflow: hidden;
      }
    </style>
    <script>
      window.customerai = window.customerai || function () {
        (window.customerai.q ||= []).push(arguments);
      };
      window.customerai('init', { locale: '${locale}' });
    </script>
  </head>
  <body>
    <script async src="${widgetSrc}" data-key="${publicKey}"></script>
    <script>
      (function () {
        var attempts = 0;
        var timer = setInterval(function () {
          attempts += 1;
          if (window.customerai) {
            try { window.customerai('open'); } catch (e) {}
            clearInterval(timer);
          }
          if (attempts > 80) clearInterval(timer);
        }, 100);
      })();
    </script>
  </body>
</html>`;
}
