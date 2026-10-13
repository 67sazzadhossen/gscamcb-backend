CREATE TABLE classes (
 id UUID NOT NULL PRIMARY KEY,
 name TEXT NOT NULL,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE UNIQUE INDEX classes_name_key ON classes(name);
CREATE TABLE sections (
 id UUID NOT NULL PRIMARY KEY,
 name TEXT NOT NULL,
 "classId" UUID NOT NULL,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "updatedAt" TIMESTAMP(3) NOT NULL,
 CONSTRAINT "sections_classId_fkey" FOREIGN KEY ("classId") REFERENCES classes(id) ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "sections_classId_name_key" ON sections("classId", name);
CREATE UNIQUE INDEX "sections_id_classId_key" ON sections(id, "classId");
INSERT INTO classes (id, name, "createdAt", "updatedAt")
SELECT gen_random_uuid(), names.name, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP FROM (
 SELECT "admissionClass" AS name FROM academic_info UNION SELECT "currentClass" AS name FROM academic_info
) names;
ALTER TABLE academic_info ADD COLUMN "admissionClassId" UUID, ADD COLUMN "currentClassId" UUID, ADD COLUMN "sectionId" UUID, ADD COLUMN "rollNumber" INTEGER;
UPDATE academic_info a SET "admissionClassId" = c.id FROM classes c WHERE c.name = a."admissionClass";
UPDATE academic_info a SET "currentClassId" = c.id FROM classes c WHERE c.name = a."currentClass";
ALTER TABLE academic_info ALTER COLUMN "admissionClassId" SET NOT NULL, ALTER COLUMN "currentClassId" SET NOT NULL;
ALTER TABLE academic_info ADD CONSTRAINT "academic_info_admissionClassId_fkey" FOREIGN KEY ("admissionClassId") REFERENCES classes(id) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE academic_info ADD CONSTRAINT "academic_info_currentClassId_fkey" FOREIGN KEY ("currentClassId") REFERENCES classes(id) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE academic_info ADD CONSTRAINT "academic_info_sectionId_currentClassId_fkey" FOREIGN KEY ("sectionId", "currentClassId") REFERENCES sections(id, "classId") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE UNIQUE INDEX "academic_info_currentClassId_sectionId_academicYear_rollNumber_key" ON academic_info("currentClassId", "sectionId", "academicYear", "rollNumber");
ALTER TABLE academic_info DROP COLUMN "admissionClass", DROP COLUMN "currentClass";
