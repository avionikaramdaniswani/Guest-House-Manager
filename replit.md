# Wisma Eucaliptus PMS

A full Property Management System (PMS) web app for internal staff/receptionist use at Wisma Eucaliptus / Guest House Deluxe.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/wisma run dev` — run the frontend (port 26272)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string, `SESSION_SECRET`

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, Tailwind CSS, shadcn/ui, TanStack Query, Recharts, Wouter
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — source of truth for all API contracts
- `lib/db/src/schema/` — Drizzle ORM table definitions (rooms, guests, bookings, activity_logs, settings)
- `lib/api-client-react/src/generated/` — generated React Query hooks (from codegen)
- `lib/api-zod/src/generated/` — generated Zod schemas (from codegen)
- `artifacts/api-server/src/routes/` — Express route handlers
- `artifacts/wisma/src/pages/` — React page components
- `artifacts/wisma/src/index.css` — theme (navy #0C447C primary, status colors)

## Architecture decisions

- Contract-first: all API shapes defined in OpenAPI, hooks/schemas auto-generated with Orval
- PIN login only (no username) — PIN stored in `settings` table (key="pin"), sessions in-memory Map
- Room status tracked directly on `rooms.status` field, updated on check-in/checkout
- Long-stay Japan vs Local determined by guest nationality at check-in time
- Date fields stored as `string` (YYYY-MM-DD) in DB via Drizzle `mode: "string"`; Zod coerces to Date on input, route handler converts back with `toDateStr()`

## Product

- **Login**: 4-digit PIN pad (default: 1234)
- **Dashboard**: occupancy rate, available rooms, revenue, today's check-ins/checkouts, alerts
- **Floor Plan**: interactive color-coded grid of all 63 rooms (A/C/D/E/G blocks), click any room for details
- **Bookings**: create/view/manage reservations, check-in and check-out with receipt
- **Guests**: guest registry with ID (KTP/Passport), nationality, contact
- **Reports**: daily/monthly revenue charts with Recharts
- **Settings**: change PIN, room management

## Room types

- ★ Single/Double Bed — Rp 220,000/night
- ★★ Family Room — Rp 350,000/night
- ★★★ Long Stay / Big Room — Rp 450,000/night

## Status colors

- Green: available
- Yellow: occupied (regular)
- Blue: long stay Japan
- Orange: long stay local
- Red: blocked
- Gray: facility (lobby, parking, etc.)

## User preferences

_Populate as you build._

## Gotchas

- After changing `lib/db` schema, run `pnpm run typecheck:libs` to rebuild lib declarations before leaf artifact typechecks will pass
- Zod `coerce.date()` (generated for OpenAPI `format: date` fields) produces `Date` objects; Drizzle `mode: "string"` expects string — always use `toDateStr()` helper in route handlers
- Auth token stored in `localStorage` as `"wisma_token"`; custom fetch in `lib/api-client-react` reads it as `Authorization` header

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
