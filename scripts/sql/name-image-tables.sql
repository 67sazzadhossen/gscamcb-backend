CREATE TYPE "Version" AS ENUM ('ENGLISH', 'BANGLA');
CREATE TABLE names (
 id UUID NOT NULL PRIMARY KEY,
 "firstName" TEXT NOT NULL,
 "middleName" TEXT,
 "lastName" TEXT NOT NULL,
 "bengaliFirstName" TEXT,
 "bengaliMiddleName" TEXT,
 "bengaliLastName" TEXT
);
CREATE TABLE images (
 id UUID NOT NULL PRIMARY KEY,
 "profileId" UUID NOT NULL,
 "displayUrl" TEXT NOT NULL,
 "publicId" TEXT NOT NULL,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "updatedAt" TIMESTAMP(3) NOT NULL,
 CONSTRAINT "images_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES profiles(id) ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "images_profileId_key" ON images("profileId");
CREATE UNIQUE INDEX "images_publicId_key" ON images("publicId");
ALTER TABLE profiles ADD COLUMN version "Version", ADD COLUMN "isCadet" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE profiles ADD COLUMN "nameId" UUID;
INSERT INTO names (id, "firstName", "middleName", "lastName", "bengaliFirstName", "bengaliMiddleName", "bengaliLastName") SELECT id, "firstName", "middleName", "lastName", "bengaliFirstName", "bengaliMiddleName", "bengaliLastName" FROM profiles;
UPDATE profiles SET "nameId" = id;
ALTER TABLE profiles ALTER COLUMN "nameId" SET NOT NULL;
CREATE UNIQUE INDEX "profiles_nameId_key" ON profiles("nameId");
ALTER TABLE profiles ADD CONSTRAINT "profiles_nameId_fkey" FOREIGN KEY ("nameId") REFERENCES names(id) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE profiles DROP COLUMN "firstName", DROP COLUMN "middleName", DROP COLUMN "lastName", DROP COLUMN "bengaliFirstName", DROP COLUMN "bengaliMiddleName", DROP COLUMN "bengaliLastName";
ALTER TABLE guardians ADD COLUMN "nameId" UUID;
INSERT INTO names (id, "firstName", "middleName", "lastName", "bengaliFirstName", "bengaliMiddleName", "bengaliLastName") SELECT id, "firstName", "middleName", "lastName", "bengaliFirstName", "bengaliMiddleName", "bengaliLastName" FROM guardians;
UPDATE guardians SET "nameId" = id;
ALTER TABLE guardians ALTER COLUMN "nameId" SET NOT NULL;
CREATE UNIQUE INDEX "guardians_nameId_key" ON guardians("nameId");
ALTER TABLE guardians ADD CONSTRAINT "guardians_nameId_fkey" FOREIGN KEY ("nameId") REFERENCES names(id) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE guardians DROP COLUMN "firstName", DROP COLUMN "middleName", DROP COLUMN "lastName", DROP COLUMN "bengaliFirstName", DROP COLUMN "bengaliMiddleName", DROP COLUMN "bengaliLastName";
ALTER TABLE local_guardians ADD COLUMN "nameId" UUID;
INSERT INTO names (id, "firstName", "middleName", "lastName", "bengaliFirstName", "bengaliMiddleName", "bengaliLastName") SELECT id, "firstName", "middleName", "lastName", "bengaliFirstName", "bengaliMiddleName", "bengaliLastName" FROM local_guardians;
UPDATE local_guardians SET "nameId" = id;
ALTER TABLE local_guardians ALTER COLUMN "nameId" SET NOT NULL;
CREATE UNIQUE INDEX "local_guardians_nameId_key" ON local_guardians("nameId");
ALTER TABLE local_guardians ADD CONSTRAINT "local_guardians_nameId_fkey" FOREIGN KEY ("nameId") REFERENCES names(id) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE local_guardians DROP COLUMN "firstName", DROP COLUMN "middleName", DROP COLUMN "lastName", DROP COLUMN "bengaliFirstName", DROP COLUMN "bengaliMiddleName", DROP COLUMN "bengaliLastName";
ALTER TABLE profiles DROP COLUMN "photoUrl";
