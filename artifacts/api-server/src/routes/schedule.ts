import { Router } from "express";
import { db, scheduleTable, subjectsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { CreateScheduleEntryBody, UpdateScheduleEntryParams, UpdateScheduleEntryBody, DeleteScheduleEntryParams } from "@workspace/api-zod";

const router = Router();

async function getEntriesWithSubject() {
  return db
    .select({
      id: scheduleTable.id,
      subjectId: scheduleTable.subjectId,
      subjectName: subjectsTable.name,
      subjectColor: subjectsTable.color,
      dayOfWeek: scheduleTable.dayOfWeek,
      startTime: scheduleTable.startTime,
      endTime: scheduleTable.endTime,
      room: scheduleTable.room,
    })
    .from(scheduleTable)
    .leftJoin(subjectsTable, eq(scheduleTable.subjectId, subjectsTable.id))
    .orderBy(scheduleTable.dayOfWeek, scheduleTable.startTime);
}

router.get("/", async (req, res) => {
  const entries = await getEntriesWithSubject();
  res.json(entries.map(e => ({
    ...e,
    subjectName: e.subjectName ?? "",
    subjectColor: e.subjectColor ?? "#6366f1",
  })));
});

router.post("/", async (req, res) => {
  const body = CreateScheduleEntryBody.parse(req.body);
  const [entry] = await db.insert(scheduleTable).values(body).returning();
  const subject = await db.select().from(subjectsTable).where(eq(subjectsTable.id, entry.subjectId)).limit(1);
  res.status(201).json({
    id: entry.id,
    subjectId: entry.subjectId,
    subjectName: subject[0]?.name ?? "",
    subjectColor: subject[0]?.color ?? "#6366f1",
    dayOfWeek: entry.dayOfWeek,
    startTime: entry.startTime,
    endTime: entry.endTime,
    room: entry.room,
  });
});

router.put("/:id", async (req, res) => {
  const { id } = UpdateScheduleEntryParams.parse(req.params);
  const body = UpdateScheduleEntryBody.parse(req.body);
  const [entry] = await db.update(scheduleTable).set(body).where(eq(scheduleTable.id, id)).returning();
  if (!entry) {
    res.status(404).json({ error: "Schedule entry not found" });
    return;
  }
  const subject = await db.select().from(subjectsTable).where(eq(subjectsTable.id, entry.subjectId)).limit(1);
  res.json({
    id: entry.id,
    subjectId: entry.subjectId,
    subjectName: subject[0]?.name ?? "",
    subjectColor: subject[0]?.color ?? "#6366f1",
    dayOfWeek: entry.dayOfWeek,
    startTime: entry.startTime,
    endTime: entry.endTime,
    room: entry.room,
  });
});

router.delete("/:id", async (req, res) => {
  const { id } = DeleteScheduleEntryParams.parse(req.params);
  await db.delete(scheduleTable).where(eq(scheduleTable.id, id));
  res.status(204).send();
});

export default router;
