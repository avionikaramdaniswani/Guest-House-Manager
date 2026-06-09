import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, settingsTable } from "@workspace/db";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const sessions = new Map<string, { staff: string; createdAt: Date }>();

function generateToken(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

router.post("/auth/login", async (req, res): Promise<void> => {
  const { pin } = req.body as { pin?: string };
  if (!pin || typeof pin !== "string" || pin.length !== 4) {
    res.status(400).json({ error: "PIN must be 4 digits" });
    return;
  }

  const [setting] = await db
    .select()
    .from(settingsTable)
    .where(eq(settingsTable.key, "pin"));

  const storedPin = setting?.value ?? "1234";

  if (pin !== storedPin) {
    res.status(401).json({ error: "PIN salah" });
    return;
  }

  const token = generateToken();
  sessions.set(token, { staff: "Resepsionis", createdAt: new Date() });

  req.log.info("Staff logged in");
  res.json({ token, staff: "Resepsionis" });
});

router.get("/auth/verify", async (req, res): Promise<void> => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.replace("Bearer ", "");

  if (!token || !sessions.has(token)) {
    res.status(401).json({ error: "Sesi tidak valid" });
    return;
  }

  const session = sessions.get(token)!;
  res.json({ token, staff: session.staff });
});

export { sessions };
export default router;
