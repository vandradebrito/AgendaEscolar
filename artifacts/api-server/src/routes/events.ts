import { Router } from "express";
import { db, eventsTable, subjectsTable } from "@workspace/db";
import { eq, gte, desc } from "drizzle-orm";
import { ListEventsQueryParams, CreateEventBody, UpdateEventParams, UpdateEventBody, DeleteEventParams } from "@workspace/api-zod";

const router = Router();

router.get("/", async (req, res) => {
  const query = ListEventsQueryParams.parse(req.query);
  
  let events = await db
    .select({
      id: eventsTable.id,
      title: eventsTable.title,
      description: eventsTable.description,
      subjectId: eventsTable.subjectId,
      subjectName: subjectsTable.name,
      subjectColor: subjectsTable.color,
      date: eventsTable.date,
      type: eventsTable.type,
      createdAt: eventsTable.createdAt,
    })
    .from(eventsTable)
    .leftJoin(subjectsTable, eq(eventsTable.subjectId, subjectsTable.id))
    .orderBy(eventsTable.date);

  if (query.upcoming) {
    const today = new Date().toISOString().split("T")[0];
    events = events.filter(e => e.date >= today);
  }

  res.json(events.map(e => ({
    ...e,
    createdAt: e.createdAt.toISOString(),
    subjectName: e.subjectName ?? undefined,
    subjectColor: e.subjectColor ?? undefined,
  })));
});

router.post("/", async (req, res) => {
  const body = CreateEventBody.parse(req.body);
  const [event] = await db.insert(eventsTable).values(body).returning();
  
  const subject = event.subjectId
    ? await db.select().from(subjectsTable).where(eq(subjectsTable.id, event.subjectId)).limit(1)
    : [];
  
  res.status(201).json({
    ...event,
    createdAt: event.createdAt.toISOString(),
    subjectName: subject[0]?.name,
    subjectColor: subject[0]?.color,
  });
});

router.put("/:id", async (req, res) => {
  const { id } = UpdateEventParams.parse(req.params);
  const body = UpdateEventBody.parse(req.body);
  const [event] = await db.update(eventsTable).set(body).where(eq(eventsTable.id, id)).returning();
  if (!event) {
    res.status(404).json({ error: "Event not found" });
    return;
  }
  
  const subject = event.subjectId
    ? await db.select().from(subjectsTable).where(eq(subjectsTable.id, event.subjectId)).limit(1)
    : [];
  
  res.json({
    ...event,
    createdAt: event.createdAt.toISOString(),
    subjectName: subject[0]?.name,
    subjectColor: subject[0]?.color,
  });
});

router.delete("/:id", async (req, res) => {
  const { id } = DeleteEventParams.parse(req.params);
  await db.delete(eventsTable).where(eq(eventsTable.id, id));
  res.status(204).send();
});

export default router;
