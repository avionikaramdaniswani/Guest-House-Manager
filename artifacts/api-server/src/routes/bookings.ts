import { Router, type IRouter } from "express";
import { eq, and, desc } from "drizzle-orm";
import { db, bookingsTable, guestsTable, roomsTable, activityLogsTable } from "@workspace/db";
import {
  GetBookingsResponse,
  GetBookingResponse,
  GetBookingParams,
  UpdateBookingParams,
  UpdateBookingBody,
  UpdateBookingResponse,
  DeleteBookingParams,
  CreateBookingBody,
  CheckInParams,
  CheckInBody,
  CheckInResponse,
  CheckOutParams,
  CheckOutBody,
  CheckOutResponse,
  DirectCheckInBody,
  DirectCheckInResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

function toDateStr(d: Date | string): string {
  if (typeof d === "string") return d;
  return d.toISOString().split("T")[0];
}

// Map stay_type directly to room status
function roomStatusFor(stayType: string): string {
  if (stayType === "long_stay_japan") return "long_stay_japan";
  if (stayType === "long_stay_local") return "long_stay_local";
  return "occupied_regular";
}

async function bookingWithDetails(b: typeof bookingsTable.$inferSelect) {
  const [guest] = await db.select().from(guestsTable).where(eq(guestsTable.id, b.guestId));
  const [room]  = await db.select().from(roomsTable).where(eq(roomsTable.id, b.roomId));
  return {
    id: b.id,
    room_id: b.roomId,
    room_number: room?.number ?? "",
    guest_id: b.guestId,
    guest_name: guest?.name ?? "",
    guest_company: guest?.company ?? null,
    check_in_date: b.checkInDate,
    check_out_date: b.checkOutDate,
    actual_check_in: b.actualCheckIn?.toISOString() ?? null,
    actual_check_out: b.actualCheckOut?.toISOString() ?? null,
    status: b.status,
    stay_type: b.stayType,
    occupied_persons: b.occupiedPersons,
    notes: b.notes ?? null,
    created_at: b.createdAt.toISOString(),
  };
}

// ── Direct check-in (one-step) ───────────────────────────────────
// Must be registered BEFORE /bookings/:id to avoid param capture
router.post("/direct-checkin", async (req, res): Promise<void> => {
  const parsed = DirectCheckInBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const d = parsed.data;

  const [room] = await db.select().from(roomsTable).where(eq(roomsTable.id, d.room_id));
  if (!room) { res.status(404).json({ error: "Kamar tidak ditemukan" }); return; }
  if (room.status !== "available") { res.status(400).json({ error: "Kamar tidak tersedia" }); return; }

  const [guest] = await db.insert(guestsTable).values({
    name: d.guest_name,
    company: d.company ?? null,
    idNumber: "KARYAWAN",
    idType: "ktp",
  }).returning();

  const [booking] = await db.insert(bookingsTable).values({
    roomId: d.room_id,
    guestId: guest.id,
    checkInDate: d.check_in_date,
    checkOutDate: d.check_out_date,
    actualCheckIn: new Date(),
    status: "checked_in",
    stayType: d.stay_type,
    pricePerNight: 0,
    occupiedPersons: d.occupied_persons,
    notes: d.notes ?? null,
  }).returning();

  const newStatus = roomStatusFor(d.stay_type);
  await db.update(roomsTable).set({ status: newStatus, updatedAt: new Date() }).where(eq(roomsTable.id, d.room_id));

  await db.insert(activityLogsTable).values({
    action: "check_in",
    description: `Check-in: ${guest.name} ke kamar ${room.number}`,
    roomNumber: room.number,
    guestName: guest.name,
  });

  const result = await bookingWithDetails(booking);
  res.status(201).json(DirectCheckInResponse.parse(result));
});

// ── List bookings ─────────────────────────────────────────────────
router.get("/bookings", async (req, res): Promise<void> => {
  const { status, room_id } = req.query as { status?: string; room_id?: string };
  const conditions = [];
  if (status) conditions.push(eq(bookingsTable.status, status));
  if (room_id) conditions.push(eq(bookingsTable.roomId, parseInt(room_id, 10)));

  const rows = await db
    .select().from(bookingsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(bookingsTable.createdAt));

  const results = await Promise.all(rows.map(bookingWithDetails));
  res.json(GetBookingsResponse.parse(results));
});

// ── Create booking (reservation) ─────────────────────────────────
router.post("/bookings", async (req, res): Promise<void> => {
  const parsed = CreateBookingBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  let guestId = parsed.data.guest_id ?? null;

  if (!guestId && parsed.data.guest) {
    const g = parsed.data.guest;
    const [newGuest] = await db.insert(guestsTable).values({
      name: g.name,
      company: g.company ?? null,
      idNumber: "KARYAWAN",
      idType: "ktp",
    }).returning();
    guestId = newGuest.id;
  }

  if (!guestId) { res.status(400).json({ error: "ID atau data tamu diperlukan" }); return; }

  const [booking] = await db.insert(bookingsTable).values({
    roomId: parsed.data.room_id,
    guestId: guestId as number,
    checkInDate: toDateStr(parsed.data.check_in_date),
    checkOutDate: toDateStr(parsed.data.check_out_date),
    stayType: parsed.data.stay_type,
    pricePerNight: 0,
    occupiedPersons: parsed.data.occupied_persons,
    notes: parsed.data.notes ?? null,
    status: "reserved",
  }).returning();

  const result = await bookingWithDetails(booking);
  res.status(201).json(GetBookingResponse.parse(result));
});

// ── Get single booking ────────────────────────────────────────────
router.get("/bookings/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetBookingParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) { res.status(400).json({ error: "Invalid booking ID" }); return; }

  const [booking] = await db.select().from(bookingsTable).where(eq(bookingsTable.id, params.data.id));
  if (!booking) { res.status(404).json({ error: "Booking tidak ditemukan" }); return; }
  res.json(GetBookingResponse.parse(await bookingWithDetails(booking)));
});

// ── Update booking ────────────────────────────────────────────────
router.patch("/bookings/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = UpdateBookingParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) { res.status(400).json({ error: "Invalid booking ID" }); return; }

  const parsed = UpdateBookingBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (parsed.data.check_in_date !== undefined) updates.checkInDate = toDateStr(parsed.data.check_in_date);
  if (parsed.data.check_out_date !== undefined) updates.checkOutDate = toDateStr(parsed.data.check_out_date);
  if (parsed.data.occupied_persons !== undefined) updates.occupiedPersons = parsed.data.occupied_persons;
  if (parsed.data.notes !== undefined) updates.notes = parsed.data.notes;
  if (parsed.data.status !== undefined) updates.status = parsed.data.status;

  const [booking] = await db.update(bookingsTable).set(updates).where(eq(bookingsTable.id, params.data.id)).returning();
  if (!booking) { res.status(404).json({ error: "Booking tidak ditemukan" }); return; }
  res.json(UpdateBookingResponse.parse(await bookingWithDetails(booking)));
});

// ── Delete booking ────────────────────────────────────────────────
router.delete("/bookings/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DeleteBookingParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) { res.status(400).json({ error: "Invalid booking ID" }); return; }
  await db.delete(bookingsTable).where(eq(bookingsTable.id, params.data.id));
  res.sendStatus(204);
});

// ── Check-in (existing reservation → checked_in) ─────────────────
router.post("/bookings/:id/checkin", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = CheckInParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) { res.status(400).json({ error: "Invalid booking ID" }); return; }

  const parsed = CheckInBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [existing] = await db.select().from(bookingsTable).where(eq(bookingsTable.id, params.data.id));
  if (!existing) { res.status(404).json({ error: "Booking tidak ditemukan" }); return; }
  if (existing.status === "checked_in") { res.status(400).json({ error: "Tamu sudah check-in" }); return; }

  const [booking] = await db.update(bookingsTable).set({
    status: "checked_in",
    actualCheckIn: new Date(),
    notes: parsed.data.notes ?? existing.notes,
    updatedAt: new Date(),
  }).where(eq(bookingsTable.id, params.data.id)).returning();

  const [room] = await db.select().from(roomsTable).where(eq(roomsTable.id, booking.roomId));
  const [guest] = await db.select().from(guestsTable).where(eq(guestsTable.id, booking.guestId));

  await db.update(roomsTable).set({ status: roomStatusFor(booking.stayType), updatedAt: new Date() }).where(eq(roomsTable.id, booking.roomId));

  await db.insert(activityLogsTable).values({
    action: "check_in",
    description: `Check-in: ${guest?.name ?? ""} ke kamar ${room?.number ?? ""}`,
    roomNumber: room?.number ?? null,
    guestName: guest?.name ?? null,
  });

  res.json(CheckInResponse.parse(await bookingWithDetails(booking)));
});

// ── Check-out ─────────────────────────────────────────────────────
router.post("/bookings/:id/checkout", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = CheckOutParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) { res.status(400).json({ error: "Invalid booking ID" }); return; }

  const parsed = CheckOutBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [existing] = await db.select().from(bookingsTable).where(eq(bookingsTable.id, params.data.id));
  if (!existing) { res.status(404).json({ error: "Booking tidak ditemukan" }); return; }

  const checkInDate  = existing.actualCheckIn ?? new Date(existing.checkInDate);
  const checkOutDate = new Date();
  const nights = Math.max(1, Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)));

  const [booking] = await db.update(bookingsTable).set({
    status: "checked_out",
    actualCheckOut: checkOutDate,
    notes: parsed.data.notes ?? existing.notes,
    updatedAt: new Date(),
  }).where(eq(bookingsTable.id, params.data.id)).returning();

  await db.update(roomsTable).set({ status: "available", updatedAt: new Date() }).where(eq(roomsTable.id, booking.roomId));

  const [room]  = await db.select().from(roomsTable).where(eq(roomsTable.id, booking.roomId));
  const [guest] = await db.select().from(guestsTable).where(eq(guestsTable.id, booking.guestId));

  await db.insert(activityLogsTable).values({
    action: "check_out",
    description: `Check-out: ${guest?.name ?? ""} dari kamar ${room?.number ?? ""}`,
    roomNumber: room?.number ?? null,
    guestName: guest?.name ?? null,
  });

  res.json(CheckOutResponse.parse({
    booking: await bookingWithDetails(booking),
    nights,
  }));
});

export default router;
