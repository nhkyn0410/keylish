import { BadRequestException, Injectable } from "@nestjs/common";
import { z } from "zod";
import { UpdateUserStatusSchema } from "../auth/auth.dto";
import { DatabaseService } from "../database/database.service";

type UserStatusValue = "ACTIVE" | "DISABLED" | "DELETED";

export type AdminSummaryDto = {
  users: number;
  topics: number;
  vocab: number;
  api: { status: "ok" };
};

export type AdminUserListItemDto = {
  id: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  status: UserStatusValue;
  createdAt: Date;
  updatedAt: Date;
};

export type AdminUserListDto = {
  total: number;
  page: number;
  pageSize: number;
  items: AdminUserListItemDto[];
};

export type AdminUserDetailDto = AdminUserListItemDto & {
  deletedAt: Date | null;
};

@Injectable()
export class AdminService {
  constructor(private readonly database: DatabaseService) {}

  async getAdminSummary(): Promise<AdminSummaryDto> {
    const [users, topics, vocab] = await this.database.client.$transaction([
      this.database.client.user.count({ where: { deletedAt: null, status: { not: "DELETED" } } }),
      this.database.client.topic.count(),
      this.database.client.word.count(),
    ]);

    return {
      users,
      topics,
      vocab,
      api: { status: "ok" as const },
    };
  }

  async listUsers(input: unknown): Promise<AdminUserListDto> {
    const schema = z.object({
      search: z.string().trim().optional(),
      status: z.enum(["ACTIVE", "DISABLED", "DELETED"]).optional(),
      page: z.coerce.number().int().min(1).default(1),
      pageSize: z.coerce.number().int().min(1).max(100).default(20),
    });

    const parsed = schema.safeParse(input);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.message);
    }

    const query = parsed.data;
    const where = {
      ...(query.search
        ? {
            OR: [
              { email: { contains: query.search, mode: "insensitive" as const } },
              { displayName: { contains: query.search, mode: "insensitive" as const } },
            ],
          }
        : {}),
      ...(query.status ? { status: query.status } : {}),
    };

    const [total, items] = await this.database.client.$transaction([
      this.database.client.user.count({ where }),
      this.database.client.user.findMany({
        where,
        orderBy: [{ createdAt: "desc" }],
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        select: {
          id: true,
          email: true,
          displayName: true,
          avatarUrl: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
    ]);

    return {
      total,
      page: query.page,
      pageSize: query.pageSize,
      items: items.map((user) => ({
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        status: user.status as UserStatusValue,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      })),
    };
  }

  async getUserById(id: string): Promise<AdminUserDetailDto> {
    const user = await this.database.client.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        displayName: true,
        avatarUrl: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
      },
    });

    if (!user) throw new BadRequestException("User not found.");

    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      status: user.status as UserStatusValue,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      deletedAt: user.deletedAt,
    };
  }

  async updateUserById(id: string, input: unknown): Promise<AdminUserDetailDto> {
    const parsed = UpdateUserStatusSchema.safeParse(input);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.message);
    }

    const user = await this.database.client.user.update({
      where: { id },
      data: { status: parsed.data.status as UserStatusValue },
      select: {
        id: true,
        email: true,
        displayName: true,
        avatarUrl: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
      },
    });

    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      status: user.status as UserStatusValue,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      deletedAt: user.deletedAt,
    };
  }
}
