import { z } from 'zod';
import catchAsync from '../../utils/catchAsync';
import { currentUser } from '../../utils/currentUser';
import { sendResponse } from '../../utils/sendResponse';
import { StudentServices } from './student.service';
const id = z.uuid();
const createProspect = catchAsync(async (req, res) => {
  const data = await StudentServices.createProspect(req.body, currentUser(req));
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'Prospective student saved',
    data,
  });
});
const listProspects = catchAsync(async (req, res) => {
  const data = await StudentServices.listProspects(req.query, currentUser(req));
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Students retrieved',
    data,
  });
});
const getStudent = catchAsync(async (req, res) => {
  const data = await StudentServices.getStudent(
    id.parse(req.params.profileId),
    currentUser(req),
  );
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Student retrieved',
    data,
  });
});
const updateAdmissionStatus = catchAsync(async (req, res) => {
  const data = await StudentServices.updateAdmissionStatus(
    id.parse(req.params.profileId),
    req.body.admissionStatus,
    currentUser(req),
  );
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Admission status updated',
    data,
  });
});
const admitStudent = catchAsync(async (req, res) => {
  const data = await StudentServices.admitStudent(
    id.parse(req.params.profileId),
    req.body,
    currentUser(req),
  );
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'Student admitted and account created',
    data,
  });
});
const addHomeVisit = catchAsync(async (req, res) => {
  const data = await StudentServices.addHomeVisit(
    id.parse(req.params.profileId),
    req.body,
    currentUser(req),
  );
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'Home visit recorded',
    data,
  });
});
const listHomeVisits = catchAsync(async (req, res) => {
  const data = await StudentServices.listHomeVisits(
    id.parse(req.params.profileId),
    currentUser(req),
  );
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Home visits retrieved',
    data,
  });
});
const recycleStudent = catchAsync(async (req, res) => {
  const data = await StudentServices.recycleStudent(
    id.parse(req.params.profileId),
    currentUser(req),
  );
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Student moved to recycle bin',
    data,
  });
});
const restoreStudent = catchAsync(async (req, res) => {
  const data = await StudentServices.restoreStudent(
    id.parse(req.params.profileId),
    currentUser(req),
  );
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Student restored',
    data,
  });
});
const permanentlyDeleteStudent = catchAsync(async (req, res) => {
  await StudentServices.permanentlyDeleteStudent(
    id.parse(req.params.profileId),
    currentUser(req),
  );
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Student permanently deleted',
    data: null,
  });
});
const recycleBin = catchAsync(async (req, res) => {
  const data = await StudentServices.listProspects(
    req.query,
    currentUser(req),
    true,
  );
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Student recycle bin retrieved',
    data,
  });
});
export const StudentControllers = {
  recycleStudent,
  restoreStudent,
  permanentlyDeleteStudent,
  recycleBin,
  createProspect,
  listProspects,
  getStudent,
  updateAdmissionStatus,
  admitStudent,
  addHomeVisit,
  listHomeVisits,
};
