import { resolve } from "node:path";
import { config as loadEnv } from "dotenv";
import { createPrismaClient } from "@keylish/db";
import { AuthService } from "../src/auth/auth.service";
import { MailService } from "../src/mail/mail.service";

// Load app-local env for app settings (ADMIN_*, AUTH_*), then the shared db
// package env which is the canonical DB config (where migrations + data live).
// `override: true` so the real DATABASE_URL/DIRECT_URL win over any stale
// localhost placeholder left in apps/api/.env — the seed must hit the same DB
// the schema was migrated to.
loadEnv({ path: resolve(__dirname, "../.env") });
loadEnv({ path: resolve(__dirname, "../../../packages/db/.env"), override: true });

function dbHost(connectionString: string) {
  try {
    return new URL(connectionString).host;
  } catch {
    return "(unparseable)";
  }
}

function isLocalDatabaseUrl(connectionString: string) {
  try {
    const host = new URL(connectionString).hostname.toLowerCase();
    return (
      host === "localhost" ||
      host === "0.0.0.0" ||
      host === "::1" ||
      host === "host.docker.internal" ||
      host === "postgres" ||
      host.startsWith("127.")
    );
  } catch {
    return false;
  }
}

function maskConnectionString(connectionString: string) {
  return connectionString.replace(/:\/\/[^@]*@/, "://***@");
}

function assertAdminSeedTarget(connectionString: string) {
  if (isLocalDatabaseUrl(connectionString)) return;
  if (process.env.ALLOW_REMOTE_DB_FOR_DEV === "true") {
    console.warn("Remote admin seed explicitly allowed: " + maskConnectionString(connectionString));
    return;
  }
  throw new Error(
    "Refusing to seed admin against remote DB " +
      maskConnectionString(connectionString) +
      ". Admin is local-only; use Docker Postgres locally, or set ALLOW_REMOTE_DB_FOR_DEV=true for an explicit staging operation."
  );
}

function getCredentials(): { username: string; password: string } {
  const [, , argUsername, argPassword] = process.argv;
  const username = (
    argUsername ??
    process.env.ADMIN_USERNAME ??
    process.env.ADMIN_INITIAL_USERNAME
  )?.trim();
  const password = argPassword ?? process.env.ADMIN_PASSWORD ?? process.env.ADMIN_INITIAL_PASSWORD;

  if (!username || !password) {
    throw new Error(
      "Thiếu thông tin đăng nhập.\n" +
        "Cách dùng: pnpm --filter @keylish/api seed-admin <username> <password>\n" +
        "          (hoặc set ADMIN_USERNAME / ADMIN_PASSWORD)"
    );
  }
  if (username.length < 3 || username.length > 64 || !/^[a-zA-Z0-9_.-]+$/.test(username)) {
    throw new Error("Username 3–64 ký tự: chữ, số, dấu chấm, gạch dưới, gạch ngang.");
  }
  if (username.includes("@")) {
    throw new Error("Username admin không được chứa '@' (đăng nhập có '@' bị từ chối).");
  }
  if (password.startsWith("change-me")) {
    throw new Error("Hãy đặt mật khẩu thật trước khi seed (không dùng 'change-me...').");
  }
  if (password.length < 12 || password.length > 128) {
    throw new Error("Mật khẩu phải 12–128 ký tự (đúng luật đăng nhập admin).");
  }

  return { username, password };
}

async function main() {
  const { username, password } = getCredentials();

  const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("Thiếu DIRECT_URL/DATABASE_URL (đã thử apps/api/.env và packages/db/.env).");
  }
  assertAdminSeedTarget(connectionString);

  console.log(`Kết nối DB: ${dbHost(connectionString)} — seed admin "${username}"...`);

  const resources = createPrismaClient(connectionString);
  const auth = new AuthService({ client: resources.client } as never, new MailService());
  try {
    const result = await auth.seedAdmin(username, password);
    console.log(
      result.created
        ? `Đã tạo admin: ${result.username}`
        : `Admin đã tồn tại (không đổi): ${result.username}`
    );
  } finally {
    await resources.client.$disconnect();
    await resources.pool.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
