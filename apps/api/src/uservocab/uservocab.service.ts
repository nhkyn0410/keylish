import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@keylish/db";
import {
  CreateUserVocabSchema,
  PickWordSchema,
  UpdateUserVocabSchema,
  UserVocabQuerySchema,
  lemmaCandidates,
  normalizeEn,
  type AddVocabResult,
  type UserVocabEntryDto,
} from "@keylish/shared";
import { DatabaseService } from "../database/database.service";

const ENTRY_SELECT = {
  id: true,
  source: true,
  customEn: true,
  customVi: true,
  customExample: true,
  customLevel: true,
  customTopic: { select: { slug: true } },
  note: true,
  createdAt: true,
  word: {
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
      topic: { select: { slug: true } },
    },
  },
} satisfies Prisma.UserVocabEntrySelect;

type EntryRow = Prisma.UserVocabEntryGetPayload<{ select: typeof ENTRY_SELECT }>;

export type UserVocabListDto = {
  total: number;
  page: number;
  pageSize: number;
  items: UserVocabEntryDto[];
};

@Injectable()
export class UserVocabService {
  constructor(private readonly database: DatabaseService) {}

  private toDto(e: EntryRow): UserVocabEntryDto {
    return {
      id: e.id,
      source: e.source,
      word: e.word
        ? {
            id: e.word.id,
            en: e.word.en,
            vi: e.word.vi,
            level: e.word.level,
            frequency: e.word.frequency,
            pos: e.word.pos,
            ipa: e.word.ipa,
            example: e.word.example,
            topic: e.word.topic?.slug ?? null,
            source: e.word.source,
          }
        : null,
      // Trả `custom` khi có từ tự tạo HOẶC override trên từ tham chiếu
      // (customVi/customExample) — để override hiển thị được (FR-PVOC-07).
      custom:
        e.customEn != null ||
        e.customVi != null ||
        e.customExample != null ||
        e.customLevel != null ||
        e.customTopic != null
          ? {
              en: e.customEn ?? e.word?.en ?? "",
              vi: e.customVi ?? e.word?.vi ?? "",
              example: e.customExample ?? null,
              level: e.customLevel ?? null,
              topic: e.customTopic?.slug ?? null,
            }
          : null,
      note: e.note,
      createdAt: e.createdAt.toISOString(),
    };
  }

  private async createReference(userId: string, wordId: string): Promise<UserVocabEntryDto> {
    try {
      const created = await this.database.client.userVocabEntry.create({
        data: { userId, wordId, source: "system" },
        select: ENTRY_SELECT,
      });
      return this.toDto(created);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new ConflictException("Từ này đã có trong kho của bạn.");
      }
      throw error;
    }
  }

  async list(userId: string, input: unknown): Promise<UserVocabListDto> {
    const parsed = UserVocabQuerySchema.safeParse(input);
    if (!parsed.success) throw new BadRequestException(parsed.error.message);
    const { search, levels, topics, page, pageSize } = parsed.data;

    const and: Prisma.UserVocabEntryWhereInput[] = [];
    if (levels?.length) {
      and.push({
        OR: [{ customLevel: { in: levels } }, { word: { is: { level: { in: levels } } } }],
      });
    }
    if (topics?.length) {
      and.push({
        OR: [
          { customTopic: { is: { slug: { in: topics } } } },
          { word: { is: { topic: { is: { slug: { in: topics } } } } } },
        ],
      });
    }

    const where: Prisma.UserVocabEntryWhereInput = {
      userId,
      ...(and.length ? { AND: and } : {}),
      ...(search
        ? {
            OR: [
              { customEn: { contains: search, mode: "insensitive" } },
              { customVi: { contains: search, mode: "insensitive" } },
              {
                word: {
                  is: {
                    OR: [
                      { en: { contains: search, mode: "insensitive" } },
                      { vi: { contains: search, mode: "insensitive" } },
                    ],
                  },
                },
              },
            ],
          }
        : {}),
    };

    const [total, items] = await this.database.client.$transaction([
      this.database.client.userVocabEntry.count({ where }),
      this.database.client.userVocabEntry.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: ENTRY_SELECT,
      }),
    ]);

    return { total, page, pageSize, items: items.map((e) => this.toDto(e)) };
  }

  async pick(userId: string, input: unknown): Promise<AddVocabResult> {
    const parsed = PickWordSchema.safeParse(input);
    if (!parsed.success) throw new BadRequestException(parsed.error.message);

    const word = await this.database.client.word.findUnique({
      where: { id: parsed.data.wordId },
      select: { id: true },
    });
    if (!word) throw new NotFoundException("Không tìm thấy từ trong kho hệ thống.");

    const entry = await this.createReference(userId, word.id);
    return { status: "linked", entry };
  }

  async create(userId: string, input: unknown): Promise<AddVocabResult> {
    const parsed = CreateUserVocabSchema.safeParse(input);
    if (!parsed.success) throw new BadRequestException(parsed.error.message);
    const body = parsed.data;

    const normalized = normalizeEn(body.en);
    if (!normalized) throw new BadRequestException("Từ tiếng Anh không hợp lệ.");

    // 1. Khớp chính xác kho hệ thống → tự liên kết tham chiếu (FR-PVOC-04).
    const exact = await this.database.client.word.findFirst({
      where: { en: { equals: normalized, mode: "insensitive" } },
      select: { id: true },
    });
    if (exact) {
      const entry = await this.createReference(userId, exact.id);
      return { status: "linked", entry };
    }

    // 2. Khớp biến thể (lemmatization Mức 1) → gợi ý, KHÔNG tự gộp (FR-PVOC-05).
    if (!body.allowVariant) {
      const candidates = lemmaCandidates(body.en).filter((c) => c !== normalized);
      if (candidates.length) {
        const matches = await this.database.client.word.findMany({
          where: { en: { in: candidates, mode: "insensitive" } },
          select: { id: true, en: true, vi: true, level: true, ipa: true },
          take: 5,
        });
        if (matches.length) {
          const matchedLemma =
            candidates.find((candidate) =>
              matches.some((match) => normalizeEn(match.en) === candidate)
            ) ?? candidates[0];
          return {
            status: "suggest",
            lemma: matchedLemma,
            candidates: matches.map((m) => ({
              id: m.id,
              en: m.en,
              vi: m.vi,
              level: m.level,
              ipa: m.ipa,
            })),
          };
        }
      }
    }

    // 3. Tạo custom.
    try {
      const created = await this.database.client.userVocabEntry.create({
        data: {
          user: { connect: { id: userId } },
          source: "custom",
          customEn: body.en,
          normalizedEn: normalized,
          customVi: body.vi,
          customExample: body.example ?? null,
          customLevel: body.level ?? null,
          ...(body.topic ? { customTopic: { connect: { slug: body.topic } } } : {}),
          note: body.note ?? null,
        },
        select: ENTRY_SELECT,
      });
      return { status: "created", entry: this.toDto(created) };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new ConflictException("Từ này đã có trong kho của bạn.");
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
        throw new BadRequestException("Chủ đề không tồn tại.");
      }
      throw error;
    }
  }

  async update(userId: string, id: string, input: unknown): Promise<UserVocabEntryDto> {
    const parsed = UpdateUserVocabSchema.safeParse(input);
    if (!parsed.success) throw new BadRequestException(parsed.error.message);

    await this.assertOwned(userId, id);
    const b = parsed.data;
    const updated = await this.database.client.userVocabEntry.update({
      where: { id },
      data: {
        ...(b.customVi !== undefined ? { customVi: b.customVi } : {}),
        ...(b.customExample !== undefined ? { customExample: b.customExample } : {}),
        ...(b.note !== undefined ? { note: b.note } : {}),
      },
      select: ENTRY_SELECT,
    });
    return this.toDto(updated);
  }

  async remove(userId: string, id: string): Promise<{ ok: true }> {
    await this.assertOwned(userId, id);
    await this.database.client.userVocabEntry.delete({ where: { id } });
    return { ok: true as const };
  }

  // Cô lập theo user (BR-11, NFR-SEC-05): không tiết lộ tồn tại entry của người khác.
  private async assertOwned(userId: string, id: string): Promise<void> {
    const existing = await this.database.client.userVocabEntry.findUnique({
      where: { id },
      select: { userId: true },
    });
    if (!existing || existing.userId !== userId) {
      throw new NotFoundException("Không tìm thấy mục từ vựng.");
    }
  }
}
