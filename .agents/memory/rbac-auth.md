---
name: RBAC Auth System
description: Email+password login with role-based access control (viewer/operator/admin)
---

## Auth system overview

Replaced PIN login with email+password + RBAC.

## Backend

- `artifacts/api-server/src/routes/auth.ts` — login/logout/verify endpoints + `requireAuth` + `requireRole(...roles)` middleware exported
- Sessions stored in in-memory Map (same as before), now stores `SessionUser {id, email, name, role}`
- Passwords hashed with `bcryptjs` (cost 10); installed in api-server as direct dep
- DB: `users` table (`lib/db/src/schema/users.ts`) with `user_role` pgEnum

## Frontend

- `artifacts/wisma/src/contexts/auth-context.tsx` — `AuthProvider`, `useAuth()`, `canAccess(roles[])`
- `artifacts/wisma/src/lib/auth.ts` — token + user stored in localStorage (`wisma_token`, `wisma_user`)
- `AuthProvider` wraps entire app in `App.tsx`
- `ProtectedRoute` checks `isAuthenticated` + `canAccess(routeRoles[path])`

## Role → menu access

| Route | viewer | operator | admin |
|---|---|---|---|
| Dashboard | ✓ | ✓ | ✓ |
| Denah Lantai | ✓ | ✓ | ✓ |
| Pemesanan | — | ✓ | ✓ |
| Tamu | — | ✓ | ✓ |
| Laporan | ✓ | — | ✓ |
| Pengaturan | — | — | ✓ |

## Default users (seeded)

| Email | Password | Role |
|---|---|---|
| admin@wisma.id | admin123 | admin |
| operator@wisma.id | operator123 | operator |
| viewer@wisma.id | viewer123 | viewer |

**Why:** PIN was single-user; hotel needs multi-staff with different access levels.

## Migration file

`migrations/001_add_users.sql` — creates users table + pgEnum + seeds default users. Run with `psql $DATABASE_URL -f migrations/001_add_users.sql`.
