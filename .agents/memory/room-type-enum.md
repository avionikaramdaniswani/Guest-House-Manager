---
name: Room type enum
description: Correct enum values for the rooms.type column as enforced by Zod schema
---

The Zod schema in `lib/api-zod` enforces: `type: zod.enum(['single', 'double', 'family'])`.

Mapping:
- `single` = 1 star (★) — double bed, 1-2 person
- `family` = 2 stars (★★) — family room, 1-3 person
- `double` = 3 stars (★★★) — longstay / big room

**Why:** Previously used 'standard' and 'longstay' which caused ZodError 500 on GET /api/rooms.
**How to apply:** Any SQL seed or INSERT must use these three values only.
