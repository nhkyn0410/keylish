import { Injectable } from "@nestjs/common";
import { DatabaseService } from "../database/database.service";

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
}
