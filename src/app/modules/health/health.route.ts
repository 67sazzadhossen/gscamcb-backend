import { Router } from 'express';
import { HealthControllers } from './health.controller';
const router = Router();
router.get('/', HealthControllers.getHealth);
export const HealthRoutes = router;
