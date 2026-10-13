import { Router } from 'express';
import { auth } from '../../middlewares/auth';
import { validateRequest } from '../../middlewares/validateRequest';
import { ProfileControllers } from './profile.controller';
import { updateProfileSchema } from './profile.validation';
const router = Router();
router.use(auth());
router.get('/me', ProfileControllers.getMe);
router.patch(
  '/me',
  validateRequest(updateProfileSchema),
  ProfileControllers.updateMe,
);
export const ProfileRoutes = router;
