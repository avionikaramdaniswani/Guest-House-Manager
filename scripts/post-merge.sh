#!/bin/bash
set -e
pnpm install --frozen-lockfile
pnpm --filter @workspace/db run push
psql $DATABASE_URL -f migrations/001_add_users.sql
psql $DATABASE_URL -f migrations/002_seed_rooms.sql
