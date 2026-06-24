import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import bcrypt from "bcryptjs";
import { logger } from "../lib/logger";

const router: IRouter = Router();

export interface SessionUser {
  id: number;
  email: string;
  name: string;
  role: string;
}

const sessions = new Map<string, { user: SessionUser; createdAt: Date }>();

function generateToken(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36) + Math.random().toString(36).substring(2);
}

// ── Middleware ──────────────────────────────────────────────────────

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token || !sessions.has(token)) {
    res.status(401).json({ error: "Sesi tidak valid atau sudah berakhir" });
    return;
  }
  (req as any).user = sessions.get(token)!.user;
  next();
}

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token || !sessions.has(token)) {
      res.status(401).json({ error: "Sesi tidak valid atau sudah berakhir" });
      return;
    }
    const session = sessions.get(token)!;
    if (roles.length > 0 && !roles.includes(session.user.role)) {
      res.status(403).json({ error: "Akses ditolak: hak akses tidak mencukupi" });
      return;
    }
    (req as any).user = session.user;
    next();
  };
}

// ── Routes ──────────────────────────────────────────────────────────

router.post("/auth/login", async (req, res): Promise<void> => {
  const { email, password } = req.body as { email?: string; password?: string };

  if (!email || !password) {
    res.status(400).json({ error: "Email dan password wajib diisi" });
    return;
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email.toLowerCase().trim()));

  if (!user) {
    res.status(401).json({ error: "Email atau password salah" });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Email atau password salah" });
    return;
  }

  const token = generateToken();
  const sessionUser: SessionUser = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  };
  sessions.set(token, { user: sessionUser, createdAt: new Date() });

  req.log.info(`Login: ${user.email} (${user.role})`);
  res.json({ token, user: sessionUser });
});

router.post("/auth/logout", (req, res): void => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (token) sessions.delete(token);
  res.json({ ok: true });
});

router.get("/auth/verify", (req, res): void => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token || !sessions.has(token)) {
    res.status(401).json({ error: "Sesi tidak valid" });
    return;
  }
  const session = sessions.get(token)!;
  res.json({ token, user: session.user });
});

export { sessions };
export default router;
