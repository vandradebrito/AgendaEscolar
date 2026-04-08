import { Router } from "express";
import { getAuth } from "@clerk/express";
import { db, userAccessTable, loginHistoryTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";

const router = Router();

async function requireAdmin(req: any, res: any, next: any) {
  const auth = getAuth(req);
  const userId = auth?.userId;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const [user] = await db.select().from(userAccessTable).where(eq(userAccessTable.clerkUserId, userId));
  if (!user || user.role !== "admin") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  next();
}

router.get("/users", requireAdmin, async (_req, res) => {
  const users = await db
    .select()
    .from(userAccessTable)
    .orderBy(desc(userAccessTable.createdAt));
  res.json(users.map(u => ({
    ...u,
    createdAt: u.createdAt.toISOString(),
    updatedAt: u.updatedAt.toISOString(),
  })));
});

router.patch("/users/:clerkUserId", requireAdmin, async (req, res) => {
  const { clerkUserId } = req.params;
  const { status } = req.body as { status: "approved" | "denied" | "pending" };
  if (!["approved", "denied", "pending"].includes(status)) {
    res.status(400).json({ error: "Invalid status" });
    return;
  }
  const [user] = await db
    .update(userAccessTable)
    .set({ status, updatedAt: new Date() })
    .where(eq(userAccessTable.clerkUserId, clerkUserId))
    .returning();
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json({ ...user, createdAt: user.createdAt.toISOString(), updatedAt: user.updatedAt.toISOString() });
});

router.patch("/users/:clerkUserId/role", requireAdmin, async (req, res) => {
  const { clerkUserId } = req.params;
  const { role } = req.body as { role: "admin" | "user" };
  if (!["admin", "user"].includes(role)) {
    res.status(400).json({ error: "Invalid role" });
    return;
  }
  const [user] = await db
    .update(userAccessTable)
    .set({ role, updatedAt: new Date() })
    .where(eq(userAccessTable.clerkUserId, clerkUserId))
    .returning();
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json({ ...user, createdAt: user.createdAt.toISOString(), updatedAt: user.updatedAt.toISOString() });
});

router.get("/login-history", requireAdmin, async (_req, res) => {
  const history = await db
    .select()
    .from(loginHistoryTable)
    .orderBy(desc(loginHistoryTable.loggedInAt))
    .limit(200);
  res.json(history.map(h => ({
    ...h,
    loggedInAt: h.loggedInAt.toISOString(),
  })));
});

export default router;
