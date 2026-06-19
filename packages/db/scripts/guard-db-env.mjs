#!/usr/bin/env node
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const here = dirname(fileURLToPath(import.meta.url));
const dbEnvPath = resolve(here, "../.env");

if (existsSync(dbEnvPath)) {
  dotenv.config({ path: dbEnvPath, override: true });
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

if (process.env.ALLOW_REMOTE_DB_FOR_DEV === "true") {
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
  )} while NODE_ENV=${env}. Dev/admin workflows must use Docker Postgres. Set ALLOW_REMOTE_DB_FOR_DEV=true only for an explicit staging/one-off operation.`
);
