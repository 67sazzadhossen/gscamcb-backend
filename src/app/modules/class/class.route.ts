import { Router } from 'express';
import { auth } from '../../middlewares/auth';
import { validateRequest } from '../../middlewares/validateRequest';
import { ClassControllers } from './class.controller';
import { classSchema } from './class.validation';
const router = Router();
router.get('/', auth(), ClassControllers.listClasses);
router.use(auth('SUPER_ADMIN', 'ADMIN'));
router.post('/', validateRequest(classSchema), ClassControllers.createClass);
router.patch(
  '/:id',
  validateRequest(classSchema),
  ClassControllers.updateClass,
);
export const ClassRoutes = router;
