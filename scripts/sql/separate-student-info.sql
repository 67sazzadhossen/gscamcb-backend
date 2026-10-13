-- One-time data-preserving transition. Run through npm run db:refactor-student.
-- All statements execute in one transaction. Child IDs and data are retained by column renames.
-- migrate:statement
CREATE TABLE "student_info" (
    "id" UUID NOT NULL,
    "profileId" UUID NOT NULL,
    "collectedById" UUID,
    "version" "Version",
    "isCadet" BOOLEAN NOT NULL DEFAULT false,
    "usesTransport" BOOLEAN NOT NULL DEFAULT false,
    "birthRegistrationNumber" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_info_pkey" PRIMARY KEY ("id")
);

-- migrate:statement
CREATE UNIQUE INDEX "student_info_profileId_key" ON "student_info"("profileId");

-- migrate:statement
CREATE INDEX "student_info_collectedById_idx" ON "student_info"("collectedById");

-- migrate:statement
INSERT INTO student_info (id, "profileId", "collectedById", version, "isCadet", "usesTransport", "birthRegistrationNumber", "createdAt", "updatedAt")
SELECT p.id, p.id, p."collectedById", p.version, p."isCadet", p."usesTransport", p."birthRegistrationNumber", p."createdAt", p."updatedAt"
FROM profiles p LEFT JOIN users u ON u.id = p."userId"
WHERE u.role = 'STUDENT' OR p."collectedById" IS NOT NULL OR p.version IS NOT NULL OR p."isCadet" OR p."usesTransport" OR p."birthRegistrationNumber" IS NOT NULL
 OR EXISTS (SELECT 1 FROM academic_info x WHERE x."profileId" = p.id)
 OR EXISTS (SELECT 1 FROM payment_info x WHERE x."profileId" = p.id)
 OR EXISTS (SELECT 1 FROM guardians x WHERE x."profileId" = p.id)
 OR EXISTS (SELECT 1 FROM local_guardians x WHERE x."profileId" = p.id)
 OR EXISTS (SELECT 1 FROM home_visits x WHERE x."profileId" = p.id)
 OR EXISTS (SELECT 1 FROM waivers x WHERE x."profileId" = p.id)
;

-- migrate:statement
DO $$ BEGIN
IF EXISTS (SELECT 1 FROM profiles p LEFT JOIN student_info s ON s."profileId" = p.id
WHERE (p."collectedById" IS NOT NULL OR p.version IS NOT NULL OR p."isCadet" OR p."usesTransport" OR p."birthRegistrationNumber" IS NOT NULL)
AND (s.id IS NULL OR ROW(p."collectedById",p.version,p."isCadet",p."usesTransport",p."birthRegistrationNumber") IS DISTINCT FROM ROW(s."collectedById",s.version,s."isCadet",s."usesTransport",s."birthRegistrationNumber")))
THEN RAISE EXCEPTION 'Student data copy verification failed'; END IF;
END $$;

-- migrate:statement
ALTER TABLE "academic_info" DROP CONSTRAINT "academic_info_profileId_fkey";

-- migrate:statement
ALTER TABLE "academic_info" RENAME COLUMN "profileId" TO "studentInfoId";

-- migrate:statement
ALTER INDEX "academic_info_profileId_key" RENAME TO "academic_info_studentInfoId_key";

-- migrate:statement
ALTER TABLE "academic_info" ADD CONSTRAINT "academic_info_studentInfoId_fkey" FOREIGN KEY ("studentInfoId") REFERENCES "student_info"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- migrate:statement
ALTER TABLE "guardians" DROP CONSTRAINT "guardians_profileId_fkey";

-- migrate:statement
ALTER TABLE "guardians" RENAME COLUMN "profileId" TO "studentInfoId";

-- migrate:statement
ALTER INDEX "guardians_profileId_key" RENAME TO "guardians_studentInfoId_key";

-- migrate:statement
ALTER TABLE "guardians" ADD CONSTRAINT "guardians_studentInfoId_fkey" FOREIGN KEY ("studentInfoId") REFERENCES "student_info"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- migrate:statement
ALTER TABLE "local_guardians" DROP CONSTRAINT "local_guardians_profileId_fkey";

-- migrate:statement
ALTER TABLE "local_guardians" RENAME COLUMN "profileId" TO "studentInfoId";

-- migrate:statement
ALTER INDEX "local_guardians_profileId_key" RENAME TO "local_guardians_studentInfoId_key";

-- migrate:statement
ALTER TABLE "local_guardians" ADD CONSTRAINT "local_guardians_studentInfoId_fkey" FOREIGN KEY ("studentInfoId") REFERENCES "student_info"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- migrate:statement
ALTER TABLE "home_visits" DROP CONSTRAINT "home_visits_profileId_fkey";

-- migrate:statement
ALTER TABLE "home_visits" RENAME COLUMN "profileId" TO "studentInfoId";

-- migrate:statement
ALTER INDEX "home_visits_profileId_visitDate_idx" RENAME TO "home_visits_studentInfoId_visitDate_idx";

-- migrate:statement
ALTER TABLE "home_visits" ADD CONSTRAINT "home_visits_studentInfoId_fkey" FOREIGN KEY ("studentInfoId") REFERENCES "student_info"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- migrate:statement
ALTER TABLE "payment_info" DROP CONSTRAINT "payment_info_profileId_fkey";

-- migrate:statement
ALTER TABLE "payment_info" RENAME COLUMN "profileId" TO "studentInfoId";

-- migrate:statement
ALTER INDEX "payment_info_profileId_key" RENAME TO "payment_info_studentInfoId_key";

-- migrate:statement
ALTER TABLE "payment_info" ADD CONSTRAINT "payment_info_studentInfoId_fkey" FOREIGN KEY ("studentInfoId") REFERENCES "student_info"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- migrate:statement
ALTER TABLE "waivers" DROP CONSTRAINT "waivers_profileId_fkey";

-- migrate:statement
ALTER TABLE "waivers" RENAME COLUMN "profileId" TO "studentInfoId";

-- migrate:statement
ALTER INDEX "waivers_profileId_feeType_status_idx" RENAME TO "waivers_studentInfoId_feeType_status_idx";

-- migrate:statement
ALTER TABLE "waivers" ADD CONSTRAINT "waivers_studentInfoId_fkey" FOREIGN KEY ("studentInfoId") REFERENCES "student_info"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- migrate:statement
ALTER TABLE "student_info" ADD CONSTRAINT "student_info_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- migrate:statement
ALTER TABLE "student_info" ADD CONSTRAINT "student_info_collectedById_fkey" FOREIGN KEY ("collectedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- migrate:statement
ALTER TABLE "profiles" DROP CONSTRAINT "profiles_collectedById_fkey";

-- migrate:statement
ALTER TABLE "profiles" DROP COLUMN "birthRegistrationNumber", DROP COLUMN "collectedById", DROP COLUMN "isCadet", DROP COLUMN "usesTransport", DROP COLUMN "version";
