import "reflect-metadata";
import { resolve } from "node:path";
import { config as loadEnv } from "dotenv";
import cookieParser from "cookie-parser";
import { VersioningType } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module";

loadEnv({ path: resolve(__dirname, "../.env") });
loadEnv({ path: resolve(__dirname, "../../../packages/db/.env") });

function parseOrigins() {
  const configured = (process.env.AUTH_ALLOWED_ORIGINS ?? process.env.CORS_ORIGIN)
    ?.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
  const localOrigins =
    process.env.NODE_ENV === "production" ? [] : ["http://localhost:3000", "http://localhost:3002"];

  return [...new Set([...(configured ?? []), ...localOrigins])];
}

function assertProductionSecrets() {
  if (process.env.NODE_ENV !== "production") return;
  if (!process.env.AUTH_TOKEN_PEPPER?.trim()) {
    throw new Error(
      "AUTH_TOKEN_PEPPER must be set in production (a long random secret). Refusing to boot with the dev default."
    );
  }
}

async function bootstrap() {
  assertProductionSecrets();

  const app = await NestFactory.create(AppModule);
  // Render/most PaaS terminate TLS at a proxy; trust the first hop so req.ip is
  // the real client IP (used for rate-limit buckets and ipHash), not the proxy.
  app.getHttpAdapter().getInstance().set("trust proxy", 1);
  app.use(cookieParser());

  const allowedOrigins = parseOrigins();
  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "X-CSRF-Token"],
  });
  app.setGlobalPrefix("api");
  app.enableVersioning({
    type: VersioningType.URI,
  });

  const swaggerConfig = new DocumentBuilder()
    .setTitle("KeyLish API")
    .setDescription("KeyLish read-only vocabulary API and V2 auth surface")
    .setVersion("1.0")
    .build();

  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup("docs", app, swaggerDocument, { useGlobalPrefix: true });

  const port = Number(process.env.PORT ?? 3001);
  await app.listen(port, "0.0.0.0");
}

bootstrap();
