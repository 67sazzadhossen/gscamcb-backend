import { Router } from 'express';
import { auth } from '../../middlewares/auth';
import { validateRequest } from '../../middlewares/validateRequest';
import { PaymentInfoControllers } from './paymentInfo.controller';
import {
  createPaymentInfoSchema,
  updatePaymentInfoSchema,
} from './paymentInfo.validation';
const router = Router();
router.use(auth('SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT'));
router.post(
  '/:userId',
  validateRequest(createPaymentInfoSchema),
  PaymentInfoControllers.createPaymentInfo,
);
router.get('/:userId', PaymentInfoControllers.getPaymentInfo);
router.patch(
  '/:userId',
  validateRequest(updatePaymentInfoSchema),
  PaymentInfoControllers.updatePaymentInfo,
);
export const PaymentInfoRoutes = router;
