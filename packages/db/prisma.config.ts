import { existsSync } from "node:fs";
import { isAbsolute, resolve } from "node:path";
import { config as loadEnv } from "dotenv";
import { defineConfig } from "prisma/config";

const repoRoot = resolve(process.cwd(), "../..");
loadEnv({ path: resolve(process.cwd(), ".env"), override: true });

const dbEnvOverride = process.env.KEYLISH_DB_ENV_FILE?.trim();
if (dbEnvOverride) {
  const candidates = [
    isAbsolute(dbEnvOverride) ? dbEnvOverride : resolve(process.cwd(), dbEnvOverride),
    isAbsolute(dbEnvOverride) ? dbEnvOverride : resolve(repoRoot, dbEnvOverride),
  ];
  const envPath = candidates.find((candidate) => existsSync(candidate));
  if (envPath) loadEnv({ path: envPath, override: true });
}

const url =
  process.env.DIRECT_URL ??
  process.env.DATABASE_URL ??
  "postgresql://postgres:postgres@localhost:5432/keylish";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url,
  },
});
