import { Controller, Get, Headers, HttpCode, Post, Query, UseGuards } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { AdminGuard } from "../auth/auth.guard";
import { TrafficService, type TrafficAnalyticsDto } from "./traffic.service";

@ApiTags("traffic")
@Controller({ path: "track", version: "1" })
export class TrafficController {
  constructor(private readonly trafficService: TrafficService) {}

  @Post()
  @HttpCode(204)
  @ApiOperation({ summary: "Record a page view (aggregate-on-write hourly counter)" })
  async track(@Headers("origin") origin?: string): Promise<void> {
    // Always 204 — the navigator.sendBeacon caller ignores the body, and we
    // don't reveal whether the hit was counted.
    await this.trafficService.track(origin);
  }
}

@ApiTags("admin-analytics")
@Controller("admin/analytics")
@UseGuards(AdminGuard)
export class AdminTrafficController {
  constructor(private readonly trafficService: TrafficService) {}

  @Get("traffic")
  @ApiOperation({ summary: "Hourly page-view buckets for the range" })
  @ApiOkResponse({ description: "Hourly page-view buckets (UTC) for the range." })
  traffic(@Query("days") days?: string): Promise<TrafficAnalyticsDto> {
    return this.trafficService.getTraffic(Number(days ?? 30));
  }
}
