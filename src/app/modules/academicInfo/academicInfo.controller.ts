import { currentUser } from '../../utils/currentUser';
import catchAsync from '../../utils/catchAsync';
import { sendResponse } from '../../utils/sendResponse';
import { userIdSchema } from '../users/user.validation';
import { AcademicInfoServices } from './academicInfo.service';
const getAcademicInfo = catchAsync(async (req, res) => {
  const data = await AcademicInfoServices.getAcademicInfo(
    userIdSchema.parse(req.params.userId),
  );
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Academic info retrieved',
    data,
  });
});
const createAcademicInfo = catchAsync(async (req, res) => {
  const data = await AcademicInfoServices.createAcademicInfo(
    userIdSchema.parse(req.params.userId),
    req.body,
    currentUser(req).id,
  );
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'Academic info created',
    data,
  });
});
const updateAcademicInfo = catchAsync(async (req, res) => {
  const data = await AcademicInfoServices.updateAcademicInfo(
    userIdSchema.parse(req.params.userId),
    req.body,
  );
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Academic info updated',
    data,
  });
});
const promoteStudent = catchAsync(async (req, res) => {
  const data = await AcademicInfoServices.promoteStudent(
    userIdSchema.parse(req.params.userId),
    req.body,
  );
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Student promoted and fees updated',
    data,
  });
});
export const AcademicInfoControllers = {
  getAcademicInfo,
  createAcademicInfo,
  updateAcademicInfo,
  promoteStudent,
};
