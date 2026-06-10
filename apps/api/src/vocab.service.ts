import { BadRequestException, Injectable } from "@nestjs/common";
import { VocabQuerySchema, type WordDTO } from "@keylish/shared";
import type { CefrLevel } from "@keylish/db";
import { DatabaseService } from "./database.service";

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

function shuffle<T>(items: T[]) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
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
    const rows = await this.database.client.word.findMany({
      where: {
        ...(parsed.levels?.length ? { level: { in: parsed.levels } } : {}),
        ...(parsed.topics?.length ? { topic: { slug: { in: parsed.topics } } } : {}),
      },
      orderBy: parsed.random ? undefined : [{ frequency: "desc" }, { en: "asc" }],
      take: parsed.random ? undefined : parsed.limit,
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
    }) as WordRow[];

    const selected = parsed.random ? shuffle(rows).slice(0, parsed.limit) : rows;

    return selected.map(({ topic, ...word }) => ({
      ...word,
      topic: topic?.slug ?? null,
    }));
  }
}
