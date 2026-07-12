import compression from "compression";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env.js";
import { errorMiddleware } from "./errors.js";
import { allocationsRouter } from "./routes/allocations.js";
import { assetsRouter } from "./routes/assets.js";
import { auditsRouter } from "./routes/audits.js";
import { bookingsRouter } from "./routes/bookings.js";
import { healthRouter } from "./routes/health.js";
import { maintenanceRouter } from "./routes/maintenance.js";
import { notificationsRouter } from "./routes/notifications.js";
import { orgRouter } from "./routes/org.js";
import { reportsRouter } from "./routes/reports.js";
import { transfersRouter } from "./routes/transfers.js";

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: env.FRONTEND_ORIGIN, credentials: true }));
  app.use(express.json({ limit: "1mb" }));
  app.use(compression());
  app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));

  app.use("/health", healthRouter);
  app.use("/api/org", orgRouter);
  app.use("/api/assets", assetsRouter);
  app.use("/api/allocations", allocationsRouter);
  app.use("/api/bookings", bookingsRouter);
  app.use("/api/maintenance", maintenanceRouter);
  app.use("/api/transfers", transfersRouter);
  app.use("/api/audits", auditsRouter);
  app.use("/api/reports", reportsRouter);
  app.use("/api/notifications", notificationsRouter);

  app.use(errorMiddleware);

  return app;
}
