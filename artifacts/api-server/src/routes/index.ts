import { Router, type IRouter } from "express";
import healthRouter from "./health";
import subjectsRouter from "./subjects";
import scheduleRouter from "./schedule";
import tasksRouter from "./tasks";
import eventsRouter from "./events";
import notesRouter from "./notes";
import dashboardRouter from "./dashboard";
import authRouter from "./auth";
import adminRouter from "./admin";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/admin", adminRouter);
router.use("/subjects", subjectsRouter);
router.use("/schedule", scheduleRouter);
router.use("/tasks", tasksRouter);
router.use("/events", eventsRouter);
router.use("/notes", notesRouter);
router.use("/dashboard", dashboardRouter);

export default router;
