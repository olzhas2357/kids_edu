#!/usr/bin/env sh
# Validates required production variables before deploy.
set -eu

ENV_FILE="${1:-.env}"

if [ ! -f "$ENV_FILE" ]; then
  echo "Missing env file: $ENV_FILE" >&2
  exit 1
fi

# shellcheck disable=SC1090
. "$ENV_FILE"

fail() {
  echo "validate-env: $1" >&2
  exit 1
}

[ -n "${POSTGRES_PASSWORD:-}" ] || fail "POSTGRES_PASSWORD is required"
[ -n "${JWT_ACCESS_SECRET:-}" ] || fail "JWT_ACCESS_SECRET is required"
[ -n "${JWT_REFRESH_SECRET:-}" ] || fail "JWT_REFRESH_SECRET is required"

case "${JWT_ACCESS_SECRET}" in
  *change-me*) fail "JWT_ACCESS_SECRET must not contain change-me" ;;
esac

if [ "${AI_ENABLED:-true}" != "false" ] && [ -z "${OPENAI_API_KEY:-}" ]; then
  fail "OPENAI_API_KEY is required when AI_ENABLED is not false"
fi

echo "validate-env: OK ($ENV_FILE)"
