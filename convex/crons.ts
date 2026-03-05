import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Clean up old print jobs daily at 2 AM UTC
crons.cron(
  "cleanup old print jobs",
  "0 2 * * *",
  internal.printJobs.internal.cleanupOldPrintJobs
);

export default crons;
