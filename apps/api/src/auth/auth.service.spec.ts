import { ForbiddenException, UnauthorizedException } from "@nestjs/common";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MailService } from "../mail/mail.service";
import { AuthService } from "./auth.service";

type MockDatabase = {
  client: {
    userSession: {
      findUnique: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
    };
    adminSession: {
      findUnique: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
    };
  };
};

function createService() {
  const database: MockDatabase = {
    client: {
      userSession: {
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      adminSession: {
        findUnique: vi.fn(),
        update: vi.fn(),
      },
    },
  };

  return { database, service: new AuthService(database as never, new MailService()) };
}

describe("AuthService security foundation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.AUTH_TOKEN_PEPPER = "test-pepper-for-auth-service";
  });

  it("hashes and verifies passwords with Argon2id", async () => {
    const { service } = createService();
    const hash = await service.hashPassword("correct horse battery staple");

    expect(hash).not.toContain("correct horse battery staple");
    await expect(service.verifyPassword("correct horse battery staple", hash)).resolves.toBe(true);
    await expect(service.verifyPassword("wrong horse battery staple", hash)).resolves.toBe(false);
  });

  it("hashes session tokens without storing plaintext", () => {
    const { service } = createService();
    const token = "session-token-plaintext";
    const hash = service.hashToken(token);

    expect(hash).not.toBe(token);
    expect(hash).toHaveLength(64);
    expect(service.hashToken(token)).toBe(hash);
  });

  it("rejects unsafe requests without matching CSRF token", () => {
    const { service } = createService();

    expect(() =>
      service.assertCsrf(
        {
          method: "POST",
          cookies: { "u-csrf": "cookie-token" },
          headers: { "x-csrf-token": "header-token" },
        },
        "user"
      )
    ).toThrow(ForbiddenException);
  });

  it("accepts unsafe requests with a matching CSRF token", () => {
    const { service } = createService();

    expect(() =>
      service.assertCsrf(
        {
          method: "PATCH",
          cookies: { "a-csrf": "csrf-token" },
          headers: { "x-csrf-token": "csrf-token" },
        },
        "admin"
      )
    ).not.toThrow();
  });

  it("does not authenticate a user request with only an admin cookie", async () => {
    const { service } = createService();

    await expect(
      service.authenticateUser({ cookies: { admin: "admin-session-token" }, headers: {} })
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("does not authenticate an admin request with only a user cookie", async () => {
    const { service } = createService();

    await expect(
      service.authenticateAdmin({ cookies: { user: "user-session-token" }, headers: {} })
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("authenticates active user and admin sessions with their own cookies", async () => {
    const { database, service } = createService();
    const now = Date.now();

    database.client.userSession.findUnique.mockResolvedValue({
      id: "us_1",
      userId: "user_1",
      tokenHash: service.hashToken("user-token"),
      expiresAt: new Date(now + 60_000),
      revokedAt: null,
      user: { deletedAt: null, status: "ACTIVE" },
    });
    database.client.userSession.update.mockResolvedValue({});

    database.client.adminSession.findUnique.mockResolvedValue({
      id: "as_1",
      adminId: "admin_1",
      tokenHash: service.hashToken("admin-token"),
      expiresAt: new Date(now + 60_000),
      revokedAt: null,
      admin: { id: "admin_1", username: "admin", usernameNormalized: "admin" },
    });
    database.client.adminSession.update.mockResolvedValue({});

    await expect(
      service.authenticateUser({ cookies: { user: "user-token" }, headers: {} })
    ).resolves.toMatchObject({
      id: "us_1",
      userId: "user_1",
    });
    await expect(
      service.authenticateAdmin({ cookies: { admin: "admin-token" }, headers: {} })
    ).resolves.toMatchObject({
      id: "as_1",
      adminId: "admin_1",
    });
  });
});
