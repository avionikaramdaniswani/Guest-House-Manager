#!/bin/bash
set -e
pnpm install --frozen-lockfile
pnpm --filter @workspace/db run push

# Seed only on a fresh database (no users or rooms yet).
# No error suppression — failures abort under set -e.
USER_COUNT=$(psql -v ON_ERROR_STOP=1 "$DATABASE_URL" -tAc "SELECT COUNT(*) FROM users")
if [ "$USER_COUNT" = "0" ]; then
  psql -v ON_ERROR_STOP=1 "$DATABASE_URL" -f migrations/001_add_users.sql
fi

ROOM_COUNT=$(psql -v ON_ERROR_STOP=1 "$DATABASE_URL" -tAc "SELECT COUNT(*) FROM rooms")
if [ "$ROOM_COUNT" = "0" ]; then
  psql -v ON_ERROR_STOP=1 "$DATABASE_URL" -f migrations/002_seed_rooms.sql
fi
