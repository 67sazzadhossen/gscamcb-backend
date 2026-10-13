import catchAsync from '../../utils/catchAsync';
import { sendResponse } from '../../utils/sendResponse';
import { currentUser } from '../../utils/currentUser';
import { AuthServices } from './auth.service';
const login = catchAsync(async (req, res) => {
  const data = await AuthServices.login(req.body.identifier, req.body.password);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Signed in successfully',
    data,
  });
});
const changePassword = catchAsync(async (req, res) => {
  await AuthServices.changePassword(
    currentUser(req).id,
    req.body.currentPassword,
    req.body.newPassword,
  );
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Password changed successfully',
    data: null,
  });
});
export const AuthControllers = { login, changePassword };
