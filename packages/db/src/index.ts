import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

export {
  PrismaClient,
  Prisma,
  CefrLevel,
  UserStatus,
  AuthProvider,
  VocabEntrySource,
} from "@prisma/client";

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

export function assertSafeDatabaseTarget(connectionString: string) {
  const isProduction = process.env.NODE_ENV === "production";
  const isLocal = isLocalDatabaseUrl(connectionString);

  if (isProduction) {
    if (isLocal && process.env.ALLOW_LOCAL_DB_IN_PRODUCTION !== "true") {
      throw new Error(
        "Production database target points to a local database. Refusing to connect."
      );
    }
    return;
  }

  if (!isLocal && process.env.ALLOW_REMOTE_DB_FOR_DEV !== "true") {
    throw new Error(
      "Refusing to connect non-production runtime to remote database " +
        maskConnectionString(connectionString) +
        ". Use Docker Postgres locally, or set ALLOW_REMOTE_DB_FOR_DEV=true for an explicit staging operation."
    );
  }
}

export function createPrismaClient(connectionString: string) {
  assertSafeDatabaseTarget(connectionString);
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const client = new PrismaClient({ adapter });
  return { client, pool };
}
