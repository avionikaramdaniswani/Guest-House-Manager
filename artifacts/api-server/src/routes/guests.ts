import { Router, type IRouter } from "express";
import { eq, ilike, or, desc } from "drizzle-orm";
import { db, guestsTable, bookingsTable, roomsTable } from "@workspace/db";
import {
  GetGuestsResponse,
  GetGuestResponse,
  GetGuestParams,
  UpdateGuestParams,
  UpdateGuestBody,
  UpdateGuestResponse,
  CreateGuestBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

function toGuestShape(g: typeof guestsTable.$inferSelect) {
  return {
    id: g.id,
    name: g.name,
    company: g.company ?? null,
    created_at: g.createdAt.toISOString(),
  };
}

router.get("/guests", async (req, res): Promise<void> => {
  const { search } = req.query as { search?: string };
  let query = db.select().from(guestsTable).$dynamic();
  if (search) {
    query = query.where(
      or(
        ilike(guestsTable.name, `%${search}%`),
        ilike(guestsTable.company, `%${search}%`)
      )
    );
  }
  const guests = await query.orderBy(desc(guestsTable.createdAt));
  res.json(GetGuestsResponse.parse(guests.map(toGuestShape)));
});

router.post("/guests", async (req, res): Promise<void> => {
  const parsed = CreateGuestBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [guest] = await db.insert(guestsTable).values({
    name: parsed.data.name,
    company: parsed.data.company ?? null,
    idNumber: "KARYAWAN",
    idType: "ktp",
  }).returning();

  res.status(201).json(GetGuestResponse.parse(toGuestShape(guest)));
});

router.get("/guests/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetGuestParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) { res.status(400).json({ error: "Invalid guest ID" }); return; }

  const [guest] = await db.select().from(guestsTable).where(eq(guestsTable.id, params.data.id));
  if (!guest) { res.status(404).json({ error: "Tamu tidak ditemukan" }); return; }
  res.json(GetGuestResponse.parse(toGuestShape(guest)));
});

router.get("/guests/:id/bookings", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const guestId = parseInt(raw, 10);
  if (isNaN(guestId)) { res.status(400).json({ error: "Invalid guest ID" }); return; }

  const rows = await db
    .select({
      id: bookingsTable.id,
      room_id: bookingsTable.roomId,
      room_number: roomsTable.number,
      check_in_date: bookingsTable.checkInDate,
      check_out_date: bookingsTable.checkOutDate,
      actual_check_in: bookingsTable.actualCheckIn,
      actual_check_out: bookingsTable.actualCheckOut,
      status: bookingsTable.status,
      stay_type: bookingsTable.stayType,
      occupied_persons: bookingsTable.occupiedPersons,
      notes: bookingsTable.notes,
      created_at: bookingsTable.createdAt,
    })
    .from(bookingsTable)
    .leftJoin(roomsTable, eq(roomsTable.id, bookingsTable.roomId))
    .where(eq(bookingsTable.guestId, guestId))
    .orderBy(desc(bookingsTable.createdAt));

  res.json(rows.map(r => ({
    id: r.id,
    room_id: r.room_id,
    room_number: r.room_number ?? "-",
    check_in_date: r.check_in_date,
    check_out_date: r.check_out_date,
    actual_check_in: r.actual_check_in?.toISOString() ?? null,
    actual_check_out: r.actual_check_out?.toISOString() ?? null,
    status: r.status,
    stay_type: r.stay_type,
    occupied_persons: r.occupied_persons,
    notes: r.notes ?? null,
    created_at: r.created_at.toISOString(),
  })));
});

router.patch("/guests/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = UpdateGuestParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) { res.status(400).json({ error: "Invalid guest ID" }); return; }

  const parsed = UpdateGuestBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (parsed.data.name !== undefined) updates.name = parsed.data.name;
  if (parsed.data.company !== undefined) updates.company = parsed.data.company;

  const [guest] = await db.update(guestsTable).set(updates).where(eq(guestsTable.id, params.data.id)).returning();
  if (!guest) { res.status(404).json({ error: "Tamu tidak ditemukan" }); return; }
  res.json(UpdateGuestResponse.parse(toGuestShape(guest)));
});

router.delete("/guests/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const guestId = parseInt(raw, 10);
  if (isNaN(guestId)) { res.status(400).json({ error: "Invalid guest ID" }); return; }

  const activeBookings = await db
    .select({ id: bookingsTable.id })
    .from(bookingsTable)
    .where(eq(bookingsTable.guestId, guestId))
    .limit(1);

  if (activeBookings.length > 0) {
    res.status(400).json({ error: "Tamu tidak bisa dihapus karena masih memiliki riwayat booking." });
    return;
  }

  const [deleted] = await db.delete(guestsTable).where(eq(guestsTable.id, guestId)).returning();
  if (!deleted) { res.status(404).json({ error: "Tamu tidak ditemukan" }); return; }
  res.json({ ok: true });
});

export default router;
