import { Router } from "express";
import { db, tasksTable, subjectsTable } from "@workspace/db";
import { eq, and, desc, isNull, or } from "drizzle-orm";
import { ListTasksQueryParams, CreateTaskBody, UpdateTaskParams, UpdateTaskBody, DeleteTaskParams } from "@workspace/api-zod";

const router = Router();

router.get("/", async (req, res) => {
  const query = ListTasksQueryParams.parse(req.query);
  let tasks = await db
    .select({
      id: tasksTable.id,
      title: tasksTable.title,
      description: tasksTable.description,
      subjectId: tasksTable.subjectId,
      subjectName: subjectsTable.name,
      subjectColor: subjectsTable.color,
      dueDate: tasksTable.dueDate,
      completed: tasksTable.completed,
      priority: tasksTable.priority,
      createdAt: tasksTable.createdAt,
    })
    .from(tasksTable)
    .leftJoin(subjectsTable, eq(tasksTable.subjectId, subjectsTable.id))
    .orderBy(desc(tasksTable.createdAt));

  if (query.status === "pending") {
    tasks = tasks.filter(t => !t.completed);
  } else if (query.status === "completed") {
    tasks = tasks.filter(t => t.completed);
  }

  res.json(tasks.map(t => ({
    ...t,
    createdAt: t.createdAt.toISOString(),
    subjectName: t.subjectName ?? undefined,
    subjectColor: t.subjectColor ?? undefined,
  })));
});

router.post("/", async (req, res) => {
  const body = CreateTaskBody.parse(req.body);
  const [task] = await db.insert(tasksTable).values({
    ...body,
    completed: false,
  }).returning();
  
  const subject = task.subjectId
    ? await db.select().from(subjectsTable).where(eq(subjectsTable.id, task.subjectId)).limit(1)
    : [];
  
  res.status(201).json({
    ...task,
    createdAt: task.createdAt.toISOString(),
    subjectName: subject[0]?.name,
    subjectColor: subject[0]?.color,
  });
});

router.put("/:id", async (req, res) => {
  const { id } = UpdateTaskParams.parse(req.params);
  const body = UpdateTaskBody.parse(req.body);
  const [task] = await db.update(tasksTable).set(body).where(eq(tasksTable.id, id)).returning();
  if (!task) {
    res.status(404).json({ error: "Task not found" });
    return;
  }
  
  const subject = task.subjectId
    ? await db.select().from(subjectsTable).where(eq(subjectsTable.id, task.subjectId)).limit(1)
    : [];
  
  res.json({
    ...task,
    createdAt: task.createdAt.toISOString(),
    subjectName: subject[0]?.name,
    subjectColor: subject[0]?.color,
  });
});

router.delete("/:id", async (req, res) => {
  const { id } = DeleteTaskParams.parse(req.params);
  await db.delete(tasksTable).where(eq(tasksTable.id, id));
  res.status(204).send();
});

export default router;
