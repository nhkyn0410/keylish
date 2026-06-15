import { Module } from "@nestjs/common";
import { DatabaseModule } from "../database/database.module";
import { MailService } from "../mail/mail.service";
import { AuthController } from "./auth.controller";
import { AdminGuard, CsrfGuard, UserGuard } from "./auth.guard";
import { AuthService } from "./auth.service";

@Module({
  imports: [DatabaseModule],
  controllers: [AuthController],
  providers: [AuthService, MailService, UserGuard, AdminGuard, CsrfGuard],
  exports: [AuthService, UserGuard, AdminGuard, CsrfGuard],
})
export class AuthModule {}
