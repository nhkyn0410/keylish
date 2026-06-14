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

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
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
