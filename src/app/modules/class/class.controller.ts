import catchAsync from '../../utils/catchAsync';
import { sendResponse } from '../../utils/sendResponse';
import { ClassServices } from './class.service';
import { recordIdSchema } from '../class/class.validation';

const createClass = catchAsync(async (req, res) => {
  const data = await ClassServices.createClass(req.body);
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'Class created',
    data,
  });
});
const listClasses = catchAsync(async (_req, res) => {
  const data = await ClassServices.listClasses();
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Class records retrieved',
    data,
  });
});
const updateClass = catchAsync(async (req, res) => {
  const data = await ClassServices.updateClass(
    recordIdSchema.parse(req.params.id),
    req.body,
  );
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Class updated',
    data,
  });
});
export const ClassControllers = { createClass, listClasses, updateClass };
