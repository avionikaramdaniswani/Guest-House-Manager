import { Router, type IRouter } from "express";
import { eq, and, lte } from "drizzle-orm";
import { db, roomsTable, bookingsTable, guestsTable, activityLogsTable } from "@workspace/db";
import {
  GetDashboardSummaryResponse,
  GetTodayActivityResponse,
  GetAlertsResponse,
  GetActivityLogResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/dashboard/summary", async (_req, res): Promise<void> => {
  const rooms = await db.select().from(roomsTable).where(eq(roomsTable.isFacility, false));

  const totalRooms = rooms.length;
  const occupied = rooms.filter(r =>
    ["occupied_regular", "long_stay_japan", "long_stay_local"].includes(r.status)
  ).length;
  const available = rooms.filter(r => r.status === "available").length;
  const longStayJapan = rooms.filter(r => r.status === "long_stay_japan").length;
  const longStayLocal = rooms.filter(r => r.status === "long_stay_local").length;
  const blocked = rooms.filter(r => r.status === "blocked").length;
  const occupancyRate = totalRooms > 0 ? (occupied / totalRooms) * 100 : 0;

  res.json(GetDashboardSummaryResponse.parse({
    total_rooms: totalRooms,
    occupied,
    available,
    long_stay_japan: longStayJapan,
    long_stay_local: longStayLocal,
    blocked,
    occupancy_rate: Math.round(occupancyRate * 10) / 10,
  }));
});

router.get("/dashboard/today", async (_req, res): Promise<void> => {
  const today = new Date().toISOString().split("T")[0];

  const checkIns = await db
    .select()
    .from(bookingsTable)
    .where(and(eq(bookingsTable.status, "checked_in"), eq(bookingsTable.checkInDate, today)));

  const checkOuts = await db
    .select()
    .from(bookingsTable)
    .where(and(eq(bookingsTable.status, "checked_out"), eq(bookingsTable.checkOutDate, today)));

  async function enrichBookings(bookings: typeof bookingsTable.$inferSelect[]) {
    return Promise.all(bookings.map(async (b) => {
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
    }));
  }

  res.json(GetTodayActivityResponse.parse({
    check_ins: await enrichBookings(checkIns),
    check_outs: await enrichBookings(checkOuts),
  }));
});

router.get("/dashboard/alerts", async (_req, res): Promise<void> => {
  const alerts: Array<{
    room_id: number;
    room_number: string;
    alert_type: string;
    message: string;
    days_remaining: number | null;
  }> = [];

  const today = new Date();
  const in7Days = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  // Expiring long stays (both Japan and local)
  const expiringBookings = await db
    .select({
      bookingId: bookingsTable.id,
      roomId: bookingsTable.roomId,
      checkOutDate: bookingsTable.checkOutDate,
      stayType: bookingsTable.stayType,
    })
    .from(bookingsTable)
    .where(
      and(
        eq(bookingsTable.status, "checked_in"),
        lte(bookingsTable.checkOutDate, in7Days)
      )
    );

  const longStayExpiring = expiringBookings.filter(b =>
    b.stayType === "long_stay_japan" || b.stayType === "long_stay_local"
  );

  for (const b of longStayExpiring) {
    const [room] = await db.select().from(roomsTable).where(eq(roomsTable.id, b.roomId));
    const daysRemaining = Math.ceil((new Date(b.checkOutDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    alerts.push({
      room_id: b.roomId,
      room_number: room?.number ?? "",
      alert_type: daysRemaining < 0 ? "overdue" : "expiring_soon",
      message: daysRemaining < 0
        ? `Long stay kamar ${room?.number ?? ""} sudah melewati tanggal keluar`
        : `Long stay kamar ${room?.number ?? ""} berakhir dalam ${daysRemaining} hari`,
      days_remaining: daysRemaining,
    });
  }

  // Blocked rooms
  const blockedRooms = await db.select().from(roomsTable).where(eq(roomsTable.status, "blocked"));
  for (const room of blockedRooms) {
    alerts.push({
      room_id: room.id,
      room_number: room.number,
      alert_type: "blocked",
      message: `Kamar ${room.number} sedang diblokir`,
      days_remaining: null,
    });
  }

  res.json(GetAlertsResponse.parse(alerts));
});

router.get("/activity", async (req, res): Promise<void> => {
  const limit = Math.min(parseInt(String(req.query.limit ?? "50"), 10), 200);
  const logs = await db
    .select()
    .from(activityLogsTable)
    .orderBy(activityLogsTable.createdAt)
    .limit(limit);

  res.json(GetActivityLogResponse.parse(logs.map(l => ({
    id: l.id,
    action: l.action,
    description: l.description,
    room_number: l.roomNumber ?? null,
    guest_name: l.guestName ?? null,
    created_at: l.createdAt.toISOString(),
  }))));
});

export default router;
