/* Schema/type kho từ vựng cá nhân (V2.1 — FR-PVOC). Dùng chung api + web.
   Xem doc/SDLC/05-api §13, 04-database §10. */
import { z } from "zod";
import { CefrLevelSchema, WordDTOSchema } from "./vocab";

/** Thêm 1 từ hệ thống vào kho cá nhân (tham chiếu). */
export const PickWordSchema = z.object({
  wordId: z.string().min(1).max(64),
});
export type PickWordDto = z.infer<typeof PickWordSchema>;

/** Tạo từ vào kho cá nhân (dedup-on-add). */
export const CreateUserVocabSchema = z.object({
  en: z.string().trim().min(1).max(120),
  vi: z.string().trim().min(1).max(240),
  example: z.string().trim().max(500).nullable().optional(),
  level: CefrLevelSchema.nullable().optional(),
  note: z.string().trim().max(500).nullable().optional(),
  // true = người dùng đã chọn "giữ biến thể riêng" → bỏ qua bước gợi ý.
  allowVariant: z.coerce.boolean().optional().default(false),
});
export type CreateUserVocabDto = z.infer<typeof CreateUserVocabSchema>;

/** Sửa / override entry (chỉ field cá nhân; không đổi từ hệ thống gốc). */
export const UpdateUserVocabSchema = z.object({
  customVi: z.string().trim().max(240).nullable().optional(),
  customExample: z.string().trim().max(500).nullable().optional(),
  note: z.string().trim().max(500).nullable().optional(),
});
export type UpdateUserVocabDto = z.infer<typeof UpdateUserVocabSchema>;

export const UserVocabQuerySchema = z.object({
  search: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(50),
});
export type UserVocabQuery = z.infer<typeof UserVocabQuerySchema>;

export const VocabEntrySourceSchema = z.enum(["system", "custom", "ai"]);
export type VocabEntrySourceDto = z.infer<typeof VocabEntrySourceSchema>;

/** Một entry trong kho cá nhân: tham chiếu (có `word`) hoặc custom (có `custom`). */
export const UserVocabEntrySchema = z.object({
  id: z.string(),
  source: VocabEntrySourceSchema,
  word: WordDTOSchema.nullable().optional(),
  custom: z
    .object({
      en: z.string(),
      vi: z.string(),
      example: z.string().nullable().optional(),
      level: CefrLevelSchema.nullable().optional(),
    })
    .nullable()
    .optional(),
  note: z.string().nullable().optional(),
  createdAt: z.string(),
});
export type UserVocabEntryDto = z.infer<typeof UserVocabEntrySchema>;

export type AddVocabResult =
  | { status: "linked"; entry: UserVocabEntryDto }
  | { status: "created"; entry: UserVocabEntryDto }
  | { status: "suggest"; candidates: Array<Pick<WordDTOLite, "id" | "en" | "vi" | "level" | "ipa">> };

type WordDTOLite = { id?: string; en: string; vi: string; level?: string | null; ipa?: string | null };
