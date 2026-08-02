#!/bin/bash
set -e
pnpm install --frozen-lockfile
pnpm --filter @workspace/db run push

# Seed only on a fresh database (no users or rooms yet).
# Using ON_ERROR_STOP=1 so any SQL error aborts rather than being silently swallowed.
USER_COUNT=$(psql "$DATABASE_URL" -tAc "SELECT COUNT(*) FROM users" 2>/dev/null || echo "0")
if [ "$USER_COUNT" = "0" ]; then
  psql -v ON_ERROR_STOP=1 "$DATABASE_URL" -f migrations/001_add_users.sql
fi

ROOM_COUNT=$(psql "$DATABASE_URL" -tAc "SELECT COUNT(*) FROM rooms" 2>/dev/null || echo "0")
if [ "$ROOM_COUNT" = "0" ]; then
  psql -v ON_ERROR_STOP=1 "$DATABASE_URL" -f migrations/002_seed_rooms.sql
fi
