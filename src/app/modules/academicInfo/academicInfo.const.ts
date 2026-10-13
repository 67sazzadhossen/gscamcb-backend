export const academicInfoInclude = {
  admittedBy: {
    select: { id: true, userId: true, profile: { select: { name: true } } },
  },
  admissionClass: true,
  currentClass: true,
  section: true,
} as const;
