import { describe, expect, it, vi } from "vitest";
import { UserVocabService } from "./uservocab.service";

function entry(overrides: Record<string, unknown> = {}) {
  return {
    id: "entry_1",
    source: "custom",
    customEn: "glimmerish",
    customVi: "lấp lánh",
    customExample: null,
    customLevel: null,
    customTopic: null,
    note: null,
    createdAt: new Date("2026-06-20T00:00:00.000Z"),
    word: null,
    ...overrides,
  };
}

function createService() {
  const database = {
    client: {
      $transaction: vi.fn((operations: Array<Promise<unknown>>) => Promise.all(operations)),
      word: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
      },
      userVocabEntry: {
        count: vi.fn(),
        create: vi.fn(),
        findMany: vi.fn(),
      },
    },
  };

  return { database, service: new UserVocabService(database as never) };
}

describe("UserVocabService create", () => {
  it("links to an existing system word after normalizing user input", async () => {
    const { database, service } = createService();
    database.client.word.findFirst.mockResolvedValue({ id: "word_hello" });
    database.client.userVocabEntry.create.mockResolvedValue(
      entry({
        source: "system",
        customEn: null,
        customVi: null,
        word: {
          id: "word_hello",
          en: "hello",
          vi: "xin chào",
          level: "A1",
          frequency: 10,
          pos: null,
          ipa: null,
          example: null,
          source: "test",
          topic: null,
        },
      })
    );

    const result = await service.create("user_1", { en: " Hello! ", vi: "xin chào" });

    expect(result.status).toBe("linked");
    expect(database.client.word.findFirst).toHaveBeenCalledWith({
      where: { en: { equals: "hello", mode: "insensitive" } },
      select: { id: true },
    });
    expect(database.client.userVocabEntry.create).toHaveBeenCalledWith({
      data: { userId: "user_1", wordId: "word_hello", source: "system" },
      select: expect.any(Object),
    });
  });

  it("suggests a base system word for variants instead of creating a custom entry", async () => {
    const { database, service } = createService();
    database.client.word.findFirst.mockResolvedValue(null);
    database.client.word.findMany.mockResolvedValue([
      { id: "word_run", en: "run", vi: "chạy", level: "A1", ipa: "/rʌn/" },
    ]);

    const result = await service.create("user_1", {
      en: "running",
      vi: "đang chạy",
      allowVariant: "false",
    });

    expect(result).toEqual({
      status: "suggest",
      lemma: "run",
      candidates: [{ id: "word_run", en: "run", vi: "chạy", level: "A1", ipa: "/rʌn/" }],
    });
    expect(database.client.userVocabEntry.create).not.toHaveBeenCalled();
  });

  it("creates a custom entry when the word is not in the system vocabulary", async () => {
    const { database, service } = createService();
    database.client.word.findFirst.mockResolvedValue(null);
    database.client.word.findMany.mockResolvedValue([]);
    database.client.userVocabEntry.create.mockResolvedValue(entry());

    const result = await service.create("user_1", {
      en: "Glimmerish",
      vi: "lấp lánh",
      example: "A glimmerish word.",
      level: "B1",
      topic: "technology",
    });

    expect(result).toMatchObject({
      status: "created",
      entry: {
        source: "custom",
        custom: { en: "glimmerish", vi: "lấp lánh" },
      },
    });
    expect(database.client.userVocabEntry.create).toHaveBeenCalledWith({
      data: {
        user: { connect: { id: "user_1" } },
        source: "custom",
        customEn: "Glimmerish",
        normalizedEn: "glimmerish",
        customVi: "lấp lánh",
        customExample: "A glimmerish word.",
        customLevel: "B1",
        customTopic: { connect: { slug: "technology" } },
        note: null,
      },
      select: expect.any(Object),
    });
  });
});

describe("UserVocabService list", () => {
  it("filters personal vocabulary by search, level, and topic on system or custom entries", async () => {
    const { database, service } = createService();
    database.client.userVocabEntry.count.mockResolvedValue(1);
    database.client.userVocabEntry.findMany.mockResolvedValue([
      entry({
        customLevel: "B1",
        customTopic: { slug: "technology" },
      }),
    ]);

    const result = await service.list("user_1", {
      search: "glim",
      levels: "B1,C1",
      topics: "technology",
      pageSize: "20",
    });

    expect(result.total).toBe(1);
    expect(result.items[0]?.custom?.topic).toBe("technology");
    expect(database.client.userVocabEntry.count).toHaveBeenCalledWith({
      where: {
        userId: "user_1",
        AND: [
          {
            OR: [
              { customLevel: { in: ["B1", "C1"] } },
              { word: { is: { level: { in: ["B1", "C1"] } } } },
            ],
          },
          {
            OR: [
              { customTopic: { is: { slug: { in: ["technology"] } } } },
              { word: { is: { topic: { is: { slug: { in: ["technology"] } } } } } },
            ],
          },
        ],
        OR: [
          { customEn: { contains: "glim", mode: "insensitive" } },
          { customVi: { contains: "glim", mode: "insensitive" } },
          {
            word: {
              is: {
                OR: [
                  { en: { contains: "glim", mode: "insensitive" } },
                  { vi: { contains: "glim", mode: "insensitive" } },
                ],
              },
            },
          },
        ],
      },
    });
    expect(database.client.userVocabEntry.findMany).toHaveBeenCalledWith({
      where: expect.any(Object),
      orderBy: { createdAt: "desc" },
      skip: 0,
      take: 20,
      select: expect.any(Object),
    });
  });
});
