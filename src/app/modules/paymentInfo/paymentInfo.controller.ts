import catchAsync from '../../utils/catchAsync';
import { sendResponse } from '../../utils/sendResponse';
import { userIdSchema } from '../users/user.validation';
import { PaymentInfoServices } from './paymentInfo.service';
const getPaymentInfo = catchAsync(async (req, res) => {
  const data = await PaymentInfoServices.getPaymentInfo(
    userIdSchema.parse(req.params.userId),
  );
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Student payment info retrieved',
    data,
  });
});
const updatePaymentInfo = catchAsync(async (req, res) => {
  const data = await PaymentInfoServices.updatePaymentInfo(
    userIdSchema.parse(req.params.userId),
    req.body,
  );
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Student fees and class updated',
    data,
  });
});
const createPaymentInfo = catchAsync(async (req, res) => {
  const data = await PaymentInfoServices.createPaymentInfo(
    userIdSchema.parse(req.params.userId),
    req.body,
  );
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'Student payment info created',
    data,
  });
});
export const PaymentInfoControllers = {
  getPaymentInfo,
  updatePaymentInfo,
  createPaymentInfo,
};
