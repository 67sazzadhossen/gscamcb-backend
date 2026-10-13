ALTER TABLE profiles ADD COLUMN "bengaliFirstName" TEXT, ADD COLUMN "bengaliMiddleName" TEXT, ADD COLUMN "bengaliLastName" TEXT;

CREATE TABLE guardians (
  id UUID NOT NULL,
  "profileId" UUID NOT NULL,
  "firstName" TEXT NOT NULL,
  "middleName" TEXT,
  "lastName" TEXT NOT NULL,
  "bengaliFirstName" TEXT,
  "bengaliMiddleName" TEXT,
  "bengaliLastName" TEXT,
  relationship TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  occupation TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT guardians_pkey PRIMARY KEY (id),
  CONSTRAINT guardians_profileId_fkey FOREIGN KEY ("profileId") REFERENCES profiles(id) ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "guardians_profileId_key" ON guardians("profileId");

CREATE TABLE local_guardians (
  id UUID NOT NULL,
  "profileId" UUID NOT NULL,
  "firstName" TEXT NOT NULL,
  "middleName" TEXT,
  "lastName" TEXT NOT NULL,
  "bengaliFirstName" TEXT,
  "bengaliMiddleName" TEXT,
  "bengaliLastName" TEXT,
  relationship TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  occupation TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT local_guardians_pkey PRIMARY KEY (id),
  CONSTRAINT local_guardians_profileId_fkey FOREIGN KEY ("profileId") REFERENCES profiles(id) ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "local_guardians_profileId_key" ON local_guardians("profileId");

WITH names AS (
 SELECT id, regexp_split_to_array(trim("bengaliName"), '\s+') AS parts FROM profiles WHERE "bengaliName" IS NOT NULL
)
UPDATE profiles p SET "bengaliFirstName" = n.parts[1],
 "bengaliMiddleName" = CASE WHEN array_length(n.parts,1) > 2 THEN array_to_string(n.parts[2:array_length(n.parts,1)-1], ' ') ELSE NULL END,
 "bengaliLastName" = CASE WHEN array_length(n.parts,1) > 1 THEN n.parts[array_length(n.parts,1)] ELSE NULL END
FROM names n WHERE n.id = p.id;

WITH names AS (
 SELECT id, "guardianPhone", regexp_split_to_array(trim(COALESCE("guardianName", '')), '\s+') AS parts FROM profiles
 WHERE "guardianName" IS NOT NULL OR "guardianPhone" IS NOT NULL
)
INSERT INTO guardians (id, "profileId", "firstName", "middleName", "lastName", phone, "createdAt", "updatedAt")
SELECT gen_random_uuid(), id, parts[1],
 CASE WHEN array_length(parts,1) > 2 THEN array_to_string(parts[2:array_length(parts,1)-1], ' ') ELSE NULL END,
 CASE WHEN array_length(parts,1) > 1 THEN parts[array_length(parts,1)] ELSE '' END,
 "guardianPhone", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP FROM names;

ALTER TABLE profiles DROP COLUMN "bengaliName", DROP COLUMN "guardianName", DROP COLUMN "guardianPhone";
