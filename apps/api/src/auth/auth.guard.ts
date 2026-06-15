import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { AuthService } from "./auth.service";
import type { AdminSessionPayload, UserSessionPayload } from "./auth.dto";

export type Request = {
  cookies?: Record<string, string>;
  headers?: Record<string, string | string[] | undefined>;
  ip?: string;
  method?: string;
  originalUrl?: string;
  url?: string;
  get?(name: string): string | undefined;
};

type RequestWithAuth = Request & {
  userSession?: UserSessionPayload;
  adminSession?: AdminSessionPayload;
};

@Injectable()
export class UserGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<RequestWithAuth>();
    const session = await this.authService.authenticateUser(request);
    if (!session) throw new UnauthorizedException("Authentication required.");
    request.userSession = session;
    return true;
  }
}

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<RequestWithAuth>();
    const session = await this.authService.authenticateAdmin(request);
    if (!session) throw new UnauthorizedException("Authentication required.");
    request.adminSession = session;
    return true;
  }
}

@Injectable()
export class CsrfGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<RequestWithAuth>();
    const path = request.originalUrl ?? request.url ?? "";
    const domain = path.includes("/admin/") ? "admin" : "user";
    this.authService.assertCsrf(request, domain);
    return true;
  }
}
