import { Router, type IRouter } from "express";
import { desc, gte, lte, and, eq } from "drizzle-orm";
import { db, activityLogsTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/activity", async (req, res): Promise<void> => {
  const { limit, date, action } = req.query as {
    limit?: string;
    date?: string;
    action?: string;
  };

  const conditions = [];

  if (date) {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    conditions.push(gte(activityLogsTable.createdAt, start));
    conditions.push(lte(activityLogsTable.createdAt, end));
  }

  if (action) {
    conditions.push(eq(activityLogsTable.action, action));
  }

  const rows = await db
    .select()
    .from(activityLogsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(activityLogsTable.createdAt))
    .limit(Math.min(parseInt(limit ?? "200", 10), 500));

  res.json(
    rows.map((r) => ({
      id: r.id,
      action: r.action,
      description: r.description,
      room_number: r.roomNumber ?? null,
      guest_name: r.guestName ?? null,
      created_at: r.createdAt.toISOString(),
    }))
  );
});

export default router;
