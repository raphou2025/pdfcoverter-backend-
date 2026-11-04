-- Remove the existing foreign keys before changing the referenced ID types.
ALTER TABLE "ConversionHistory"
DROP CONSTRAINT "ConversionHistory_userId_fkey";

ALTER TABLE "TranslationHistory"
DROP CONSTRAINT "TranslationHistory_userId_fkey";

ALTER TABLE "User"
DROP CONSTRAINT "User_pkey";

-- Assign each existing user an integer ID and remap history references.
ALTER TABLE "User"
ADD COLUMN "newId" INTEGER;

WITH assigned_ids AS (
    SELECT "id", ROW_NUMBER() OVER (ORDER BY "createdAt", "id")::INTEGER AS "newId"
    FROM "User"
)
UPDATE "User" AS users
SET "newId" = assigned_ids."newId"
FROM assigned_ids
WHERE users."id" = assigned_ids."id";

ALTER TABLE "ConversionHistory"
ADD COLUMN "newUserId" INTEGER;

UPDATE "ConversionHistory" AS history
SET "newUserId" = users."newId"
FROM "User" AS users
WHERE history."userId" = users."id";

ALTER TABLE "TranslationHistory"
ADD COLUMN "newUserId" INTEGER;

UPDATE "TranslationHistory" AS history
SET "newUserId" = users."newId"
FROM "User" AS users
WHERE history."userId" = users."id";

ALTER TABLE "User"
ALTER COLUMN "newId" SET NOT NULL;

ALTER TABLE "ConversionHistory"
ALTER COLUMN "newUserId" SET NOT NULL;

ALTER TABLE "TranslationHistory"
ALTER COLUMN "newUserId" SET NOT NULL;

ALTER TABLE "ConversionHistory"
DROP COLUMN "userId";

ALTER TABLE "ConversionHistory"
RENAME COLUMN "newUserId" TO "userId";

ALTER TABLE "TranslationHistory"
DROP COLUMN "userId";

ALTER TABLE "TranslationHistory"
RENAME COLUMN "newUserId" TO "userId";

ALTER TABLE "User"
DROP COLUMN "id";

ALTER TABLE "User"
RENAME COLUMN "newId" TO "id";

CREATE SEQUENCE "User_id_seq";
ALTER TABLE "User"
ALTER COLUMN "id" SET DEFAULT nextval('"User_id_seq"');
ALTER SEQUENCE "User_id_seq" OWNED BY "User"."id";
SELECT setval('"User_id_seq"', COALESCE((SELECT MAX("id") FROM "User"), 1), EXISTS (SELECT 1 FROM "User"));

ALTER TABLE "User"
ADD CONSTRAINT "User_pkey" PRIMARY KEY ("id");

ALTER TABLE "ConversionHistory"
ADD CONSTRAINT "ConversionHistory_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "TranslationHistory"
ADD CONSTRAINT "TranslationHistory_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
