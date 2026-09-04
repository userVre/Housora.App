import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Bounded cache cleanup — runs daily at 03:00 UTC, deletes up to 200 expired/old global rows per run
// Uses internal mutation (no serverKey) so it can be scheduled without webhook secret
crons.daily(
  "cleanup expired caches",
  { hourUTC: 3, minuteUTC: 0 },
  internal.jobs.cleanupExpiredCachesInternal,
  { limit: 200 },
);
crons.daily(
  "cleanup orphan assets",
  { hourUTC: 4, minuteUTC: 0 },
  internal.jobs.cleanupOrphanAssetsInternal,
  { limit: 100 },
);

export default crons;
