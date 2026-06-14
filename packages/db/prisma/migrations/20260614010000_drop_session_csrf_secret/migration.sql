-- CSRF is enforced statelessly (double-submit cookie + Origin check), so the
-- per-session csrfSecretHash column was never read. Drop the dead columns.
ALTER TABLE "UserSession" DROP COLUMN IF EXISTS "csrfSecretHash";
ALTER TABLE "AdminSession" DROP COLUMN IF EXISTS "csrfSecretHash";
