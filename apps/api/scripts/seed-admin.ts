import "dotenv/config";
import { createPrismaClient } from "@keylish/db";
import { AuthService } from "../src/auth/auth.service";

async function main() {
  const username = process.env.ADMIN_INITIAL_USERNAME?.trim();
  const password = process.env.ADMIN_INITIAL_PASSWORD?.trim();
  if (!username || !password) {
    throw new Error("ADMIN_INITIAL_USERNAME and ADMIN_INITIAL_PASSWORD are required.");
  }
  if (password.startsWith("change-me")) {
    throw new Error("ADMIN_INITIAL_PASSWORD must be changed before seeding.");
  }
  const connectionString =
    process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/keylish";
  const resources = createPrismaClient(connectionString);
  const auth = new AuthService({ client: resources.client } as never);
  try {
    const result = await auth.seedAdmin(username, password);
    const message = result.created
      ? `Created admin: ${result.username}`
      : `Admin already exists: ${result.username}`;
    console.log(message);
  } finally {
    await resources.client.$disconnect();
    await resources.pool.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
