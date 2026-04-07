import { Router } from "express";
import { db, subjectsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { CreateSubjectBody, UpdateSubjectParams, UpdateSubjectBody, DeleteSubjectParams } from "@workspace/api-zod";

const router = Router();

router.get("/", async (req, res) => {
  const subjects = await db.select().from(subjectsTable).orderBy(subjectsTable.name);
  res.json(subjects.map((s) => ({
    ...s,
    createdAt: s.createdAt.toISOString(),
  })));
});

router.post("/", async (req, res) => {
  const body = CreateSubjectBody.parse(req.body);
  const [subject] = await db.insert(subjectsTable).values(body).returning();
  res.status(201).json({ ...subject, createdAt: subject.createdAt.toISOString() });
});

router.put("/:id", async (req, res) => {
  const { id } = UpdateSubjectParams.parse(req.params);
  const body = UpdateSubjectBody.parse(req.body);
  const [subject] = await db.update(subjectsTable).set(body).where(eq(subjectsTable.id, id)).returning();
  if (!subject) {
    res.status(404).json({ error: "Subject not found" });
    return;
  }
  res.json({ ...subject, createdAt: subject.createdAt.toISOString() });
});

router.delete("/:id", async (req, res) => {
  const { id } = DeleteSubjectParams.parse(req.params);
  await db.delete(subjectsTable).where(eq(subjectsTable.id, id));
  res.status(204).send();
});

export default router;
