import { Injectable, OnApplicationShutdown } from "@nestjs/common";
import { createPrismaClient, type PrismaClient } from "@keylish/db";

const DEFAULT_DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/keylish";

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

function resolveDatabaseUrl() {
  const configured = process.env.DATABASE_URL?.trim();

  if (process.env.NODE_ENV === "production") {
    if (!configured) {
      throw new Error("DATABASE_URL must be set in production. Refusing to boot with local DB.");
    }
    if (isLocalDatabaseUrl(configured) && process.env.ALLOW_LOCAL_DB_IN_PRODUCTION !== "true") {
      throw new Error("Production DATABASE_URL points to a local database. Refusing to boot.");
    }
    return configured;
  }

  const connectionString = configured || DEFAULT_DATABASE_URL;
  if (!isLocalDatabaseUrl(connectionString) && process.env.ALLOW_REMOTE_DB_FOR_DEV !== "true") {
    throw new Error(
      "Refusing to boot dev API against remote DB " +
        maskConnectionString(connectionString) +
        ". Use Docker Postgres locally, or set ALLOW_REMOTE_DB_FOR_DEV=true for an explicit live-admin/staging operation."
    );
  }

  return connectionString;
}

@Injectable()
export class DatabaseService implements OnApplicationShutdown {
  private readonly connectionString = resolveDatabaseUrl();
  private readonly resources: {
    client: PrismaClient;
    pool: { end(): Promise<unknown> };
  } = createPrismaClient(this.connectionString);

  get client(): PrismaClient {
    return this.resources.client;
  }

  async onApplicationShutdown() {
    await this.resources.client.$disconnect();
    await this.resources.pool.end();
  }
}
