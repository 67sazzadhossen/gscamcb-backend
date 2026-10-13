import catchAsync from '../../utils/catchAsync';
import { sendResponse } from '../../utils/sendResponse';
import { currentUser } from '../../utils/currentUser';
import { ProfileServices } from './profile.service';
const getMe = catchAsync(async (req, res) => {
  const data = await ProfileServices.getProfile(currentUser(req).userId);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Profile retrieved successfully',
    data,
  });
});
const updateMe = catchAsync(async (req, res) => {
  const data = await ProfileServices.updateProfile(
    currentUser(req).userId,
    req.body,
  );
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Profile updated successfully',
    data,
  });
});
export const ProfileControllers = { getMe, updateMe };
