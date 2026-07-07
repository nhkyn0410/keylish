-- Allow custom user vocabulary entries to carry a topic so the personal
-- vocabulary library can filter by topic without copying system Word rows.
ALTER TABLE "UserVocabEntry" ADD COLUMN "customTopicId" TEXT;

ALTER TABLE "UserVocabEntry"
  ADD CONSTRAINT "UserVocabEntry_customTopicId_fkey"
  FOREIGN KEY ("customTopicId") REFERENCES "Topic"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "UserVocabEntry_customTopicId_idx" ON "UserVocabEntry"("customTopicId");
CREATE INDEX "UserVocabEntry_userId_customLevel_idx" ON "UserVocabEntry"("userId", "customLevel");
