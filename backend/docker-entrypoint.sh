#!/bin/sh
set -eu

MAX_RETRIES=30
RETRY_DELAY=2
ATTEMPT=1

echo "[backend] Running Prisma schema sync (db push)..."
until npx prisma db push; do
  if [ "$ATTEMPT" -ge "$MAX_RETRIES" ]; then
    echo "[backend] Prisma sync failed after $MAX_RETRIES attempts."
    exit 1
  fi

  echo "[backend] Database not ready, retrying in ${RETRY_DELAY}s (${ATTEMPT}/${MAX_RETRIES})..."
  ATTEMPT=$((ATTEMPT + 1))
  sleep "$RETRY_DELAY"
done

echo "[backend] Prisma schema synced. Starting server..."
mkdir -p uploads/avatars
exec npm start