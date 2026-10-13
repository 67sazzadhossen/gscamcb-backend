import { Router } from 'express';
import { auth } from '../../middlewares/auth';
import { validateRequest } from '../../middlewares/validateRequest';
import { SectionControllers } from './section.controller';
import { sectionSchema, updateSectionSchema } from './section.validation';
const router = Router();
router.get('/', auth(), SectionControllers.listSections);
router.use(auth('SUPER_ADMIN', 'ADMIN'));
router.post(
  '/',
  validateRequest(sectionSchema),
  SectionControllers.createSection,
);
router.patch(
  '/:id',
  validateRequest(updateSectionSchema),
  SectionControllers.updateSection,
);
export const SectionRoutes = router;
