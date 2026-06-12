import { z } from "zod";

export const CefrLevelSchema = z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]);
export type CefrLevel = z.infer<typeof CefrLevelSchema>;

function csvList<T extends z.ZodTypeAny>(item: T) {
  return z.preprocess((value) => {
    if (value == null || value === "") return undefined;
    const raw = Array.isArray(value) ? value : [value];
    return raw
      .flatMap((entry) => String(entry).split(","))
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0);
  }, z.array(item).optional());
}

export const VocabQuerySchema = z.object({
  levels: csvList(CefrLevelSchema),
  topics: csvList(z.string().min(1).max(80)),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  random: z.preprocess(
    (value) => value === true || value === "1" || value === "true",
    z.boolean().default(false),
  ),
});

export type VocabQuery = z.infer<typeof VocabQuerySchema>;

export const TopicDTOSchema = z.object({
  slug: z.string(),
  title: z.string(),
  count: z.number().int().nonnegative(),
});

export type TopicDTO = z.infer<typeof TopicDTOSchema>;

export const WordDTOSchema = z.object({
  id: z.string().optional(),
  en: z.string(),
  vi: z.string(),
  level: CefrLevelSchema.nullable().optional(),
  frequency: z.number().int().nonnegative().default(0),
  pos: z.string().nullable().optional(),
  ipa: z.string().nullable().optional(),
  example: z.string().nullable().optional(),
  topic: z.string().nullable().optional(),
  source: z.string().optional(),
});

export type WordDTO = z.infer<typeof WordDTOSchema>;

export const VocabResponseSchema = z.array(WordDTOSchema);
export type VocabResponse = z.infer<typeof VocabResponseSchema>;

export const VocabCountSchema = z.object({
  count: z.number().int().nonnegative(),
});

export type VocabCount = z.infer<typeof VocabCountSchema>;
