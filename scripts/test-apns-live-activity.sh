#!/usr/bin/env bash
set -euo pipefail

# ──────────────────────────────────────────────────────────────
# Local APNs Live Activity tester
#
# Usage:
#   1. Start a Live Activity from the Dev screen in the app
#   2. Copy the push token displayed on screen
#   3. Run:  ./scripts/test-apns-live-activity.sh <scenario>
#
# Scenarios:  update | active | reschedule | cancel | review | end
# ──────────────────────────────────────────────────────────────

# ── Config – fill in before first run ──
TEAM_ID="${TEAM_ID:-VK8YT9654D}"
AUTH_KEY_ID="${AUTH_KEY_ID:-YOUR_KEY_ID}"
TOKEN_KEY_FILE="${TOKEN_KEY_FILE:-$HOME/.apns/AuthKey.p8}"
BUNDLE_ID="com.realbarber.client"
APNS_HOST="${APNS_HOST:-api.sandbox.push.apple.com}"
PUSH_TOKEN="${PUSH_TOKEN:-}"

TOPIC="${BUNDLE_ID}.push-type.liveactivity"
TIMESTAMP=$(date +%s)

# ── Args ──
SCENARIO="${1:-update}"

if [[ -z "$PUSH_TOKEN" ]]; then
  echo "❌  Set PUSH_TOKEN env var first."
  echo "    PUSH_TOKEN=abc123... ./scripts/test-apns-live-activity.sh $SCENARIO"
  exit 1
fi

if [[ ! -f "$TOKEN_KEY_FILE" ]]; then
  echo "❌  APNs auth key not found at: $TOKEN_KEY_FILE"
  echo "    Download from https://developer.apple.com/account/resources/authkeys"
  echo "    Set TOKEN_KEY_FILE=/path/to/AuthKey_XXXX.p8"
  exit 1
fi

# ── JWT generation ──
JWT_HEADER=$(printf '{"alg":"ES256","kid":"%s"}' "$AUTH_KEY_ID" | openssl base64 -e -A | tr -- '+/' '-_' | tr -d =)
JWT_CLAIMS=$(printf '{"iss":"%s","iat":%d}' "$TEAM_ID" "$TIMESTAMP" | openssl base64 -e -A | tr -- '+/' '-_' | tr -d =)
JWT_HEADER_CLAIMS="${JWT_HEADER}.${JWT_CLAIMS}"
JWT_SIGNED=$(printf "%s" "$JWT_HEADER_CLAIMS" | openssl dgst -binary -sha256 -sign "$TOKEN_KEY_FILE" | openssl base64 -e -A | tr -- '+/' '-_' | tr -d =)
AUTH_TOKEN="${JWT_HEADER}.${JWT_CLAIMS}.${JWT_SIGNED}"

# ── Time helpers ──
now_plus_min() {
  date -v+"${1}"M -u +"%Y-%m-%dT%H:%M:%S.000Z" 2>/dev/null \
    || date -u -d "+${1} minutes" +"%Y-%m-%dT%H:%M:%S.000Z"
}
now_minus_min() {
  date -v-"${1}"M -u +"%Y-%m-%dT%H:%M:%S.000Z" 2>/dev/null \
    || date -u -d "-${1} minutes" +"%Y-%m-%dT%H:%M:%S.000Z"
}

# ── Payloads ──
case "$SCENARIO" in

  update)
    START_AT=$(now_plus_min 25)
    END_AT=$(now_plus_min 70)
    PAYLOAD=$(cat <<EOF
{
  "aps": {
    "timestamp": $TIMESTAMP,
    "event": "update",
    "content-state": {
      "phase": "scheduled",
      "presentation": "normal",
      "labelText": "Začátek za",
      "headlineText": null,
      "detailText": null,
      "startAt": "$START_AT",
      "endAt": "$END_AT",
      "branchName": "Real Barber Smíchov",
      "timeRangeText": "14:00 – 14:45",
      "employeeName": "Jan Novák",
      "employeeAvatarUrl": "https://randomuser.me/api/portraits/men/32.jpg",
      "accentHex": "#C8A258",
      "priceFormatted": "850 Kč"
    },
    "alert": {
      "title": "Vaše rezervace se blíží",
      "body": "Za 25 minut – Jan Novák"
    }
  }
}
EOF
)
    ;;

  active)
    START_AT=$(now_minus_min 5)
    END_AT=$(now_plus_min 40)
    PAYLOAD=$(cat <<EOF
{
  "aps": {
    "timestamp": $TIMESTAMP,
    "event": "update",
    "content-state": {
      "phase": "active",
      "presentation": "normal",
      "labelText": "Právě probíhá",
      "headlineText": null,
      "detailText": null,
      "startAt": "$START_AT",
      "endAt": "$END_AT",
      "branchName": "Real Barber Smíchov",
      "timeRangeText": "13:55 – 14:40",
      "employeeName": "Jan Novák",
      "employeeAvatarUrl": "https://randomuser.me/api/portraits/men/32.jpg",
      "accentHex": "#C8A258",
      "priceFormatted": "850 Kč"
    }
  }
}
EOF
)
    ;;

  reschedule)
    START_AT=$(now_plus_min 60)
    END_AT=$(now_plus_min 105)
    PAYLOAD=$(cat <<EOF
{
  "aps": {
    "timestamp": $TIMESTAMP,
    "event": "update",
    "content-state": {
      "phase": "scheduled",
      "presentation": "rescheduled",
      "labelText": "Rezervace přesunuta",
      "headlineText": "Změna termínu",
      "detailText": "Klepněte pro detail",
      "startAt": "$START_AT",
      "endAt": "$END_AT",
      "branchName": "Real Barber Smíchov",
      "timeRangeText": "15:00 – 15:45",
      "employeeName": "Jan Novák",
      "accentHex": "#C8A258"
    },
    "alert": {
      "title": "Rezervace přesunuta",
      "body": "Nový čas: 15:00 – Jan Novák"
    }
  }
}
EOF
)
    ;;

  cancel)
    START_AT=$(now_plus_min 30)
    END_AT=$(now_plus_min 75)
    PAYLOAD=$(cat <<EOF
{
  "aps": {
    "timestamp": $TIMESTAMP,
    "event": "update",
    "content-state": {
      "phase": "finished",
      "presentation": "cancelled",
      "labelText": "Rezervace zrušena",
      "headlineText": "Zrušeno",
      "detailText": "Klepněte pro detail rezervace",
      "startAt": "$START_AT",
      "endAt": "$END_AT",
      "branchName": "Real Barber Smíchov",
      "timeRangeText": "14:30 – 15:15",
      "employeeName": "Jan Novák",
      "accentHex": "#C8A258"
    },
    "alert": {
      "title": "Rezervace zrušena",
      "body": "14:30 – Jan Novák byla zrušena"
    }
  }
}
EOF
)
    ;;

  review)
    START_AT=$(now_minus_min 60)
    END_AT=$(now_minus_min 15)
    PAYLOAD=$(cat <<EOF
{
  "aps": {
    "timestamp": $TIMESTAMP,
    "event": "update",
    "content-state": {
      "phase": "finished",
      "presentation": "review",
      "labelText": "Ohodnoťte návštěvu",
      "headlineText": "Děkujeme!",
      "detailText": "Klepněte pro hodnocení",
      "startAt": "$START_AT",
      "endAt": "$END_AT",
      "branchName": "Real Barber Smíchov",
      "timeRangeText": "13:00 – 13:45",
      "employeeName": "Jan Novák",
      "employeeAvatarUrl": "https://randomuser.me/api/portraits/men/32.jpg",
      "accentHex": "#C8A258"
    },
    "alert": {
      "title": "Jak to bylo?",
      "body": "Ohodnoťte svou návštěvu u Jana Nováka"
    }
  }
}
EOF
)
    ;;

  end)
    START_AT=$(now_minus_min 60)
    END_AT=$(now_minus_min 15)
    PAYLOAD=$(cat <<EOF
{
  "aps": {
    "timestamp": $TIMESTAMP,
    "event": "end",
    "dismissal-date": $TIMESTAMP,
    "content-state": {
      "phase": "finished",
      "presentation": "normal",
      "startAt": "$START_AT",
      "endAt": "$END_AT",
      "branchName": "Real Barber Smíchov",
      "timeRangeText": "13:00 – 13:45",
      "employeeName": "Jan Novák"
    }
  }
}
EOF
)
    ;;

  *)
    echo "Unknown scenario: $SCENARIO"
    echo "Available: update | active | reschedule | cancel | review | end"
    exit 1
    ;;
esac

echo "═══════════════════════════════════════════════════"
echo "  Scenario:  $SCENARIO"
echo "  Topic:     $TOPIC"
echo "  Host:      $APNS_HOST"
echo "  Token:     ${PUSH_TOKEN:0:20}..."
echo "═══════════════════════════════════════════════════"
echo ""
echo "$PAYLOAD" | python3 -m json.tool 2>/dev/null || echo "$PAYLOAD"
echo ""

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
  --header "apns-topic: $TOPIC" \
  --header "apns-push-type: liveactivity" \
  --header "apns-priority: 10" \
  --header "authorization: bearer $AUTH_TOKEN" \
  --data "$PAYLOAD" \
  --http2 "https://${APNS_HOST}/3/device/${PUSH_TOKEN}")

if [[ "$HTTP_CODE" == "200" ]]; then
  echo "✅  APNs responded $HTTP_CODE – push delivered!"
else
  echo "❌  APNs responded $HTTP_CODE"
  echo ""
  echo "Full response:"
  curl -v \
    --header "apns-topic: $TOPIC" \
    --header "apns-push-type: liveactivity" \
    --header "apns-priority: 10" \
    --header "authorization: bearer $AUTH_TOKEN" \
    --data "$PAYLOAD" \
    --http2 "https://${APNS_HOST}/3/device/${PUSH_TOKEN}" 2>&1
fi
