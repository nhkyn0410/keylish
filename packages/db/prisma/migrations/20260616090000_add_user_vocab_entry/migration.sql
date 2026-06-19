-- Kho từ vựng cá nhân (V2.1) — UserVocabEntry. Xem ADR-019 + doc/SDLC/04-database §10.

-- CreateEnum
CREATE TYPE "VocabEntrySource" AS ENUM ('system', 'custom', 'ai');

-- CreateTable
CREATE TABLE "UserVocabEntry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "wordId" TEXT,
    "source" "VocabEntrySource" NOT NULL DEFAULT 'system',
    "customEn" TEXT,
    "normalizedEn" TEXT,
    "customVi" TEXT,
    "customExample" TEXT,
    "customLevel" "CefrLevel",
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserVocabEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserVocabEntry_userId_idx" ON "UserVocabEntry"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserVocabEntry_userId_wordId_key" ON "UserVocabEntry"("userId", "wordId");

-- CreateIndex
CREATE UNIQUE INDEX "UserVocabEntry_userId_normalizedEn_key" ON "UserVocabEntry"("userId", "normalizedEn");

-- AddForeignKey
ALTER TABLE "UserVocabEntry" ADD CONSTRAINT "UserVocabEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserVocabEntry" ADD CONSTRAINT "UserVocabEntry_wordId_fkey" FOREIGN KEY ("wordId") REFERENCES "Word"("id") ON DELETE SET NULL ON UPDATE CASCADE;
