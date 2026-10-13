import { Router } from 'express';
import { auth } from '../../middlewares/auth';
import { validateRequest } from '../../middlewares/validateRequest';
import { StudentControllers } from './student.controller';
import {
  createProspectSchema,
  updateAdmissionStatusSchema,
  admitStudentSchema,
  homeVisitSchema,
} from './student.validation';
const router = Router();
router.post(
  '/prospects/:profileId/admit',
  auth('SUPER_ADMIN', 'ADMIN'),
  validateRequest(admitStudentSchema),
  StudentControllers.admitStudent,
);
router.use(auth('SUPER_ADMIN', 'ADMIN', 'TEACHER'));
router.post(
  '/prospects',
  validateRequest(createProspectSchema),
  StudentControllers.createProspect,
);
router.get('/prospects', StudentControllers.listProspects);
router.get(
  '/recycle-bin',
  auth('SUPER_ADMIN', 'ADMIN'),
  StudentControllers.recycleBin,
);
router.delete(
  '/prospects/:profileId',
  auth('SUPER_ADMIN', 'ADMIN'),
  StudentControllers.recycleStudent,
);
router.patch(
  '/prospects/:profileId/restore',
  auth('SUPER_ADMIN', 'ADMIN'),
  StudentControllers.restoreStudent,
);
router.delete(
  '/prospects/:profileId/permanent',
  auth('SUPER_ADMIN', 'ADMIN'),
  StudentControllers.permanentlyDeleteStudent,
);
router.get('/prospects/:profileId', StudentControllers.getStudent);
router.patch(
  '/prospects/:profileId/status',
  validateRequest(updateAdmissionStatusSchema),
  StudentControllers.updateAdmissionStatus,
);
router.post(
  '/prospects/:profileId/visits',
  validateRequest(homeVisitSchema),
  StudentControllers.addHomeVisit,
);
router.get('/prospects/:profileId/visits', StudentControllers.listHomeVisits);
export const StudentRoutes = router;
