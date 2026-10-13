import { z } from 'zod';
import catchAsync from '../../utils/catchAsync';
import { currentUser } from '../../utils/currentUser';
import { sendResponse } from '../../utils/sendResponse';
import { userIdSchema } from '../users/user.validation';
import { WaiverServices } from './waiver.service';
const createWaiver = catchAsync(async (req, res) => {
  const data = await WaiverServices.createWaiver(
    userIdSchema.parse(req.params.userId),
    req.body,
    currentUser(req).id,
  );
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'Waiver requested',
    data,
  });
});
const listWaivers = catchAsync(async (req, res) => {
  const data = await WaiverServices.listWaivers(
    userIdSchema.parse(req.params.userId),
  );
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Waivers retrieved',
    data,
  });
});
const decideWaiver = catchAsync(async (req, res) => {
  const data = await WaiverServices.decideWaiver(
    z.uuid().parse(req.params.id),
    req.body,
    currentUser(req).id,
  );
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Waiver decision saved',
    data,
  });
});
export const WaiverControllers = { createWaiver, listWaivers, decideWaiver };
