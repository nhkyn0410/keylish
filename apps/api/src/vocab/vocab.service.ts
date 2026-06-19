import { BadRequestException, Injectable } from "@nestjs/common";
import { type CefrLevel, type Prisma } from "@keylish/db";
import { VocabQuerySchema, type VocabQuery, type WordDTO } from "@keylish/shared";
import { z } from "zod";
import { DatabaseService } from "../database/database.service";

type WordRow = {
  id: string;
  en: string;
  vi: string;
  level: CefrLevel | null;
  frequency: number;
  pos: string | null;
  ipa: string | null;
  example: string | null;
  source: string;
  topic: { slug: string } | null;
};

const CefrLevelInputSchema = z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]);

type CefrLevelValue = z.infer<typeof CefrLevelInputSchema>;

export type AdminVocabTopicDto = {
  id: string;
  slug: string;
  title: string;
};

export type AdminVocabDto = {
  id: string;
  en: string;
  vi: string;
  level: CefrLevelValue | null;
  frequency: number;
  pos: string | null;
  ipa: string | null;
  example: string | null;
  source: string;
  topic: AdminVocabTopicDto | null;
};

export type AdminVocabListDto = {
  total: number;
  page: number;
  pageSize: number;
  items: AdminVocabDto[];
};

const AdminVocabListSchema = z.object({
  search: z.string().trim().optional(),
  topicId: z.string().trim().optional(),
  level: CefrLevelInputSchema.optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

const WordCreateSchema = z.object({
  en: z.string().trim().min(1).max(120),
  vi: z.string().trim().min(1).max(240),
  level: CefrLevelInputSchema.optional().nullable(),
  frequency: z.coerce.number().int().min(0).default(0),
  pos: z.string().trim().max(120).optional().nullable(),
  ipa: z.string().trim().max(120).optional().nullable(),
  example: z.string().trim().max(500).optional().nullable(),
  source: z.string().trim().max(120).default("admin"),
  topicId: z.string().trim().optional().nullable(),
});

const WordUpdateSchema = z.object({
  en: z.string().trim().min(1).max(120).optional(),
  vi: z.string().trim().min(1).max(240).optional(),
  level: CefrLevelInputSchema.optional().nullable(),
  frequency: z.coerce.number().int().min(0).optional(),
  pos: z.string().trim().max(120).optional().nullable(),
  ipa: z.string().trim().max(120).optional().nullable(),
  example: z.string().trim().max(500).optional().nullable(),
  source: z.string().trim().max(120).optional(),
  topicId: z.string().trim().optional().nullable(),
});

function shuffle<T>(items: T[]) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function publicVocabWhere(query: Pick<VocabQuery, "levels" | "topics" | "search">) {
  const where: Prisma.WordWhereInput = {
    ...(query.levels?.length ? { level: { in: query.levels } } : {}),
    ...(query.topics?.length ? { topic: { slug: { in: query.topics } } } : {}),
  };

  if (query.search) {
    where.OR = [
      { en: { contains: query.search, mode: "insensitive" } },
      { vi: { contains: query.search, mode: "insensitive" } },
    ];
  }

  return where;
}

@Injectable()
export class VocabService {
  constructor(private readonly database: DatabaseService) {}

  async findAll(query: unknown): Promise<WordDTO[]> {
    const parsedResult = VocabQuerySchema.safeParse(query);
    if (!parsedResult.success) {
      throw new BadRequestException(parsedResult.error.message);
    }

    const parsed = parsedResult.data;
    const rows = (await this.database.client.word.findMany({
      where: publicVocabWhere(parsed),
      orderBy: parsed.random ? undefined : [{ frequency: "desc" }, { en: "asc" }],
      take: parsed.random ? undefined : parsed.limit,
      ...(parsed.random || parsed.offset === 0 ? {} : { skip: parsed.offset }),
      select: {
        id: true,
        en: true,
        vi: true,
        level: true,
        frequency: true,
        pos: true,
        ipa: true,
        example: true,
        source: true,
        topic: {
          select: { slug: true },
        },
      },
    })) as WordRow[];

    const selected = parsed.random ? shuffle(rows).slice(0, parsed.limit) : rows;

    return selected.map(({ topic, ...word }) => ({
      ...word,
      topic: topic?.slug ?? null,
    }));
  }

  async count(query: unknown): Promise<number> {
    const parsedResult = VocabQuerySchema.safeParse(query);
    if (!parsedResult.success) {
      throw new BadRequestException(parsedResult.error.message);
    }

    return this.database.client.word.count({
      where: publicVocabWhere(parsedResult.data),
    });
  }

  async listVocab(input: unknown): Promise<AdminVocabListDto> {
    const parsed = AdminVocabListSchema.safeParse(input);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.message);
    }

    const query = parsed.data;
    const where = {
      ...(query.search
        ? {
            OR: [
              { en: { contains: query.search, mode: "insensitive" as const } },
              { vi: { contains: query.search, mode: "insensitive" as const } },
            ],
          }
        : {}),
      ...(query.topicId ? { topicId: query.topicId } : {}),
      ...(query.level ? { level: query.level } : {}),
    };

    const [total, items] = await this.database.client.$transaction([
      this.database.client.word.count({ where }),
      this.database.client.word.findMany({
        where,
        orderBy: [{ updatedAt: "desc" }],
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        include: { topic: { select: { id: true, slug: true, title: true } } },
      }),
    ]);

    return {
      total,
      page: query.page,
      pageSize: query.pageSize,
      items: items.map((word) => ({
        id: word.id,
        en: word.en,
        vi: word.vi,
        level: word.level as CefrLevelValue | null,
        frequency: word.frequency,
        pos: word.pos,
        ipa: word.ipa,
        example: word.example,
        source: word.source,
        topic: word.topic
          ? { id: word.topic.id, slug: word.topic.slug, title: word.topic.title }
          : null,
      })),
    };
  }

  async createWord(input: unknown): Promise<AdminVocabDto> {
    const parsed = WordCreateSchema.safeParse(input);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.message);
    }

    const body = parsed.data;
    const word = await this.database.client.word.create({
      data: {
        en: body.en,
        vi: body.vi,
        level: body.level ?? null,
        frequency: body.frequency,
        pos: body.pos ?? null,
        ipa: body.ipa ?? null,
        example: body.example ?? null,
        source: body.source,
        topicId: body.topicId ?? null,
      },
      include: { topic: { select: { id: true, slug: true, title: true } } },
    });

    return {
      id: word.id,
      en: word.en,
      vi: word.vi,
      level: word.level as CefrLevelValue | null,
      frequency: word.frequency,
      pos: word.pos,
      ipa: word.ipa,
      example: word.example,
      source: word.source,
      topic: word.topic
        ? { id: word.topic.id, slug: word.topic.slug, title: word.topic.title }
        : null,
    };
  }

  async updateWord(id: string, input: unknown): Promise<AdminVocabDto> {
    const parsed = WordUpdateSchema.safeParse(input);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.message);
    }

    const body = parsed.data;
    const word = await this.database.client.word.update({
      where: { id },
      data: {
        ...(body.en !== undefined ? { en: body.en } : {}),
        ...(body.vi !== undefined ? { vi: body.vi } : {}),
        ...(body.level !== undefined ? { level: body.level } : {}),
        ...(body.frequency !== undefined ? { frequency: body.frequency } : {}),
        ...(body.pos !== undefined ? { pos: body.pos } : {}),
        ...(body.ipa !== undefined ? { ipa: body.ipa } : {}),
        ...(body.example !== undefined ? { example: body.example } : {}),
        ...(body.source !== undefined ? { source: body.source } : {}),
        ...(body.topicId !== undefined ? { topicId: body.topicId } : {}),
      },
      include: { topic: { select: { id: true, slug: true, title: true } } },
    });

    return {
      id: word.id,
      en: word.en,
      vi: word.vi,
      level: word.level as CefrLevelValue | null,
      frequency: word.frequency,
      pos: word.pos,
      ipa: word.ipa,
      example: word.example,
      source: word.source,
      topic: word.topic
        ? { id: word.topic.id, slug: word.topic.slug, title: word.topic.title }
        : null,
    };
  }

  async deleteWord(id: string): Promise<{ ok: true }> {
    await this.database.client.word.delete({ where: { id } });
    return { ok: true as const };
  }
}
