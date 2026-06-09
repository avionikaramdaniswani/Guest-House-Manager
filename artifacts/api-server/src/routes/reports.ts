import { Router, type IRouter } from "express";
import { eq, and, gte, lte, sql } from "drizzle-orm";
import { db, bookingsTable, roomsTable, guestsTable } from "@workspace/db";
import {
  GetDailyReportResponse,
  GetMonthlyReportResponse,
  GetOccupancyChartResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/reports/daily", async (req, res): Promise<void> => {
  const { date } = req.query as { date?: string };
  if (!date) {
    res.status(400).json({ error: "date parameter required" });
    return;
  }

  const checkInsRows = await db
    .select()
    .from(bookingsTable)
    .where(
      and(
        eq(bookingsTable.checkInDate, date),
        eq(bookingsTable.status, "checked_in")
      )
    );

  const checkOutsRows = await db
    .select()
    .from(bookingsTable)
    .where(
      and(
        eq(bookingsTable.checkOutDate, date),
        eq(bookingsTable.status, "checked_out")
      )
    );

  const reservationsRows = await db
    .select()
    .from(bookingsTable)
    .where(eq(bookingsTable.checkInDate, date));

  const revenue = checkOutsRows.reduce((sum, b) => sum + (b.totalAmount ?? 0), 0);

  async function enrichBookings(bookings: typeof bookingsTable.$inferSelect[]) {
    return Promise.all(bookings.map(async (b) => {
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
    }));
  }

  const allBookings = await enrichBookings([...checkInsRows, ...checkOutsRows]);

  res.json(GetDailyReportResponse.parse({
    date,
    check_ins: checkInsRows.length,
    check_outs: checkOutsRows.length,
    new_reservations: reservationsRows.length,
    revenue,
    bookings: allBookings,
  }));
});

router.get("/reports/monthly", async (req, res): Promise<void> => {
  const { year, month } = req.query as { year?: string; month?: string };
  if (!year || !month) {
    res.status(400).json({ error: "year and month required" });
    return;
  }

  const y = parseInt(year, 10);
  const m = parseInt(month, 10);
  const firstDay = `${y}-${String(m).padStart(2, "0")}-01`;
  const lastDay = new Date(y, m, 0).toISOString().split("T")[0];

  const checkouts = await db
    .select()
    .from(bookingsTable)
    .where(
      and(
        eq(bookingsTable.status, "checked_out"),
        gte(bookingsTable.checkOutDate, firstDay),
        lte(bookingsTable.checkOutDate, lastDay)
      )
    );

  const totalRevenue = checkouts.reduce((sum, b) => sum + (b.totalAmount ?? 0), 0);
  const totalGuests = checkouts.length;

  // Nationality breakdown
  const nationalityMap = new Map<string, number>();
  for (const b of checkouts) {
    const [guest] = await db.select().from(guestsTable).where(eq(guestsTable.id, b.guestId));
    const nat = guest?.nationality ?? "Unknown";
    nationalityMap.set(nat, (nationalityMap.get(nat) ?? 0) + 1);
  }
  const nationalityBreakdown = Array.from(nationalityMap.entries()).map(([nationality, count]) => ({
    nationality,
    count,
  }));

  // Room type revenue
  const typeRevenueMap = new Map<string, { revenue: number; nights: number }>();
  for (const b of checkouts) {
    const [room] = await db.select().from(roomsTable).where(eq(roomsTable.id, b.roomId));
    const stars = room?.stars ?? 1;
    const typeLabel = stars === 1 ? "Double Bed (*)" : stars === 2 ? "Family Room (**)" : "Long Stay/Big Room (***)";
    const existing = typeRevenueMap.get(typeLabel) ?? { revenue: 0, nights: 0 };
    const checkIn = b.actualCheckIn ?? new Date(b.checkInDate);
    const checkOut = b.actualCheckOut ?? new Date(b.checkOutDate);
    const nights = Math.max(1, Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)));
    typeRevenueMap.set(typeLabel, {
      revenue: existing.revenue + (b.totalAmount ?? 0),
      nights: existing.nights + nights,
    });
  }
  const roomTypeRevenue = Array.from(typeRevenueMap.entries()).map(([type, data]) => ({
    type,
    revenue: data.revenue,
    nights: data.nights,
  }));

  // Occupancy rate: count days where rooms were occupied
  const totalRoomCount = await db.select().from(roomsTable).where(eq(roomsTable.isFacility, false)).then(r => r.length);
  const daysInMonth = new Date(y, m, 0).getDate();
  const avgOccupancyRate = totalRoomCount > 0
    ? Math.round((totalGuests / (totalRoomCount * daysInMonth / 30)) * 100) / 100
    : 0;

  res.json(GetMonthlyReportResponse.parse({
    year: y,
    month: m,
    total_revenue: totalRevenue,
    avg_occupancy_rate: Math.min(100, Math.round(avgOccupancyRate * 10) / 10),
    total_guests: totalGuests,
    nationality_breakdown: nationalityBreakdown,
    room_type_revenue: roomTypeRevenue,
  }));
});

router.get("/reports/occupancy-chart", async (req, res): Promise<void> => {
  const period = (req.query.period as string) ?? "weekly";
  const today = new Date();
  const dataPoints: Array<{ label: string; date: string; occupied: number; total: number; rate: number }> = [];

  const totalRooms = await db
    .select()
    .from(roomsTable)
    .where(eq(roomsTable.isFacility, false))
    .then(r => r.length);

  const days = period === "weekly" ? 7 : 30;

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];

    const occupiedCount = await db
      .select()
      .from(bookingsTable)
      .where(
        and(
          lte(bookingsTable.checkInDate, dateStr),
          gte(bookingsTable.checkOutDate, dateStr),
          sql`${bookingsTable.status} IN ('checked_in', 'checked_out', 'reserved')`
        )
      )
      .then(r => r.length);

    const label = period === "weekly"
      ? date.toLocaleDateString("id-ID", { weekday: "short", day: "numeric" })
      : date.toLocaleDateString("id-ID", { day: "numeric", month: "short" });

    dataPoints.push({
      label,
      date: dateStr,
      occupied: Math.min(occupiedCount, totalRooms),
      total: totalRooms,
      rate: totalRooms > 0 ? Math.round((Math.min(occupiedCount, totalRooms) / totalRooms) * 1000) / 10 : 0,
    });
  }

  res.json(GetOccupancyChartResponse.parse(dataPoints));
});

export default router;
