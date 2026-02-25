import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Monitor stuck print jobs every 5 minutes
crons.interval(
  "monitor print jobs",
  { minutes: 5 },
  internal.printJobs.internal.monitorPrintJobs
);

// Clean up old print jobs daily at 2 AM UTC
crons.cron(
  "cleanup old print jobs",
  "0 2 * * *",
  internal.printJobs.internal.cleanupOldPrintJobs
);

export default crons;
