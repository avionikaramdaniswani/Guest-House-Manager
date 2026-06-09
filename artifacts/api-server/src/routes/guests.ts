import { Router, type IRouter } from "express";
import { eq, ilike, or, desc } from "drizzle-orm";
import { db, guestsTable } from "@workspace/db";
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

function toGuestShape(g: { id: number; name: string; idNumber: string; idType: string; nationality: string; phone: string | null; createdAt: Date }) {
  return {
    id: g.id,
    name: g.name,
    id_number: g.idNumber,
    id_type: g.idType,
    nationality: g.nationality,
    phone: g.phone ?? null,
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
        ilike(guestsTable.nationality, `%${search}%`),
        ilike(guestsTable.idNumber, `%${search}%`)
      )
    );
  }

  const guests = await query.orderBy(desc(guestsTable.createdAt));
  res.json(GetGuestsResponse.parse(guests.map(toGuestShape)));
});

router.post("/guests", async (req, res): Promise<void> => {
  const parsed = CreateGuestBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [guest] = await db
    .insert(guestsTable)
    .values({
      name: parsed.data.name,
      idNumber: parsed.data.id_number,
      idType: parsed.data.id_type,
      nationality: parsed.data.nationality,
      phone: parsed.data.phone ?? null,
    })
    .returning();

  res.status(201).json(GetGuestResponse.parse(toGuestShape(guest)));
});

router.get("/guests/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetGuestParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid guest ID" });
    return;
  }

  const [guest] = await db.select().from(guestsTable).where(eq(guestsTable.id, params.data.id));
  if (!guest) {
    res.status(404).json({ error: "Tamu tidak ditemukan" });
    return;
  }

  res.json(GetGuestResponse.parse(toGuestShape(guest)));
});

router.patch("/guests/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = UpdateGuestParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid guest ID" });
    return;
  }

  const parsed = UpdateGuestBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updates: Record<string, unknown> = {};
  if (parsed.data.name !== undefined) updates.name = parsed.data.name;
  if (parsed.data.id_number !== undefined) updates.idNumber = parsed.data.id_number;
  if (parsed.data.id_type !== undefined) updates.idType = parsed.data.id_type;
  if (parsed.data.nationality !== undefined) updates.nationality = parsed.data.nationality;
  if (parsed.data.phone !== undefined) updates.phone = parsed.data.phone;
  updates.updatedAt = new Date();

  const [guest] = await db
    .update(guestsTable)
    .set(updates)
    .where(eq(guestsTable.id, params.data.id))
    .returning();

  if (!guest) {
    res.status(404).json({ error: "Tamu tidak ditemukan" });
    return;
  }

  res.json(UpdateGuestResponse.parse(toGuestShape(guest)));
});

export default router;
