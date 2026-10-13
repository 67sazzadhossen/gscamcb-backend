import type { TStudentDetails } from './student.interface';
import { createPerson, updatePerson } from '../profile/profile.utils';
export const studentDetailsData = (
  payload: TStudentDetails,
  update = false,
) => {
  const { guardian, localGuardian, ...fields } = payload;
  const relation = (person: NonNullable<typeof guardian>) =>
    update
      ? {
          upsert: {
            create: createPerson(person),
            update: updatePerson(person),
          },
        }
      : { create: createPerson(person) };
  return {
    ...fields,
    ...(guardian ? { guardian: relation(guardian) } : {}),
    ...(localGuardian ? { localGuardian: relation(localGuardian) } : {}),
  };
};
