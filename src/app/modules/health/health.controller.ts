import status from 'http-status';
import catchAsync from '../../utils/catchAsync';
import { sendResponse } from '../../utils/sendResponse';
import { HealthServices } from './health.service';
const getHealth = catchAsync(async (_req, res) => {
  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: 'GSCAMCB server is running',
    data: HealthServices.getHealth(),
  });
});
export const HealthControllers = { getHealth };
