import "reflect-metadata";
import { resolve } from "node:path";
import { config as loadEnv } from "dotenv";
import { VersioningType } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module";

// Nạp DATABASE_URL trước khi DatabaseService đọc process.env (khi NestFactory
// khởi tạo provider). dotenv KHÔNG ghi đè biến đã tồn tại → env của Render/shell
// luôn thắng; file không có thì bỏ qua. Ưu tiên: env môi trường > apps/api/.env
// > packages/db/.env (Neon). __dirname = apps/api/dist khi chạy.
loadEnv({ path: resolve(__dirname, "../.env") });
loadEnv({ path: resolve(__dirname, "../../../packages/db/.env") });

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const corsOrigins = process.env.CORS_ORIGIN?.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
  app.enableCors({ origin: corsOrigins ?? true });
  app.setGlobalPrefix("api");
  app.enableVersioning({
    type: VersioningType.URI,
  });

  const swaggerConfig = new DocumentBuilder()
    .setTitle("KeyLish API")
    .setDescription("KeyLish read-only vocabulary API")
    .setVersion("1.0")
    .build();

  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup("docs", app, swaggerDocument, { useGlobalPrefix: true });

  const port = Number(process.env.PORT ?? 3001);
  await app.listen(port, "0.0.0.0");
}

bootstrap();
