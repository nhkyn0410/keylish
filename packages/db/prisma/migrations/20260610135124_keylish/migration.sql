-- CreateEnum
CREATE TYPE "CefrLevel" AS ENUM ('A1', 'A2', 'B1', 'B2', 'C1', 'C2');

-- CreateTable
CREATE TABLE "Topic" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,

    CONSTRAINT "Topic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Word" (
    "id" TEXT NOT NULL,
    "en" TEXT NOT NULL,
    "vi" TEXT NOT NULL,
    "level" "CefrLevel",
    "frequency" INTEGER NOT NULL DEFAULT 0,
    "pos" TEXT,
    "ipa" TEXT,
    "example" TEXT,
    "topicId" TEXT,
    "source" TEXT NOT NULL DEFAULT 'wiktionary+maximax67',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Word_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Topic_slug_key" ON "Topic"("slug");

-- CreateIndex
CREATE INDEX "Word_level_idx" ON "Word"("level");

-- CreateIndex
CREATE INDEX "Word_topicId_idx" ON "Word"("topicId");

-- CreateIndex
CREATE INDEX "Word_frequency_idx" ON "Word"("frequency");

-- CreateIndex
CREATE UNIQUE INDEX "Word_en_level_key" ON "Word"("en", "level");

-- AddForeignKey
ALTER TABLE "Word" ADD CONSTRAINT "Word_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE SET NULL ON UPDATE CASCADE;
