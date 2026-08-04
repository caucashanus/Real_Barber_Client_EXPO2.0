#!/usr/bin/env bash
# Vytáhne SHA-256 fingerprint pro Android App Links (assetlinks.json).
#
# Použití:
#   1) Z keystore staženého z EAS:
#      ./scripts/android-app-link-sha256.sh ~/Downloads/@adamkratky7120__realbarber.jks
#
#   2) Z AAB/APK (podpis, kterým je appka skutečně podepsaná):
#      ./scripts/android-app-link-sha256.sh ./app-release.aab
#
# Výstup: řádek ve formátu AA:BB:CC:… pro env webu:
#   ANDROID_APP_LINK_SHA256="AA:BB:CC:..."

set -euo pipefail

FILE="${1:-}"
ALIAS="${2:-}"
KEYSTORE_PASS="${KEYSTORE_PASSWORD:-}"

if [[ -z "$FILE" || ! -f "$FILE" ]]; then
  echo "Použití: $0 <keystore.jks|apk|aab> [key-alias]" >&2
  echo "" >&2
  echo "Nejdřív získejte fingerprint jedním z těchto způsobů:" >&2
  echo "  A) Google Play Console (doporučeno pro produkci z obchodu)" >&2
  echo "  B) npx eas credentials -p android  → production → Keystore" >&2
  echo "  C) Stáhnout .jks z EAS a spustit tento skript" >&2
  exit 1
fi

if ! command -v keytool >/dev/null 2>&1; then
  echo "Chybí keytool (součást JDK). Nainstalujte Java / Android Studio." >&2
  exit 1
fi

ext="${FILE##*.}"
ext_lower=$(echo "$ext" | tr '[:upper:]' '[:lower:]')

echo "Soubor: $FILE"
echo ""

if [[ "$ext_lower" == "apk" || "$ext_lower" == "aab" ]]; then
  echo "=== SHA-256 z APK/AAB (skutečný podpis nainstalované appky) ==="
  keytool -printcert -jarfile "$FILE" 2>/dev/null | rg -i "SHA256|SHA-256" || keytool -printcert -jarfile "$FILE"
  exit 0
fi

echo "=== SHA-256 z keystore ==="
if [[ -n "$KEYSTORE_PASS" ]]; then
  if [[ -n "$ALIAS" ]]; then
    keytool -list -v -keystore "$FILE" -alias "$ALIAS" -storepass "$KEYSTORE_PASS" 2>/dev/null | rg -i "SHA256|SHA-256|Alias name"
  else
    keytool -list -v -keystore "$FILE" -storepass "$KEYSTORE_PASS" 2>/dev/null | rg -i "SHA256|SHA-256|Alias name"
  fi
else
  echo "(keytool se zeptá na heslo keystore — heslo najdete v: eas credentials -p android)"
  if [[ -n "$ALIAS" ]]; then
    keytool -list -v -keystore "$FILE" -alias "$ALIAS" | rg -i "SHA256|SHA-256|Alias name"
  else
    keytool -list -v -keystore "$FILE" | rg -i "SHA256|SHA-256|Alias name"
  fi
fi

echo ""
echo "--- Pro web tým (Vercel env) ---"
echo 'ANDROID_APP_LINK_SHA256="<zkopírujte SHA256 výše, formát AA:BB:CC:...>"'
