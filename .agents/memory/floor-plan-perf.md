---
name: Floor plan performance & click fix
description: Why floor plan cells must be defined outside the parent component
---

Sub-components defined INSIDE a React function component get a new function reference on every render.
React treats them as entirely new component types → unmounts and remounts every cell on every render.
This breaks click handlers (closures capture stale data) and causes severe performance lag (~50 cells).

**Why:** RoomCell, FacilityCell, CorridorV, CorridorH, LobbyBlock must be defined at module scope.

**How to apply:**
- Pass `room` data as props, not via closure.
- Use `useMemo` to build a `Map<string, Room>` for O(1) lookup instead of `.find()`.
- Add `useEffect(() => { refetch(); }, [])` to force fresh data on mount (avoids stale TanStack Query cache).
