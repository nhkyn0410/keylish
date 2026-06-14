import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  UnauthorizedException,
  type OnModuleDestroy,
  type OnModuleInit,
} from "@nestjs/common";
import { createHmac, randomBytes } from "node:crypto";
import argon2 from "argon2";
import { AuthProvider, Prisma } from "@keylish/db";
import { z } from "zod";
import { DatabaseService } from "../database/database.service";
import { MailService } from "../mail/mail.service";
import {
  AdminLoginSchema,
  ForgotPasswordSchema,
  PasswordChangeSchema,
  ResetPasswordSchema,
  UpdateProfileSchema,
  UserLoginSchema,
  UserRegisterSchema,
  type AdminLoginDto,
  type AdminSessionPayload,
  type AuthDomain,
  type ForgotPasswordDto,
  type PasswordChangeDto,
  type ResetPasswordDto,
  type UpdateProfileDto,
  type UserLoginDto,
  type UserProfileDto,
  type UserRegisterDto,
  type UserSessionPayload,
} from "./auth.dto";

type AuthCookieSet = {
  session: string;
  csrf: string;
};

const DEFAULT_TOKEN_PEPPER = "keylish-dev-token-pepper";
const USER_SESSION_NAME_DEV = "user";
const ADMIN_SESSION_NAME_DEV = "admin";
const USER_CSRF_NAME_DEV = "u-csrf";
const ADMIN_CSRF_NAME_DEV = "a-csrf";
const USER_SESSION_NAME = "__Host-user";
const ADMIN_SESSION_NAME = "__Host-admin";
const USER_CSRF_NAME = "__Host-u-csrf";
const ADMIN_CSRF_NAME = "__Host-a-csrf";
const UNSAFE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);
// Don't write `lastSeenAt` on every request — only when it is this stale.
const SESSION_TOUCH_INTERVAL_MS = 10 * 60 * 1000;
// Background cleanup cadence + how long revoked sessions are retained for audit.
const PURGE_INTERVAL_MS = 24 * 60 * 60 * 1000;
const REVOKED_RETENTION_MS = 7 * 24 * 60 * 60 * 1000;

export type AuthSessionKind = "user" | "admin";

type RequestLike = {
  cookies?: Record<string, string>;
  headers?: Record<string, string | string[] | undefined>;
  ip?: string;
  method?: string;
  get?(name: string): string | undefined;
};

type ResponseLike = {
  cookie(name: string, value: string, options?: Record<string, unknown>): unknown;
  clearCookie(name: string, options?: Record<string, unknown>): unknown;
};

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function normalizeUsername(value: string) {
  return value.trim().toLowerCase();
}

function hashWithPepper(
  value: string,
  pepper = process.env.AUTH_TOKEN_PEPPER ?? DEFAULT_TOKEN_PEPPER
) {
  return createHmac("sha256", pepper).update(value).digest("hex");
}

function encodeRandomToken() {
  return randomBytes(32).toString("base64url");
}

function isProduction() {
  return process.env.NODE_ENV === "production";
}

function allowedOrigins() {
  const configured = (process.env.AUTH_ALLOWED_ORIGINS ?? process.env.CORS_ORIGIN)
    ?.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
  const localOrigins = isProduction() ? [] : ["http://localhost:3000", "http://localhost:3002"];
  return new Set([...(configured ?? []), ...localOrigins]);
}

function originFromReferer(value: string | undefined) {
  if (!value) return undefined;
  try {
    return new URL(value).origin;
  } catch {
    return undefined;
  }
}

function cookieNames(domain: AuthDomain) {
  const prod = isProduction();
  if (domain === "admin") {
    return {
      session: prod ? ADMIN_SESSION_NAME : ADMIN_SESSION_NAME_DEV,
      csrf: prod ? ADMIN_CSRF_NAME : ADMIN_CSRF_NAME_DEV,
    };
  }

  return {
    session: prod ? USER_SESSION_NAME : USER_SESSION_NAME_DEV,
    csrf: prod ? USER_CSRF_NAME : USER_CSRF_NAME_DEV,
  };
}

function cookieSameSite(): "lax" | "strict" | "none" {
  const raw = process.env.AUTH_COOKIE_SAMESITE?.trim().toLowerCase();
  if (raw === "lax" || raw === "strict" || raw === "none") return raw;
  // Default to cross-site capable cookies in production (split web/API domains),
  // and the stricter Lax locally where everything is same-site on localhost.
  return isProduction() ? "none" : "lax";
}

function cookieSecure() {
  // `SameSite=None` is only honored by browsers when the cookie is also Secure.
  return isProduction() || cookieSameSite() === "none";
}

function cookieBase(maxAgeSeconds?: number) {
  return {
    httpOnly: false,
    sameSite: cookieSameSite(),
    secure: cookieSecure(),
    path: "/",
    maxAge: maxAgeSeconds ? maxAgeSeconds * 1000 : undefined,
  };
}

function sessionCookieBase(maxAgeSeconds?: number) {
  return {
    httpOnly: true,
    sameSite: cookieSameSite(),
    secure: cookieSecure(),
    path: "/",
    maxAge: maxAgeSeconds ? maxAgeSeconds * 1000 : undefined,
  };
}

function sessionTtlSeconds(domain: AuthDomain) {
  if (domain === "admin") {
    const hours = Number(process.env.ADMIN_SESSION_TTL_HOURS ?? 12);
    return hours * 60 * 60;
  }

  const days = Number(process.env.USER_SESSION_TTL_DAYS ?? 30);
  return days * 24 * 60 * 60;
}

function csrfCookieName(domain: AuthDomain) {
  return cookieNames(domain).csrf;
}

function sessionCookieName(domain: AuthDomain) {
  return cookieNames(domain).session;
}

function ensureString(value: string | undefined) {
  if (!value) throw new UnauthorizedException("Authentication required.");
  return value;
}

function rateLimitWindow(key: string, limit: number, windowMs: number) {
  return key + ":" + limit + ":" + windowMs;
}

@Injectable()
export class AuthService implements OnModuleInit, OnModuleDestroy {
  private readonly attempts = new Map<string, { count: number; resetAt: number }>();
  private readonly logger = new Logger(AuthService.name);
  private purgeTimer: ReturnType<typeof setInterval> | null = null;
  private dummyHashPromise: Promise<string> | null = null;

  constructor(
    private readonly database: DatabaseService,
    private readonly mail: MailService
  ) {}

  onModuleInit() {
    void this.purgeExpired();
    this.purgeTimer = setInterval(() => void this.purgeExpired(), PURGE_INTERVAL_MS);
    this.purgeTimer.unref?.();
  }

  onModuleDestroy() {
    if (this.purgeTimer) clearInterval(this.purgeTimer);
    this.purgeTimer = null;
  }

  async purgeExpired() {
    try {
      const now = new Date();
      const revokedCutoff = new Date(Date.now() - REVOKED_RETENTION_MS);
      await this.database.client.userSession.deleteMany({
        where: { OR: [{ expiresAt: { lt: now } }, { revokedAt: { lt: revokedCutoff } }] },
      });
      await this.database.client.adminSession.deleteMany({
        where: { OR: [{ expiresAt: { lt: now } }, { revokedAt: { lt: revokedCutoff } }] },
      });
      await this.database.client.userAuthToken.deleteMany({
        where: { OR: [{ expiresAt: { lt: now } }, { usedAt: { not: null } }] },
      });
    } catch (error) {
      this.logger.warn(
        "purgeExpired failed: " + (error instanceof Error ? error.message : String(error))
      );
    }
  }

  async hashPassword(password: string) {
    const memoryCost = Number(process.env.AUTH_ARGON2_MEMORY_KIB ?? 19456);
    const timeCost = Number(process.env.AUTH_ARGON2_ITERATIONS ?? 2);
    const parallelism = Number(process.env.AUTH_ARGON2_PARALLELISM ?? 1);

    return argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost,
      timeCost,
      parallelism,
    });
  }

  async verifyPassword(password: string, passwordHash: string) {
    return argon2.verify(passwordHash, password);
  }

  createToken() {
    return encodeRandomToken();
  }

  hashToken(token: string) {
    return hashWithPepper(token);
  }

  // Verifying against a fixed dummy hash equalizes login response time whether or
  // not the account exists, removing the timing oracle for user enumeration.
  private async getDummyHash() {
    if (!this.dummyHashPromise) {
      this.dummyHashPromise = this.hashPassword("keylish-timing-equalizer-placeholder");
    }
    return this.dummyHashPromise;
  }

  private async absorbDummyVerify(password: string) {
    try {
      await this.verifyPassword(password, await this.getDummyHash());
    } catch {
      // Ignore — this only burns comparable CPU time.
    }
  }

  issueCookieSet(_domain: AuthDomain): AuthCookieSet {
    return {
      session: this.createToken(),
      csrf: this.createToken(),
    };
  }

  issueCsrfToken() {
    return this.createToken();
  }

  setCsrfCookie(response: ResponseLike, domain: AuthDomain, csrfToken: string) {
    response.cookie(csrfCookieName(domain), csrfToken, cookieBase(sessionTtlSeconds(domain)));
  }

  setSessionCookies(
    response: ResponseLike,
    domain: AuthDomain,
    sessionToken: string,
    csrfToken: string
  ) {
    this.setAuthCookies(response, domain, sessionToken, csrfToken);
  }

  clearSessionCookies(response: ResponseLike, domain: AuthDomain) {
    this.clearAuthCookies(response, domain);
  }

  parseUserRegister(input: unknown): UserRegisterDto {
    return this.parseWithSchema(UserRegisterSchema, input);
  }

  parseUserLogin(input: unknown): UserLoginDto {
    return this.parseWithSchema(UserLoginSchema, input);
  }

  parseAdminLogin(input: unknown): AdminLoginDto {
    return this.parseWithSchema(AdminLoginSchema, input);
  }

  parsePasswordChange(input: unknown): PasswordChangeDto {
    return this.parseWithSchema(PasswordChangeSchema, input);
  }

  parseForgotPassword(input: unknown): ForgotPasswordDto {
    return this.parseWithSchema(ForgotPasswordSchema, input);
  }

  parseResetPassword(input: unknown): ResetPasswordDto {
    return this.parseWithSchema(ResetPasswordSchema, input);
  }

  parseUpdateProfile(input: unknown): UpdateProfileDto {
    return this.parseWithSchema(UpdateProfileSchema, input);
  }

  assertCsrf(request: RequestLike, domain: AuthDomain) {
    const method = request.method?.toUpperCase();
    if (!method || !UNSAFE_METHODS.has(method)) return;

    this.assertRequestOrigin(request);

    const names = cookieNames(domain);
    const cookieValue = request.cookies?.[names.csrf];
    const headerValue = request.get?.("x-csrf-token") ?? this.readHeader(request, "x-csrf-token");

    if (!cookieValue || !headerValue || cookieValue !== headerValue) {
      throw new ForbiddenException("Invalid CSRF token.");
    }
  }

  setAuthCookies(response: ResponseLike, domain: AuthDomain, token: string, csrfToken: string) {
    const names = cookieNames(domain);
    const ttl = sessionTtlSeconds(domain);

    response.cookie(names.session, token, sessionCookieBase(ttl));
    response.cookie(names.csrf, csrfToken, cookieBase(ttl));
  }

  clearAuthCookies(response: ResponseLike, domain: AuthDomain) {
    const names = cookieNames(domain);

    response.clearCookie(names.session, { path: "/" });
    response.clearCookie(names.csrf, { path: "/" });
  }

  async registerUser(input: unknown, request: RequestLike) {
    this.assertRateLimit("user:register:" + this.rateKey(request), 10, 15 * 60 * 1000);

    const body = this.parseUserRegister(input);
    const emailNormalized = normalizeEmail(body.email);
    this.assertRateLimit("user:register:acct:" + emailNormalized, 5, 60 * 60 * 1000);

    const passwordHash = await this.hashPassword(body.password);
    const csrf = this.issueCookieSet("user");
    const tokenHash = this.hashToken(csrf.session);
    const expiresAt = new Date(Date.now() + sessionTtlSeconds("user") * 1000);

    let user;
    try {
      user = await this.database.client.$transaction(async (tx) => {
        return tx.user.create({
          data: {
            email: body.email,
            emailNormalized,
            displayName: body.displayName ?? null,
            avatarUrl: null,
            identities: {
              create: {
                provider: AuthProvider.PASSWORD,
                providerId: emailNormalized,
                passwordHash,
              },
            },
            sessions: {
              create: {
                tokenHash,
                userAgent: this.userAgent(request),
                ipHash: this.ipHash(request),
                expiresAt,
              },
            },
          },
          select: { id: true, email: true, displayName: true, avatarUrl: true },
        });
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new ConflictException("Email is already registered.");
      }
      throw error;
    }

    return { user, csrf, token: csrf.session };
  }

  async loginUser(input: unknown, request: RequestLike) {
    this.assertRateLimit("user:login:" + this.rateKey(request), 20, 15 * 60 * 1000);

    const body = this.parseUserLogin(input);
    return this.loginByEmail(body.email, body.password, request);
  }

  async loginAdmin(input: unknown, request: RequestLike) {
    this.assertRateLimit("admin:login:" + this.rateKey(request), 20, 15 * 60 * 1000);

    const body = this.parseAdminLogin(input);
    const username = normalizeUsername(body.username);
    if (username.includes("@")) {
      await this.absorbDummyVerify(body.password);
      throw new UnauthorizedException("Invalid credentials.");
    }

    this.assertRateLimit("admin:login:acct:" + username, 10, 15 * 60 * 1000);

    const admin = await this.database.client.admin.findUnique({
      where: { usernameNormalized: username },
      include: { identities: true },
    });
    const identity = admin?.identities.find((item) => item.provider === AuthProvider.PASSWORD);

    if (!admin || !identity) {
      await this.absorbDummyVerify(body.password);
      throw new UnauthorizedException("Invalid credentials.");
    }

    const verified = await this.verifyPassword(body.password, identity.passwordHash);
    if (!verified) {
      throw new UnauthorizedException("Invalid credentials.");
    }

    const csrf = this.issueCookieSet("admin");
    const tokenHash = this.hashToken(csrf.session);
    const expiresAt = new Date(Date.now() + sessionTtlSeconds("admin") * 1000);

    await this.database.client.adminSession.create({
      data: {
        adminId: admin.id,
        tokenHash,
        userAgent: this.userAgent(request),
        ipHash: this.ipHash(request),
        expiresAt,
      },
    });

    return { ok: true as const, csrf, token: csrf.session };
  }

  async logoutUser(session: UserSessionPayload) {
    await this.database.client.userSession.update({
      where: { id: session.id },
      data: { revokedAt: new Date() },
    });
  }

  async logoutAdmin(session: AdminSessionPayload) {
    await this.database.client.adminSession.update({
      where: { id: session.id },
      data: { revokedAt: new Date() },
    });
  }

  async logoutAllUserSessions(userId: string) {
    await this.database.client.userSession.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async logoutAllAdminSessions(adminId: string) {
    await this.database.client.adminSession.updateMany({
      where: { adminId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async getUserProfile(session: UserSessionPayload): Promise<UserProfileDto> {
    const user = await this.database.client.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        email: true,
        displayName: true,
        avatarUrl: true,
        status: true,
        deletedAt: true,
      },
    });

    if (!user || user.deletedAt || user.status !== "ACTIVE") {
      throw new UnauthorizedException("Authentication required.");
    }

    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
    };
  }

  async updateUserProfile(session: UserSessionPayload, input: unknown) {
    const body = this.parseUpdateProfile(input);

    return this.database.client.user.update({
      where: { id: session.userId },
      data: {
        displayName: body.displayName ?? null,
        avatarUrl: body.avatarUrl === undefined ? undefined : body.avatarUrl,
      },
      select: { id: true, email: true, displayName: true, avatarUrl: true },
    });
  }

  async changeUserPassword(session: UserSessionPayload, input: unknown, request: RequestLike) {
    const body = this.parsePasswordChange(input);
    const current = await this.getUserIdentity(session.userId);
    const ok = await this.verifyPassword(body.currentPassword, current.passwordHash);
    if (!ok) throw new UnauthorizedException("Invalid credentials.");

    const newHash = await this.hashPassword(body.newPassword);
    const csrf = this.issueCookieSet("user");
    const tokenHash = this.hashToken(csrf.session);
    const expiresAt = new Date(Date.now() + sessionTtlSeconds("user") * 1000);

    await this.database.client.$transaction(async (tx) => {
      await tx.userIdentity.update({
        where: { id: current.id },
        data: { passwordHash: newHash },
      });
      // Revoke all sessions (signs out other devices), then mint a fresh one so
      // the device that changed the password stays signed in.
      await tx.userSession.updateMany({
        where: { userId: session.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      await tx.userSession.create({
        data: {
          userId: session.userId,
          tokenHash,
          userAgent: this.userAgent(request),
          ipHash: this.ipHash(request),
          expiresAt,
        },
      });
    });

    return { ok: true as const, csrf, token: csrf.session };
  }

  async changeAdminPassword(session: AdminSessionPayload, input: unknown, request: RequestLike) {
    const body = this.parsePasswordChange(input);
    const current = await this.getAdminIdentity(session.adminId);
    const ok = await this.verifyPassword(body.currentPassword, current.passwordHash);
    if (!ok) throw new UnauthorizedException("Invalid credentials.");

    const newHash = await this.hashPassword(body.newPassword);
    const csrf = this.issueCookieSet("admin");
    const tokenHash = this.hashToken(csrf.session);
    const expiresAt = new Date(Date.now() + sessionTtlSeconds("admin") * 1000);

    await this.database.client.$transaction(async (tx) => {
      await tx.adminIdentity.update({
        where: { id: current.id },
        data: { passwordHash: newHash },
      });
      await tx.admin.update({
        where: { id: session.adminId },
        data: { passwordChangedAt: new Date() },
      });
      await tx.adminSession.updateMany({
        where: { adminId: session.adminId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      await tx.adminSession.create({
        data: {
          adminId: session.adminId,
          tokenHash,
          userAgent: this.userAgent(request),
          ipHash: this.ipHash(request),
          expiresAt,
        },
      });
    });

    return { ok: true as const, csrf, token: csrf.session };
  }

  async forgotPassword(input: unknown, request: RequestLike) {
    this.assertRateLimit("user:forgot:" + this.rateKey(request), 5, 60 * 60 * 1000);

    const body = this.parseForgotPassword(input);
    const emailNormalized = normalizeEmail(body.email);
    this.assertRateLimit("user:forgot:acct:" + emailNormalized, 5, 60 * 60 * 1000);

    const user = await this.database.client.user.findUnique({
      where: { emailNormalized },
      select: { id: true, status: true, deletedAt: true },
    });

    if (!user || user.deletedAt || user.status !== "ACTIVE") return { ok: true as const };

    const token = this.createToken();
    await this.database.client.userAuthToken.create({
      data: {
        userId: user.id,
        purpose: "password-reset",
        tokenHash: this.hashToken(token),
        expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000),
      },
    });

    await this.mail.sendPasswordReset(body.email, token);

    return {
      ok: true as const,
      token: process.env.AUTH_EXPOSE_RESET_TOKEN === "true" ? token : undefined,
    };
  }

  async resetPassword(input: unknown, request: RequestLike) {
    this.assertRateLimit("user:reset:" + this.rateKey(request), 5, 60 * 60 * 1000);

    const body = this.parseResetPassword(input);
    const tokenHash = this.hashToken(body.token);
    const found = await this.database.client.userAuthToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (
      !found ||
      found.usedAt ||
      found.expiresAt < new Date() ||
      found.user.deletedAt ||
      found.user.status !== "ACTIVE"
    ) {
      throw new UnauthorizedException("Invalid credentials.");
    }

    const newHash = await this.hashPassword(body.password);
    await this.database.client.$transaction(async (tx) => {
      await tx.userIdentity.updateMany({
        where: {
          userId: found.userId,
          provider: AuthProvider.PASSWORD,
          providerId: found.user.emailNormalized,
        },
        data: { passwordHash: newHash },
      });
      await tx.userAuthToken.update({
        where: { id: found.id },
        data: { usedAt: new Date() },
      });
      await tx.userSession.updateMany({
        where: { userId: found.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    });

    return { ok: true as const };
  }

  async authenticateUser(request: RequestLike): Promise<UserSessionPayload> {
    const token = ensureString(this.readSessionCookie(request, "user"));
    const record = await this.getUserSessionFromToken(token);

    if (
      !record ||
      record.revokedAt ||
      record.expiresAt <= new Date() ||
      !record.user ||
      record.user.deletedAt ||
      record.user.status !== "ACTIVE"
    ) {
      throw new UnauthorizedException("Authentication required.");
    }

    if (this.shouldTouch(record.lastSeenAt)) {
      await this.touchUserSession(record.id);
    }

    return {
      id: record.id,
      userId: record.userId,
      tokenHash: record.tokenHash,
      expiresAt: record.expiresAt,
      revokedAt: record.revokedAt,
    };
  }

  async authenticateAdmin(request: RequestLike): Promise<AdminSessionPayload> {
    const token = ensureString(this.readSessionCookie(request, "admin"));
    const record = await this.getAdminSessionFromToken(token);

    if (!record || record.revokedAt || record.expiresAt <= new Date() || !record.admin) {
      throw new UnauthorizedException("Authentication required.");
    }

    if (this.shouldTouch(record.lastSeenAt)) {
      await this.touchAdminSession(record.id);
    }

    return {
      id: record.id,
      adminId: record.adminId,
      tokenHash: record.tokenHash,
      expiresAt: record.expiresAt,
      revokedAt: record.revokedAt,
    };
  }

  async readAdminSession(request: RequestLike): Promise<AdminSessionPayload> {
    return this.authenticateAdmin(request);
  }

  async readUserSession(request: RequestLike): Promise<UserSessionPayload> {
    return this.authenticateUser(request);
  }

  async seedAdmin(username: string, password: string) {
    const usernameNormalized = normalizeUsername(username);
    const passwordHash = await this.hashPassword(password);
    const existing = await this.database.client.admin.findUnique({
      where: { usernameNormalized },
      select: { id: true },
    });

    if (existing) return { created: false as const, username: usernameNormalized };

    await this.database.client.$transaction(async (tx) => {
      const admin = await tx.admin.create({
        data: {
          username,
          usernameNormalized,
        },
      });

      await tx.adminIdentity.create({
        data: {
          adminId: admin.id,
          provider: AuthProvider.PASSWORD,
          providerId: usernameNormalized,
          passwordHash,
        },
      });
    });

    return { created: true as const, username: usernameNormalized };
  }

  private parseWithSchema<T>(schema: z.ZodType<T>, input: unknown): T {
    const parsed = schema.safeParse(input);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.message);
    }
    return parsed.data;
  }

  private async loginByEmail(email: string, password: string, request: RequestLike) {
    const emailNormalized = normalizeEmail(email);
    this.assertRateLimit("user:login:acct:" + emailNormalized, 10, 15 * 60 * 1000);

    const user = await this.database.client.user.findUnique({
      where: { emailNormalized },
      include: { identities: true },
    });
    const identity = user?.identities.find((item) => item.provider === AuthProvider.PASSWORD);

    if (!user || !identity || user.deletedAt || user.status !== "ACTIVE") {
      await this.absorbDummyVerify(password);
      throw new UnauthorizedException("Invalid credentials.");
    }

    const verified = await this.verifyPassword(password, identity.passwordHash);
    if (!verified) {
      throw new UnauthorizedException("Invalid credentials.");
    }

    const csrf = this.issueCookieSet("user");
    const tokenHash = this.hashToken(csrf.session);
    const expiresAt = new Date(Date.now() + sessionTtlSeconds("user") * 1000);

    await this.database.client.userSession.create({
      data: {
        userId: user.id,
        tokenHash,
        userAgent: this.userAgent(request),
        ipHash: this.ipHash(request),
        expiresAt,
      },
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
      },
      csrf,
      token: csrf.session,
    };
  }

  private async getUserSessionFromToken(token: string) {
    return this.database.client.userSession.findUnique({
      where: { tokenHash: this.hashToken(token) },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            displayName: true,
            avatarUrl: true,
            status: true,
            deletedAt: true,
          },
        },
      },
    });
  }

  private async getAdminSessionFromToken(token: string) {
    return this.database.client.adminSession.findUnique({
      where: { tokenHash: this.hashToken(token) },
      include: { admin: { select: { id: true, username: true, usernameNormalized: true } } },
    });
  }

  private shouldTouch(lastSeenAt: Date | null | undefined) {
    if (!lastSeenAt) return true;
    return Date.now() - lastSeenAt.getTime() > SESSION_TOUCH_INTERVAL_MS;
  }

  private async touchUserSession(id: string) {
    await this.database.client.userSession.update({
      where: { id },
      data: { lastSeenAt: new Date() },
    });
  }

  private async touchAdminSession(id: string) {
    await this.database.client.adminSession.update({
      where: { id },
      data: { lastSeenAt: new Date() },
    });
  }

  private async getUserIdentity(userId: string) {
    const identity = await this.database.client.userIdentity.findFirst({
      where: { userId, provider: AuthProvider.PASSWORD },
    });

    if (!identity) throw new UnauthorizedException("Authentication required.");

    return identity;
  }

  private async getAdminIdentity(adminId: string) {
    const identity = await this.database.client.adminIdentity.findFirst({
      where: { adminId, provider: AuthProvider.PASSWORD },
    });

    if (!identity) throw new UnauthorizedException("Authentication required.");

    return identity;
  }

  private assertRequestOrigin(request: RequestLike) {
    const origin =
      this.readHeader(request, "origin") ?? originFromReferer(this.readHeader(request, "referer"));
    if (!origin) {
      if (isProduction()) throw new ForbiddenException("Invalid request origin.");
      return;
    }

    if (!allowedOrigins().has(origin)) {
      throw new ForbiddenException("Invalid request origin.");
    }
  }

  private readSessionCookie(request: RequestLike, domain: AuthDomain) {
    const name = sessionCookieName(domain);
    return request.cookies?.[name] ?? this.readCookieHeader(request, name);
  }

  private readCookieHeader(request: RequestLike, name: string) {
    const header = this.readHeader(request, "cookie");
    if (!header) return undefined;

    const entries = header.split(";").map((part) => part.trim().split("=", 2));
    for (const [key, value] of entries) {
      if (key === name) return decodeURIComponent(value ?? "");
    }

    return undefined;
  }

  private readHeader(request: RequestLike, name: string) {
    const value = request.headers?.[name] ?? request.headers?.[name.toLowerCase()];
    return Array.isArray(value) ? value[0] : value;
  }

  private rateKey(request: RequestLike) {
    return request.ip ?? "unknown";
  }

  private userAgent(request: RequestLike) {
    return this.readHeader(request, "user-agent") ?? null;
  }

  private ipHash(request: RequestLike) {
    const ip = request.ip ?? this.readHeader(request, "x-forwarded-for") ?? null;
    return ip ? hashWithPepper(ip) : null;
  }

  private assertRateLimit(key: string, limit: number, windowMs: number) {
    const bucketKey = rateLimitWindow(key, limit, windowMs);
    const now = Date.now();
    const bucket = this.attempts.get(bucketKey);

    if (!bucket || bucket.resetAt <= now) {
      this.attempts.set(bucketKey, { count: 1, resetAt: now + windowMs });
      return;
    }

    if (bucket.count >= limit) {
      const retryAfter = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
      throw new HttpException(
        { message: "Too many attempts. Please try again later.", retryAfter },
        HttpStatus.TOO_MANY_REQUESTS
      );
    }

    bucket.count += 1;
  }
}

export {
  normalizeEmail,
  normalizeUsername,
  hashWithPepper,
  sessionCookieName,
  csrfCookieName,
  sessionTtlSeconds,
};
