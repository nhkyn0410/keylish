import { Module } from "@nestjs/common";
import { DatabaseModule } from "../database/database.module";
import { AuthModule } from "../auth/auth.module";
import { VocabController } from "./vocab.controller";
import { VocabService } from "./vocab.service";

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [VocabController],
  providers: [VocabService],
  exports: [VocabService],
})
export class VocabModule {}
