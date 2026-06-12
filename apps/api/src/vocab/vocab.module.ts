import { Module } from "@nestjs/common";
import { DatabaseModule } from "../database/database.module";
import { VocabController } from "./vocab.controller";
import { VocabService } from "./vocab.service";

@Module({
  imports: [DatabaseModule],
  controllers: [VocabController],
  providers: [VocabService],
})
export class VocabModule {}
