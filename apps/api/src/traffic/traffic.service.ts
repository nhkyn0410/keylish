import { Injectable } from "@nestjs/common";
import { DatabaseService } from "../database/database.service";

export type TrafficBucketDto = { hour: string; count: number };
export type TrafficAnalyticsDto = {
  rangeDays: number;
  totalViews: number;
  buckets: TrafficBucketDto[];
};

// Origins allowed to contribute page views. Reuses the auth allow-list so only
// the real web front-end counts; non-browser callers (no/forged Origin) are
// dropped. A determined client can still spoof Origin — acceptable for an
// internal pageview counter.
function allowedOrigins(): Set<string> {
  const configured =
    (process.env.AUTH_ALLOWED_ORIGINS ?? process.env.CORS_ORIGIN)
      ?.split(",")
      .map((origin) => origin.trim())
      .filter(Boolean) ?? [];
  const local =
    process.env.NODE_ENV === "production"
      ? []
      : ["http://localhost:3001", "http://localhost:3002"];
  return new Set([...configured, ...local]);
}

function currentHourBucket(now = Date.now()): Date {
  // Truncate epoch millis to the UTC hour boundary.
  return new Date(Math.floor(now / 3_600_000) * 3_600_000);
}

@Injectable()
export class TrafficService {
  constructor(private readonly database: DatabaseService) {}

  async track(origin: string | undefined): Promise<{ counted: boolean }> {
    if (!origin || !allowedOrigins().has(origin)) return { counted: false };

    const hour = currentHourBucket();
    await this.database.client.trafficHourly.upsert({
      where: { hour },
      create: { hour, count: 1 },
      update: { count: { increment: 1 } },
    });
    return { counted: true };
  }

  async getTraffic(days: number): Promise<TrafficAnalyticsDto> {
    const rangeDays = Math.min(Math.max(Math.trunc(days) || 30, 1), 90);
    const since = new Date(Date.now() - rangeDays * 24 * 3_600_000);

    const rows = await this.database.client.trafficHourly.findMany({
      where: { hour: { gte: since } },
      orderBy: { hour: "asc" },
      select: { hour: true, count: true },
    });

    const buckets = rows.map((row) => ({ hour: row.hour.toISOString(), count: row.count }));
    const totalViews = buckets.reduce((sum, bucket) => sum + bucket.count, 0);
    return { rangeDays, totalViews, buckets };
  }
}
