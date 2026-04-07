import { Router } from "express";
import { db, notesTable, subjectsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { CreateNoteBody, UpdateNoteParams, UpdateNoteBody, DeleteNoteParams } from "@workspace/api-zod";

const router = Router();

router.get("/", async (req, res) => {
  const notes = await db
    .select({
      id: notesTable.id,
      title: notesTable.title,
      content: notesTable.content,
      subjectId: notesTable.subjectId,
      subjectName: subjectsTable.name,
      subjectColor: subjectsTable.color,
      createdAt: notesTable.createdAt,
      updatedAt: notesTable.updatedAt,
    })
    .from(notesTable)
    .leftJoin(subjectsTable, eq(notesTable.subjectId, subjectsTable.id))
    .orderBy(desc(notesTable.updatedAt));

  res.json(notes.map(n => ({
    ...n,
    createdAt: n.createdAt.toISOString(),
    updatedAt: n.updatedAt.toISOString(),
    subjectName: n.subjectName ?? undefined,
    subjectColor: n.subjectColor ?? undefined,
  })));
});

router.post("/", async (req, res) => {
  const body = CreateNoteBody.parse(req.body);
  const [note] = await db.insert(notesTable).values(body).returning();
  
  const subject = note.subjectId
    ? await db.select().from(subjectsTable).where(eq(subjectsTable.id, note.subjectId)).limit(1)
    : [];
  
  res.status(201).json({
    ...note,
    createdAt: note.createdAt.toISOString(),
    updatedAt: note.updatedAt.toISOString(),
    subjectName: subject[0]?.name,
    subjectColor: subject[0]?.color,
  });
});

router.put("/:id", async (req, res) => {
  const { id } = UpdateNoteParams.parse(req.params);
  const body = UpdateNoteBody.parse(req.body);
  const [note] = await db.update(notesTable)
    .set({ ...body, updatedAt: new Date() })
    .where(eq(notesTable.id, id))
    .returning();
  if (!note) {
    res.status(404).json({ error: "Note not found" });
    return;
  }
  
  const subject = note.subjectId
    ? await db.select().from(subjectsTable).where(eq(subjectsTable.id, note.subjectId)).limit(1)
    : [];
  
  res.json({
    ...note,
    createdAt: note.createdAt.toISOString(),
    updatedAt: note.updatedAt.toISOString(),
    subjectName: subject[0]?.name,
    subjectColor: subject[0]?.color,
  });
});

router.delete("/:id", async (req, res) => {
  const { id } = DeleteNoteParams.parse(req.params);
  await db.delete(notesTable).where(eq(notesTable.id, id));
  res.status(204).send();
});

export default router;
