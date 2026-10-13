CREATE TABLE academic_info (
 id UUID NOT NULL PRIMARY KEY,
 "profileId" UUID NOT NULL,
 "admissionClass" TEXT NOT NULL,
 "currentClass" TEXT NOT NULL,
 "academicYear" INTEGER NOT NULL,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "updatedAt" TIMESTAMP(3) NOT NULL,
 CONSTRAINT "academic_info_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES profiles(id) ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "academic_info_profileId_key" ON academic_info("profileId");
INSERT INTO academic_info (id, "profileId", "admissionClass", "currentClass", "academicYear", "createdAt", "updatedAt")
SELECT gen_random_uuid(), "profileId", "admissionClass", "currentClass", "academicYear", "createdAt", "updatedAt" FROM payment_info;
ALTER TABLE payment_info DROP COLUMN "admissionClass", DROP COLUMN "currentClass";
