import { Router } from 'express';
import { auth } from '../../middlewares/auth';
import { validateRequest } from '../../middlewares/validateRequest';
import { employmentInfoSchema } from './employmentInfo.validation';
import { EmploymentInfoControllers } from './employmentInfo.controller';
const router = Router();
router.put(
  '/:userId',
  auth('SUPER_ADMIN', 'ADMIN'),
  validateRequest(employmentInfoSchema),
  EmploymentInfoControllers.saveEmploymentInfo,
);
export const EmploymentInfoRoutes = router;
