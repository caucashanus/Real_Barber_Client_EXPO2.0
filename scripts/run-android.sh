#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

resolve_java_home() {
  if [[ -n "${JAVA_HOME:-}" ]]; then
    local major
    major="$("$JAVA_HOME/bin/java" -version 2>&1 | head -1 | sed -E 's/.* version "([0-9]+).*/\1/')"
    if [[ "$major" -le 21 ]]; then
      return 0
    fi
    echo "run-android: JAVA_HOME is Java $major — Android build needs JDK 17–21 (Gradle/CMake)." >&2
  fi

  if command -v /usr/libexec/java_home >/dev/null 2>&1; then
    for version in 17 21; do
      if JAVA_HOME="$(/usr/libexec/java_home -v "$version" 2>/dev/null)"; then
        export JAVA_HOME
        return 0
      fi
    done
  fi

  for candidate in \
    /Library/Java/JavaVirtualMachines/temurin-17.jdk/Contents/Home \
    /opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home; do
    if [[ -x "$candidate/bin/java" ]]; then
      export JAVA_HOME="$candidate"
      return 0
    fi
  done

  echo "run-android: Install JDK 17 (Temurin) and retry." >&2
  exit 1
}

resolve_java_home
echo "run-android: using JAVA_HOME=$JAVA_HOME"
cd "$ROOT"
exec npx expo run:android "$@"
