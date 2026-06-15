import { Module } from "@nestjs/common";
import { DatabaseModule } from "../database/database.module";
import { TrafficController } from "./traffic.controller";
import { TrafficService } from "./traffic.service";

// Registers the PUBLIC page-view ingest route (/api/v1/track). The admin read
// route lives in AdminModule (local-only slice), which imports this module for
// TrafficService.
@Module({
  imports: [DatabaseModule],
  controllers: [TrafficController],
  providers: [TrafficService],
  exports: [TrafficService],
})
export class TrafficModule {}
