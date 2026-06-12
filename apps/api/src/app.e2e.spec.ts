import { VersioningType, type INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AppModule } from "./app.module";
import { DatabaseService } from "./database/database.service";

describe("AppModule routes", () => {
  let app: INestApplication;

  const database = {
    client: {
      topic: {
        findMany: vi.fn(),
      },
      word: {
        findMany: vi.fn(),
        count: vi.fn(),
      },
    },
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(DatabaseService)
      .useValue(database)
      .compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix("api");
    app.enableVersioning({ type: VersioningType.URI });
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it("serves the health route", async () => {
    await request(app.getHttpServer())
      .get("/api/health")
      .expect(200)
      .expect({ status: "ok", service: "api", docs: "/api/docs" });
  });

  it("serves v1 topic summaries", async () => {
    database.client.topic.findMany.mockResolvedValue([
      { slug: "travel", title: "Travel", _count: { words: 12 } },
    ]);

    await request(app.getHttpServer())
      .get("/api/v1/topics")
      .expect(200)
      .expect([{ slug: "travel", title: "Travel", count: 12 }]);

    expect(database.client.topic.findMany).toHaveBeenCalledWith({
      orderBy: { title: "asc" },
      select: {
        slug: true,
        title: true,
        _count: { select: { words: true } },
      },
    });
  });

  it("serves filtered v1 vocabulary", async () => {
    database.client.word.findMany.mockResolvedValue([
      {
        id: "word_1",
        en: "hello",
        vi: "xin chao",
        level: "A1",
        frequency: 100,
        pos: "interjection",
        ipa: "h??lo?",
        example: "Hello, KeyLish!",
        source: "test",
        topic: { slug: "basics" },
      },
    ]);

    await request(app.getHttpServer())
      .get("/api/v1/vocab")
      .query({ levels: "A1", topics: "basics", limit: "1" })
      .expect(200)
      .expect([
        {
          id: "word_1",
          en: "hello",
          vi: "xin chao",
          level: "A1",
          frequency: 100,
          pos: "interjection",
          ipa: "h??lo?",
          example: "Hello, KeyLish!",
          source: "test",
          topic: "basics",
        },
      ]);

    expect(database.client.word.findMany).toHaveBeenCalledWith({
      where: {
        level: { in: ["A1"] },
        topic: { slug: { in: ["basics"] } },
      },
      orderBy: [{ frequency: "desc" }, { en: "asc" }],
      take: 1,
      select: expect.any(Object),
    });
  });

  it("serves v1 vocabulary counts", async () => {
    database.client.word.count.mockResolvedValue(7);

    await request(app.getHttpServer())
      .get("/api/v1/vocab/count")
      .query({ levels: "A1", topics: "basics" })
      .expect(200)
      .expect({ count: 7 });

    expect(database.client.word.count).toHaveBeenCalledWith({
      where: {
        level: { in: ["A1"] },
        topic: { slug: { in: ["basics"] } },
      },
    });
  });

  it("rejects invalid vocabulary filters", async () => {
    await request(app.getHttpServer()).get("/api/v1/vocab").query({ levels: "NOPE" }).expect(400);
  });
});
