import { Module } from "@nestjs/common";
import { DatabaseService } from "./database.service";
import { HealthController } from "./health.controller";
import { TopicsController } from "./topics.controller";
import { TopicsService } from "./topics.service";
import { VocabController } from "./vocab.controller";
import { VocabService } from "./vocab.service";

@Module({
  controllers: [HealthController, TopicsController, VocabController],
  providers: [DatabaseService, TopicsService, VocabService],
})
export class AppModule {}
