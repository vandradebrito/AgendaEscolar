import { Router } from "express";
import { getAuth, clerkClient } from "@clerk/express";
import { db, userAccessTable, loginHistoryTable } from "@workspace/db";
import { eq, count } from "drizzle-orm";

const router = Router();

router.post("/login", async (req, res) => {
  const auth = getAuth(req);
  const userId = auth?.userId;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const clerkUser = await clerkClient.users.getUser(userId);
  const email = clerkUser.emailAddresses[0]?.emailAddress ?? "";
  const name = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || email;
  const imageUrl = clerkUser.imageUrl ?? null;

  const [totalUsers] = await db.select({ count: count() }).from(userAccessTable);
  const isFirst = (totalUsers?.count ?? 0) === 0;

  const [existing] = await db.select().from(userAccessTable).where(eq(userAccessTable.clerkUserId, userId));

  let userRecord;
  if (!existing) {
    const [inserted] = await db.insert(userAccessTable).values({
      clerkUserId: userId,
      email,
      name,
      imageUrl,
      role: isFirst ? "admin" : "user",
      status: isFirst ? "approved" : "pending",
    }).returning();
    userRecord = inserted;
  } else {
    const [updated] = await db.update(userAccessTable).set({
      email,
      name,
      imageUrl,
      updatedAt: new Date(),
    }).where(eq(userAccessTable.clerkUserId, userId)).returning();
    userRecord = updated;
  }

  await db.insert(loginHistoryTable).values({
    clerkUserId: userId,
    email,
    name,
    imageUrl,
  });

  res.json({
    status: userRecord.status,
    role: userRecord.role,
    name: userRecord.name,
    email: userRecord.email,
  });
});

router.get("/status", async (req, res) => {
  const auth = getAuth(req);
  const userId = auth?.userId;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const [userRecord] = await db.select().from(userAccessTable).where(eq(userAccessTable.clerkUserId, userId));
  if (!userRecord) {
    res.json({ status: "unknown", role: "user" });
    return;
  }

  res.json({ status: userRecord.status, role: userRecord.role });
});

export default router;
