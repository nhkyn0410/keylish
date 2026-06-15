import { BadRequestException, Injectable } from "@nestjs/common";
import { z } from "zod";
import { DatabaseService } from "../database/database.service";

type AdminTopicListItemDto = {
  id: string;
  slug: string;
  title: string;
  count: number;
};

export type AdminTopicListDto = {
  total: number;
  page: number;
  pageSize: number;
  items: AdminTopicListItemDto[];
};

export type AdminTopicDto = {
  id: string;
  slug: string;
  title: string;
};

const AdminTopicListSchema = z.object({
  search: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

const TopicCreateSchema = z.object({
  slug: z.string().trim().min(2).max(80),
  title: z.string().trim().min(2).max(120),
});

const TopicUpdateSchema = z.object({
  slug: z.string().trim().min(2).max(80).optional(),
  title: z.string().trim().min(2).max(120).optional(),
});

@Injectable()
export class TopicsService {
  constructor(private readonly database: DatabaseService) {}

  async findAll() {
    const topics = await this.database.client.topic.findMany({
      orderBy: { title: "asc" },
      select: {
        slug: true,
        title: true,
        _count: { select: { words: true } },
      },
    });

    return topics.map((topic) => ({
      slug: topic.slug,
      title: topic.title,
      count: topic._count.words,
    }));
  }

  async listTopics(input: unknown): Promise<AdminTopicListDto> {
    const parsed = AdminTopicListSchema.safeParse(input);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.message);
    }

    const query = parsed.data;
    const where = query.search
      ? {
          OR: [
            { title: { contains: query.search, mode: "insensitive" as const } },
            { slug: { contains: query.search, mode: "insensitive" as const } },
          ],
        }
      : {};

    const [total, items] = await this.database.client.$transaction([
      this.database.client.topic.count({ where }),
      this.database.client.topic.findMany({
        where,
        orderBy: [{ title: "asc" }],
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        select: { id: true, slug: true, title: true, _count: { select: { words: true } } },
      }),
    ]);

    return {
      total,
      page: query.page,
      pageSize: query.pageSize,
      items: items.map((topic) => ({
        id: topic.id,
        slug: topic.slug,
        title: topic.title,
        count: topic._count.words,
      })),
    };
  }

  async createTopic(input: unknown): Promise<AdminTopicDto> {
    const parsed = TopicCreateSchema.safeParse(input);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.message);
    }

    return this.database.client.topic.create({
      data: parsed.data,
      select: { id: true, slug: true, title: true },
    });
  }

  async updateTopic(id: string, input: unknown): Promise<AdminTopicDto> {
    const parsed = TopicUpdateSchema.safeParse(input);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.message);
    }

    return this.database.client.topic.update({
      where: { id },
      data: parsed.data,
      select: { id: true, slug: true, title: true },
    });
  }

  async deleteTopic(id: string): Promise<{ ok: true }> {
    const count = await this.database.client.word.count({ where: { topicId: id } });
    if (count > 0) throw new BadRequestException("Topic still has words.");

    await this.database.client.topic.delete({ where: { id } });
    return { ok: true as const };
  }
}
