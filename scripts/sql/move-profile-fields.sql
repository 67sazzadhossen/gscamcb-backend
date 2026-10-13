ALTER TABLE profiles ADD COLUMN IF NOT EXISTS "firstName" TEXT, ADD COLUMN IF NOT EXISTS "middleName" TEXT, ADD COLUMN IF NOT EXISTS "lastName" TEXT, ADD COLUMN IF NOT EXISTS "bengaliName" TEXT, ADD COLUMN IF NOT EXISTS shift "Shift";

INSERT INTO profiles (id, "userId", "createdAt", "updatedAt")
SELECT gen_random_uuid(), u.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP FROM users u
WHERE NOT EXISTS (SELECT 1 FROM profiles p WHERE p."userId" = u.id);

WITH names AS (
  SELECT id, shift, regexp_split_to_array(trim(name), '\s+') AS parts FROM users
)
UPDATE profiles p SET
  "firstName" = n.parts[1],
  "middleName" = CASE WHEN array_length(n.parts, 1) > 2 THEN array_to_string(n.parts[2:array_length(n.parts, 1)-1], ' ') ELSE NULL END,
  "lastName" = CASE WHEN array_length(n.parts, 1) > 1 THEN n.parts[array_length(n.parts, 1)] ELSE '' END,
  shift = n.shift
FROM names n WHERE p."userId" = n.id AND p."firstName" IS NULL;

ALTER TABLE profiles ALTER COLUMN "firstName" SET NOT NULL, ALTER COLUMN "lastName" SET NOT NULL, ALTER COLUMN shift SET NOT NULL;

ALTER TABLE users DROP COLUMN name, DROP COLUMN shift;
