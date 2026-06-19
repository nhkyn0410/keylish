import { Module } from "@nestjs/common";
import { DatabaseModule } from "../database/database.module";
import { AuthModule } from "../auth/auth.module";
import { UserVocabController } from "./uservocab.controller";
import { UserVocabService } from "./uservocab.service";

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [UserVocabController],
  providers: [UserVocabService],
})
export class UserVocabModule {}
