import { Router } from 'express';
import { auth } from '../../middlewares/auth';
import { validateRequest } from '../../middlewares/validateRequest';
import { AuthControllers } from './auth.controller';
import { loginSchema, changePasswordSchema } from './auth.validation';
const router = Router();
router.post('/login', validateRequest(loginSchema), AuthControllers.login);
router.post(
  '/change-password',
  auth(),
  validateRequest(changePasswordSchema),
  AuthControllers.changePassword,
);
export const AuthRoutes = router;
