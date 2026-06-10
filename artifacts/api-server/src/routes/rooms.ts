import { Router, type IRouter } from "express";
import { eq, asc } from "drizzle-orm";
import { db, roomsTable, guestsTable, bookingsTable } from "@workspace/db";
import {
  GetRoomsResponse,
  GetRoomResponse,
  GetRoomParams,
  UpdateRoomParams,
  UpdateRoomBody,
  UpdateRoomResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

function roomShape(r: typeof roomsTable.$inferSelect) {
  return {
    id: r.id,
    number: r.number,
    block: r.block,
    type: r.type,
    stars: r.stars,
    room_name: r.roomName ?? null,
    status: r.status,
    notes: r.notes ?? null,
    is_facility: r.isFacility,
  };
}

router.get("/rooms", async (_req, res): Promise<void> => {
  const rooms = await db.select().from(roomsTable).orderBy(asc(roomsTable.number));
  res.json(GetRoomsResponse.parse(rooms.map(roomShape)));
});

router.get("/rooms/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetRoomParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) { res.status(400).json({ error: "Invalid room ID" }); return; }

  const [room] = await db.select().from(roomsTable).where(eq(roomsTable.id, params.data.id));
  if (!room) { res.status(404).json({ error: "Kamar tidak ditemukan" }); return; }

  // Get current active booking
  const rows = await db
    .select({
      id: bookingsTable.id,
      roomId: bookingsTable.roomId,
      guestId: bookingsTable.guestId,
      checkInDate: bookingsTable.checkInDate,
      checkOutDate: bookingsTable.checkOutDate,
      actualCheckIn: bookingsTable.actualCheckIn,
      actualCheckOut: bookingsTable.actualCheckOut,
      status: bookingsTable.status,
      stayType: bookingsTable.stayType,
      occupiedPersons: bookingsTable.occupiedPersons,
      notes: bookingsTable.notes,
      createdAt: bookingsTable.createdAt,
      guestName: guestsTable.name,
      guestCompany: guestsTable.company,
    })
    .from(bookingsTable)
    .leftJoin(guestsTable, eq(bookingsTable.guestId, guestsTable.id))
    .where(eq(bookingsTable.roomId, params.data.id))
    .orderBy(asc(bookingsTable.createdAt));

  const booking = rows.find(r => r.status === "checked_in" || r.status === "reserved") ?? null;

  const currentBooking = booking ? {
    id: booking.id,
    room_id: booking.roomId,
    room_number: room.number,
    guest_id: booking.guestId,
    guest_name: booking.guestName ?? "",
    guest_company: booking.guestCompany ?? null,
    check_in_date: booking.checkInDate,
    check_out_date: booking.checkOutDate,
    actual_check_in: booking.actualCheckIn?.toISOString() ?? null,
    actual_check_out: booking.actualCheckOut?.toISOString() ?? null,
    status: booking.status,
    stay_type: booking.stayType,
    occupied_persons: booking.occupiedPersons,
    notes: booking.notes ?? null,
    created_at: booking.createdAt.toISOString(),
  } : null;

  res.json(GetRoomResponse.parse({ ...roomShape(room), current_booking: currentBooking }));
});

router.patch("/rooms/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = UpdateRoomParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) { res.status(400).json({ error: "Invalid room ID" }); return; }

  const parsed = UpdateRoomBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (parsed.data.notes !== undefined) updates.notes = parsed.data.notes;
  if (parsed.data.status !== undefined) updates.status = parsed.data.status;

  const [room] = await db.update(roomsTable).set(updates).where(eq(roomsTable.id, params.data.id)).returning();
  if (!room) { res.status(404).json({ error: "Kamar tidak ditemukan" }); return; }

  res.json(UpdateRoomResponse.parse(roomShape(room)));
});

export default router;
