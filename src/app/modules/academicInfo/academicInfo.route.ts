import { Router } from 'express';
import { auth } from '../../middlewares/auth';
import { validateRequest } from '../../middlewares/validateRequest';
import { AcademicInfoControllers } from './academicInfo.controller';
import {
  createAcademicInfoSchema,
  updateAcademicInfoSchema,
  promoteStudentSchema,
} from './academicInfo.validation';
const router = Router();
router.use(auth('SUPER_ADMIN', 'ADMIN'));
router.get('/:userId', AcademicInfoControllers.getAcademicInfo);
router.post(
  '/:userId',
  validateRequest(createAcademicInfoSchema),
  AcademicInfoControllers.createAcademicInfo,
);
router.patch(
  '/:userId',
  validateRequest(updateAcademicInfoSchema),
  AcademicInfoControllers.updateAcademicInfo,
);
router.post(
  '/:userId/promote',
  validateRequest(promoteStudentSchema),
  AcademicInfoControllers.promoteStudent,
);
export const AcademicInfoRoutes = router;
