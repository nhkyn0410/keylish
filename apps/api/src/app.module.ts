import { Module } from "@nestjs/common";
import { HealthModule } from "./health/health.module";
import { TopicsModule } from "./topics/topics.module";
import { VocabModule } from "./vocab/vocab.module";

@Module({
  imports: [HealthModule, TopicsModule, VocabModule],
})
export class AppModule {}
