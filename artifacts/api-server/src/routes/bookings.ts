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
} from "@workspace/api-zod";

const router: IRouter = Router();

function toDateStr(d: Date | string): string {
  if (typeof d === "string") return d;
  return d.toISOString().split("T")[0];
}

async function bookingWithDetails(b: typeof bookingsTable.$inferSelect) {
  const [guest] = await db.select().from(guestsTable).where(eq(guestsTable.id, b.guestId));
  const [room] = await db.select().from(roomsTable).where(eq(roomsTable.id, b.roomId));
  return {
    id: b.id,
    room_id: b.roomId,
    room_number: room?.number ?? "",
    guest_id: b.guestId,
    guest_name: guest?.name ?? "",
    guest_nationality: guest?.nationality ?? "",
    check_in_date: b.checkInDate,
    check_out_date: b.checkOutDate,
    actual_check_in: b.actualCheckIn?.toISOString() ?? null,
    actual_check_out: b.actualCheckOut?.toISOString() ?? null,
    status: b.status,
    stay_type: b.stayType,
    price_per_night: b.pricePerNight,
    total_amount: b.totalAmount ?? null,
    deposit: b.deposit ?? null,
    payment_method: b.paymentMethod ?? null,
    notes: b.notes ?? null,
    created_at: b.createdAt.toISOString(),
  };
}

router.get("/bookings", async (req, res): Promise<void> => {
  const { status, room_id } = req.query as { status?: string; room_id?: string };

  const conditions = [];
  if (status) conditions.push(eq(bookingsTable.status, status));
  if (room_id) conditions.push(eq(bookingsTable.roomId, parseInt(room_id, 10)));

  const rows = await db
    .select()
    .from(bookingsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(bookingsTable.createdAt));

  const results = await Promise.all(rows.map(bookingWithDetails));
  res.json(GetBookingsResponse.parse(results));
});

router.post("/bookings", async (req, res): Promise<void> => {
  const parsed = CreateBookingBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  let guestId = parsed.data.guest_id ?? null;

  // Create guest inline if provided
  if (!guestId && parsed.data.guest) {
    const g = parsed.data.guest;
    const [newGuest] = await db.insert(guestsTable).values({
      name: g.name,
      idNumber: g.id_number,
      idType: g.id_type,
      nationality: g.nationality,
      phone: g.phone ?? null,
    }).returning();
    guestId = newGuest.id;
  }

  if (!guestId) {
    res.status(400).json({ error: "Guest ID or guest info required" });
    return;
  }

  const [booking] = await db
    .insert(bookingsTable)
    .values({
      roomId: parsed.data.room_id,
      guestId: guestId as number,
      checkInDate: toDateStr(parsed.data.check_in_date),
      checkOutDate: toDateStr(parsed.data.check_out_date),
      stayType: parsed.data.stay_type,
      pricePerNight: parsed.data.price_per_night,
      deposit: parsed.data.deposit ?? null,
      notes: parsed.data.notes ?? null,
      status: "reserved",
    })
    .returning();

  await db.insert(activityLogsTable).values({
    action: "booking_created",
    description: `Reservasi baru untuk kamar ${parsed.data.room_id}`,
    roomNumber: String(parsed.data.room_id),
    guestName: null,
  });

  const result = await bookingWithDetails(booking);
  res.status(201).json(GetBookingResponse.parse(result));
});

router.get("/bookings/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetBookingParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid booking ID" });
    return;
  }

  const [booking] = await db.select().from(bookingsTable).where(eq(bookingsTable.id, params.data.id));
  if (!booking) {
    res.status(404).json({ error: "Booking tidak ditemukan" });
    return;
  }

  const result = await bookingWithDetails(booking);
  res.json(GetBookingResponse.parse(result));
});

router.patch("/bookings/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = UpdateBookingParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid booking ID" });
    return;
  }

  const parsed = UpdateBookingBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updates: Record<string, unknown> = {};
  if (parsed.data.check_in_date !== undefined) updates.checkInDate = toDateStr(parsed.data.check_in_date);
  if (parsed.data.check_out_date !== undefined) updates.checkOutDate = toDateStr(parsed.data.check_out_date);
  if (parsed.data.price_per_night !== undefined) updates.pricePerNight = parsed.data.price_per_night;
  if (parsed.data.deposit !== undefined) updates.deposit = parsed.data.deposit;
  if (parsed.data.notes !== undefined) updates.notes = parsed.data.notes;
  if (parsed.data.status !== undefined) updates.status = parsed.data.status;
  updates.updatedAt = new Date();

  const [booking] = await db
    .update(bookingsTable)
    .set(updates)
    .where(eq(bookingsTable.id, params.data.id))
    .returning();

  if (!booking) {
    res.status(404).json({ error: "Booking tidak ditemukan" });
    return;
  }

  const result = await bookingWithDetails(booking);
  res.json(UpdateBookingResponse.parse(result));
});

router.delete("/bookings/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DeleteBookingParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid booking ID" });
    return;
  }

  await db.delete(bookingsTable).where(eq(bookingsTable.id, params.data.id));
  res.sendStatus(204);
});

router.post("/bookings/:id/checkin", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = CheckInParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid booking ID" });
    return;
  }

  const parsed = CheckInBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [existing] = await db.select().from(bookingsTable).where(eq(bookingsTable.id, params.data.id));
  if (!existing) {
    res.status(404).json({ error: "Booking tidak ditemukan" });
    return;
  }
  if (existing.status === "checked_in") {
    res.status(400).json({ error: "Tamu sudah check-in" });
    return;
  }

  const [booking] = await db
    .update(bookingsTable)
    .set({
      status: "checked_in",
      actualCheckIn: new Date(),
      deposit: parsed.data.deposit ?? existing.deposit,
      notes: parsed.data.notes ?? existing.notes,
      updatedAt: new Date(),
    })
    .where(eq(bookingsTable.id, params.data.id))
    .returning();

  // Update room status
  const [room] = await db.select().from(roomsTable).where(eq(roomsTable.id, booking.roomId));
  const [guest] = await db.select().from(guestsTable).where(eq(guestsTable.id, booking.guestId));

  const newStatus = booking.stayType === "long_stay"
    ? (guest?.nationality?.toLowerCase().includes("jepang") || guest?.nationality?.toLowerCase() === "japan" ? "long_stay_japan" : "long_stay_local")
    : "occupied_regular";

  await db.update(roomsTable).set({ status: newStatus, updatedAt: new Date() }).where(eq(roomsTable.id, booking.roomId));

  await db.insert(activityLogsTable).values({
    action: "check_in",
    description: `Check-in: ${guest?.name ?? ""} ke kamar ${room?.number ?? ""}`,
    roomNumber: room?.number ?? null,
    guestName: guest?.name ?? null,
  });

  const result = await bookingWithDetails(booking);
  res.json(CheckInResponse.parse(result));
});

router.post("/bookings/:id/checkout", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = CheckOutParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid booking ID" });
    return;
  }

  const parsed = CheckOutBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [existing] = await db.select().from(bookingsTable).where(eq(bookingsTable.id, params.data.id));
  if (!existing) {
    res.status(404).json({ error: "Booking tidak ditemukan" });
    return;
  }

  const checkInDate = existing.actualCheckIn ?? new Date(existing.checkInDate);
  const checkOutDate = new Date();
  const nights = Math.max(
    1,
    Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24))
  );
  const subtotal = nights * existing.pricePerNight;
  const additionalCharges = parsed.data.additional_charges ?? 0;
  const depositPaid = existing.deposit ?? 0;
  const totalDue = subtotal + additionalCharges - depositPaid;
  const totalAmount = subtotal + additionalCharges;

  const [booking] = await db
    .update(bookingsTable)
    .set({
      status: "checked_out",
      actualCheckOut: checkOutDate,
      totalAmount,
      paymentMethod: parsed.data.payment_method,
      notes: parsed.data.notes ?? existing.notes,
      updatedAt: new Date(),
    })
    .where(eq(bookingsTable.id, params.data.id))
    .returning();

  // Free up the room
  await db.update(roomsTable).set({ status: "available", updatedAt: new Date() }).where(eq(roomsTable.id, booking.roomId));

  const [room] = await db.select().from(roomsTable).where(eq(roomsTable.id, booking.roomId));
  const [guest] = await db.select().from(guestsTable).where(eq(guestsTable.id, booking.guestId));

  await db.insert(activityLogsTable).values({
    action: "check_out",
    description: `Check-out: ${guest?.name ?? ""} dari kamar ${room?.number ?? ""}`,
    roomNumber: room?.number ?? null,
    guestName: guest?.name ?? null,
  });

  const bookingResult = await bookingWithDetails(booking);

  res.json(CheckOutResponse.parse({
    booking: bookingResult,
    nights,
    subtotal,
    additional_charges: additionalCharges,
    deposit_paid: depositPaid,
    total_due: totalDue,
    payment_method: parsed.data.payment_method,
  }));
});

export default router;
