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

router.get("/rooms", async (_req, res): Promise<void> => {
  const rooms = await db.select().from(roomsTable).orderBy(asc(roomsTable.number));
  res.json(GetRoomsResponse.parse(rooms.map(r => ({
    id: r.id,
    number: r.number,
    block: r.block,
    type: r.type,
    stars: r.stars,
    price_per_night: r.pricePerNight,
    status: r.status,
    notes: r.notes,
    is_facility: r.isFacility,
  }))));
});

router.get("/rooms/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetRoomParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid room ID" });
    return;
  }

  const [room] = await db.select().from(roomsTable).where(eq(roomsTable.id, params.data.id));
  if (!room) {
    res.status(404).json({ error: "Kamar tidak ditemukan" });
    return;
  }

  // Get current active booking
  const [booking] = await db
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
      pricePerNight: bookingsTable.pricePerNight,
      totalAmount: bookingsTable.totalAmount,
      deposit: bookingsTable.deposit,
      paymentMethod: bookingsTable.paymentMethod,
      notes: bookingsTable.notes,
      createdAt: bookingsTable.createdAt,
      guestName: guestsTable.name,
      guestNationality: guestsTable.nationality,
    })
    .from(bookingsTable)
    .leftJoin(guestsTable, eq(bookingsTable.guestId, guestsTable.id))
    .where(eq(bookingsTable.roomId, params.data.id))
    .orderBy(asc(bookingsTable.createdAt))
    .limit(1)
    .then(rows => rows.filter(r => r.status === "checked_in" || r.status === "reserved"));

  const currentBooking = booking
    ? {
        id: booking.id,
        room_id: booking.roomId,
        room_number: room.number,
        guest_id: booking.guestId,
        guest_name: booking.guestName ?? "",
        guest_nationality: booking.guestNationality ?? "",
        check_in_date: booking.checkInDate,
        check_out_date: booking.checkOutDate,
        actual_check_in: booking.actualCheckIn?.toISOString() ?? null,
        actual_check_out: booking.actualCheckOut?.toISOString() ?? null,
        status: booking.status,
        stay_type: booking.stayType,
        price_per_night: booking.pricePerNight,
        total_amount: booking.totalAmount ?? null,
        deposit: booking.deposit ?? null,
        payment_method: booking.paymentMethod ?? null,
        notes: booking.notes ?? null,
        created_at: booking.createdAt.toISOString(),
      }
    : null;

  res.json(GetRoomResponse.parse({
    id: room.id,
    number: room.number,
    block: room.block,
    type: room.type,
    stars: room.stars,
    price_per_night: room.pricePerNight,
    status: room.status,
    notes: room.notes,
    is_facility: room.isFacility,
    current_booking: currentBooking,
  }));
});

router.patch("/rooms/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = UpdateRoomParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid room ID" });
    return;
  }

  const parsed = UpdateRoomBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updates: Record<string, unknown> = {};
  if (parsed.data.notes !== undefined) updates.notes = parsed.data.notes;
  if (parsed.data.status !== undefined) updates.status = parsed.data.status;
  updates.updatedAt = new Date();

  const [room] = await db
    .update(roomsTable)
    .set(updates)
    .where(eq(roomsTable.id, params.data.id))
    .returning();

  if (!room) {
    res.status(404).json({ error: "Kamar tidak ditemukan" });
    return;
  }

  res.json(UpdateRoomResponse.parse({
    id: room.id,
    number: room.number,
    block: room.block,
    type: room.type,
    stars: room.stars,
    price_per_night: room.pricePerNight,
    status: room.status,
    notes: room.notes,
    is_facility: room.isFacility,
  }));
});

export default router;
