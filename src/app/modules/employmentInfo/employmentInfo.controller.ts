import catchAsync from '../../utils/catchAsync';
import { sendResponse } from '../../utils/sendResponse';
import { currentUser } from '../../utils/currentUser';
import { userIdSchema } from '../users/user.validation';
import { EmploymentInfoServices } from './employmentInfo.service';
const saveEmploymentInfo = catchAsync(async (req, res) => {
  const data = await EmploymentInfoServices.saveEmploymentInfo(
    userIdSchema.parse(req.params.userId),
    currentUser(req).role,
    req.body,
  );
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Employment information saved',
    data,
  });
});
export const EmploymentInfoControllers = { saveEmploymentInfo };
