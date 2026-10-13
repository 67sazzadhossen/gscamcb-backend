import catchAsync from '../../utils/catchAsync';
import { sendResponse } from '../../utils/sendResponse';
import { SectionServices } from './section.service';
import { recordIdSchema } from '../class/class.validation';

const createSection = catchAsync(async (req, res) => {
  const data = await SectionServices.createSection(req.body);
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'Section created',
    data,
  });
});
const listSections = catchAsync(async (req, res) => {
  const data = await SectionServices.listSections(
    req.query.classId === undefined
      ? undefined
      : recordIdSchema.parse(req.query.classId),
  );
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Section records retrieved',
    data,
  });
});
const updateSection = catchAsync(async (req, res) => {
  const data = await SectionServices.updateSection(
    recordIdSchema.parse(req.params.id),
    req.body,
  );
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Section updated',
    data,
  });
});
export const SectionControllers = {
  createSection,
  listSections,
  updateSection,
};
