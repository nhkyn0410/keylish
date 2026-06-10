import { Injectable, OnApplicationShutdown } from "@nestjs/common";
import { createPrismaClient, type PrismaClient } from "@keylish/db";

const DEFAULT_DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/keylish";

@Injectable()
export class DatabaseService implements OnApplicationShutdown {
  private readonly connectionString = process.env.DATABASE_URL ?? DEFAULT_DATABASE_URL;
  private readonly resources: { client: PrismaClient; pool: { end(): Promise<unknown> } } = createPrismaClient(this.connectionString);

  get client(): PrismaClient {
    return this.resources.client;
  }

  async onApplicationShutdown() {
    await this.resources.client.$disconnect();
    await this.resources.pool.end();
  }
}
