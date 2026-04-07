import { Router } from "express";
import { db, tasksTable, eventsTable, subjectsTable, scheduleTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";

const router = Router();

router.get("/summary", async (req, res) => {
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  const dayOfWeek = today.getDay();

  const [allTasks, allEvents, allSubjects, allSchedule] = await Promise.all([
    db.select({
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
      .orderBy(tasksTable.dueDate),
    db.select({
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
      .orderBy(eventsTable.date),
    db.select().from(subjectsTable),
    db.select({
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
      .orderBy(scheduleTable.startTime),
  ]);

  const pendingTasks = allTasks.filter(t => !t.completed);
  const completedTasks = allTasks.filter(t => t.completed);
  const upcomingEvents = allEvents.filter(e => e.date >= todayStr);
  const todaySchedule = allSchedule.filter(s => s.dayOfWeek === dayOfWeek);

  const upcomingTasks = pendingTasks.slice(0, 5).map(t => ({
    ...t,
    createdAt: t.createdAt.toISOString(),
    subjectName: t.subjectName ?? undefined,
    subjectColor: t.subjectColor ?? undefined,
  }));

  const upcomingEventsFormatted = upcomingEvents.slice(0, 5).map(e => ({
    ...e,
    createdAt: e.createdAt.toISOString(),
    subjectName: e.subjectName ?? undefined,
    subjectColor: e.subjectColor ?? undefined,
  }));

  const todayScheduleFormatted = todaySchedule.map(s => ({
    ...s,
    subjectName: s.subjectName ?? "",
    subjectColor: s.subjectColor ?? "#6366f1",
  }));

  res.json({
    pendingTasksCount: pendingTasks.length,
    completedTasksCount: completedTasks.length,
    upcomingEventsCount: upcomingEvents.length,
    subjectsCount: allSubjects.length,
    upcomingTasks,
    upcomingEvents: upcomingEventsFormatted,
    todaySchedule: todayScheduleFormatted,
  });
});

export default router;
