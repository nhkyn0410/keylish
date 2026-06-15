import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { DatabaseModule } from "../database/database.module";
import { TopicsModule } from "../topics/topics.module";
import { VocabModule } from "../vocab/vocab.module";
import { TrafficModule } from "../traffic/traffic.module";
import { AdminTopicsController } from "../topics/topics.controller";
import { AdminVocabController } from "../vocab/vocab.controller";
import { AdminTrafficController } from "../traffic/traffic.controller";
import { AdminController } from "./admin.controller";
import { AdminService } from "./admin.service";

// All admin routes live in this slice. The admin business controllers borrow
// TopicsService/VocabService/TrafficService from their (now exporting) modules.
// Admin auth routes (admin/login, admin/csrf, ...) stay in AuthController but
// are still gated by AdminGateGuard via their `/api/admin/*` path.
@Module({
  imports: [DatabaseModule, AuthModule, TopicsModule, VocabModule, TrafficModule],
  controllers: [AdminController, AdminTopicsController, AdminVocabController, AdminTrafficController],
  providers: [AdminService],
})
export class AdminModule {}
