import { CanActivate, ExecutionContext, Injectable, NotFoundException } from "@nestjs/common";

/**
 * Admin is a local-only internal tool (see doc/v2.1.1-admin-local.md).
 * Resolution order:
 *  - ADMIN_API_ENABLED="true"  -> on
 *  - ADMIN_API_ENABLED="false" -> off
 *  - unset -> on in dev, OFF in production (secure default: forgetting the env
 *    on a public deploy still keeps the admin surface closed).
 */
export function isAdminApiEnabled(): boolean {
  const flag = process.env.ADMIN_API_ENABLED?.trim().toLowerCase();
  if (flag === "true") return true;
  if (flag === "false") return false;
  return process.env.NODE_ENV !== "production";
}

function isAdminPath(path: string): boolean {
  return path.startsWith("/api/admin") || path.startsWith("/admin");
}

/**
 * Global guard that 404s every admin route (`/api/admin/*`, incl. `admin/login`)
 * when the admin API is disabled — hiding even the existence of the surface on
 * the public deployment. Registered via APP_GUARD so it is part of the module
 * graph (covered by e2e tests).
 */
@Injectable()
export class AdminGateGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{ originalUrl?: string; url?: string }>();
    const path = request.originalUrl ?? request.url ?? "";
    if (isAdminPath(path) && !isAdminApiEnabled()) {
      throw new NotFoundException();
    }
    return true;
  }
}
