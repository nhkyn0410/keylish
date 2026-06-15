import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { AuthModule } from "./auth/auth.module";
import { HealthModule } from "./health/health.module";
import { TopicsModule } from "./topics/topics.module";
import { AdminModule } from "./admin/admin.module";
import { AdminGateGuard } from "./admin/admin-gate.guard";
import { TrafficModule } from "./traffic/traffic.module";
import { VocabModule } from "./vocab/vocab.module";

@Module({
  imports: [HealthModule, AuthModule, AdminModule, TopicsModule, VocabModule, TrafficModule],
  providers: [{ provide: APP_GUARD, useClass: AdminGateGuard }],
})
export class AppModule {}
