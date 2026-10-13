import { Router } from 'express';
import { auth } from '../../middlewares/auth';
import { validateRequest } from '../../middlewares/validateRequest';
import { WaiverControllers } from './waiver.controller';
import { createWaiverSchema, decideWaiverSchema } from './waiver.validation';
const router = Router();
router.patch(
  '/:id/decision',
  auth('SUPER_ADMIN', 'ADMIN'),
  validateRequest(decideWaiverSchema),
  WaiverControllers.decideWaiver,
);
router.use(auth('SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT'));
router.post(
  '/:userId',
  validateRequest(createWaiverSchema),
  WaiverControllers.createWaiver,
);
router.get('/:userId', WaiverControllers.listWaivers);
export const WaiverRoutes = router;
