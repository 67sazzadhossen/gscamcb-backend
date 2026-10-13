import { UserServices } from '../modules/users/user.service';
import { AppError } from '../errors/AppError';
export const getStudentProfile = async (userId: string) => {
  const user = await UserServices.getUser(userId);
  if (user.role !== 'STUDENT')
    throw new AppError(400, 'This action is only available for students');
  if (!user.profile?.studentInfo)
    throw new AppError(404, 'Student profile not found');
  return { ...user.profile.studentInfo, profile: user.profile };
};
