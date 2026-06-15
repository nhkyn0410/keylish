-- Aggregate-on-write page-view counters: one row per UTC hour (no raw events).
CREATE TABLE "TrafficHourly" (
    "hour" TIMESTAMP(3) NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrafficHourly_pkey" PRIMARY KEY ("hour")
);
