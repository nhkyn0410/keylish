#!/usr/bin/env node
import { existsSync } from "node:fs";
import { dirname, isAbsolute, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const here = dirname(fileURLToPath(import.meta.url));
const dbEnvPath = resolve(here, "../.env");
const repoRoot = resolve(here, "../../..");

if (existsSync(dbEnvPath)) {
  dotenv.config({ path: dbEnvPath, override: true });
}

const overrideEnvFile = process.env.KEYLISH_DB_ENV_FILE?.trim();
if (overrideEnvFile) {
  const overridePath = isAbsolute(overrideEnvFile)
    ? overrideEnvFile
    : resolve(repoRoot, overrideEnvFile);
  if (!existsSync(overridePath)) {
    fail(`KEYLISH_DB_ENV_FILE does not exist: ${overridePath}`);
  }
  dotenv.config({ path: overridePath, override: true });
}

const mode = process.argv[2] ?? "dev-write";
const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;

function fail(message) {
  console.error("[db-guard] " + message);
  process.exit(1);
}

function maskConnectionString(value) {
  return value.replace(/:\/\/[^@]*@/, "://***@");
}

function parseConnectionString(value) {
  try {
    return new URL(value);
  } catch {
    fail("DATABASE_URL/DIRECT_URL is not a valid PostgreSQL URL.");
  }
}

function isLocalHost(hostname) {
  const host = hostname.toLowerCase();
  return (
    host === "localhost" ||
    host === "0.0.0.0" ||
    host === "::1" ||
    host === "host.docker.internal" ||
    host === "postgres" ||
    host.startsWith("127.")
  );
}

if (!connectionString?.trim()) {
  fail(
    "Missing DIRECT_URL/DATABASE_URL. Copy packages/db/.env.example to packages/db/.env and keep it pointed at local Docker for dev."
  );
}

const parsed = parseConnectionString(connectionString);
const env = process.env.NODE_ENV ?? "development";
const local = isLocalHost(parsed.hostname);

if (env === "production") {
  if (local && process.env.ALLOW_LOCAL_DB_IN_PRODUCTION !== "true") {
    fail(
      "NODE_ENV=production is pointing at a local database. Production must use dashboard-provided Supabase URLs."
    );
  }
  console.log(`[db-guard] ${mode}: production DB target ${maskConnectionString(connectionString)}`);
  process.exit(0);
}

if (local) {
  console.log(`[db-guard] ${mode}: local DB target ${parsed.host}`);
  process.exit(0);
}

const remoteRuntimeAllowed = mode === "runtime" && process.env.ALLOW_REMOTE_DB_FOR_DEV === "true";
const remoteReadwriteAllowed =
  mode === "dev-readwrite" && process.env.ALLOW_REMOTE_DB_FOR_DEV === "true";
const remoteSchemaChangeAllowed =
  (mode === "dev-write" || mode === "deploy") &&
  process.env.ALLOW_REMOTE_DB_FOR_DEV === "true" &&
  process.env.ALLOW_REMOTE_SCHEMA_CHANGE === "true";
const remoteSeedAllowed =
  mode === "dev-seed" &&
  process.env.ALLOW_REMOTE_DB_FOR_DEV === "true" &&
  process.env.ALLOW_DESTRUCTIVE_SEED === "true";
const remoteAdminSeedAllowed =
  mode === "dev-admin-seed" && process.env.ALLOW_REMOTE_DB_FOR_DEV === "true";

if (
  remoteRuntimeAllowed ||
  remoteReadwriteAllowed ||
  remoteSchemaChangeAllowed ||
  remoteSeedAllowed ||
  remoteAdminSeedAllowed
) {
  console.warn(
    `[db-guard] ${mode}: ALLOW_REMOTE_DB_FOR_DEV=true, using remote DB ${maskConnectionString(
      connectionString
    )}`
  );
  process.exit(0);
}

fail(
  `Refusing to use remote DB ${maskConnectionString(
    connectionString
  )} while NODE_ENV=${env}. Dev/admin workflows default to Docker Postgres. For live admin runtime, set KEYLISH_DB_ENV_FILE plus ALLOW_REMOTE_DB_FOR_DEV=true; schema changes also require ALLOW_REMOTE_SCHEMA_CHANGE=true.`
);
