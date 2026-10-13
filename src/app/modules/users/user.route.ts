import { Router } from 'express';
import { auth } from '../../middlewares/auth';
import { validateRequest } from '../../middlewares/validateRequest';
import { UserControllers } from './user.controller';
import { createUserSchema, updateUserSchema } from './user.validation';
const router = Router();
router.get('/me', auth(), UserControllers.getMe);
router.use(auth('SUPER_ADMIN', 'ADMIN'));
router.post('/', validateRequest(createUserSchema), UserControllers.createUser);
router.get('/', UserControllers.listUsers);
router.get('/recycle-bin', UserControllers.recycleBin);
router.delete('/:userId', UserControllers.recycleUser);
router.patch('/:userId/restore', UserControllers.restoreUser);
router.delete('/:userId/permanent', UserControllers.permanentlyDeleteUser);
router.get('/:userId', UserControllers.getUser);
router.patch(
  '/:userId',
  validateRequest(updateUserSchema),
  UserControllers.updateUser,
);
export const userRoutes = router;
