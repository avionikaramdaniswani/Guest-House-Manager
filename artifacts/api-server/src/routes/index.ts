import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import roomsRouter from "./rooms";
import guestsRouter from "./guests";
import bookingsRouter from "./bookings";
import dashboardRouter from "./dashboard";
import reportsRouter from "./reports";
import activityRouter from "./activity";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(roomsRouter);
router.use(guestsRouter);
router.use(bookingsRouter);
router.use(dashboardRouter);
router.use(reportsRouter);
router.use(activityRouter);

export default router;
