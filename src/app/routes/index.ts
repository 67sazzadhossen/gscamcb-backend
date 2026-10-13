import { WaiverRoutes } from '../modules/waiver/waiver.route';
import { StudentRoutes } from '../modules/student/student.route';
import { ClassRoutes } from '../modules/class/class.route';
import { SectionRoutes } from '../modules/section/section.route';
import { AcademicInfoRoutes } from '../modules/academicInfo/academicInfo.route';
import { PaymentInfoRoutes } from '../modules/paymentInfo/paymentInfo.route';
import { Router } from 'express';
import { userRoutes } from '../modules/users/user.route';
import { ProfileRoutes } from '../modules/profile/profile.route';
import { AuthRoutes } from '../modules/auth/auth.route';
import { HealthRoutes } from '../modules/health/health.route';
const router = Router();
const moduleRoutes = [
  { path: '/waivers', route: WaiverRoutes },
  { path: '/students', route: StudentRoutes },
  { path: '/classes', route: ClassRoutes },
  { path: '/sections', route: SectionRoutes },
  { path: '/academic-info', route: AcademicInfoRoutes },
  { path: '/payment-info', route: PaymentInfoRoutes },
  { path: '/health', route: HealthRoutes },
  { path: '/users', route: userRoutes },
  { path: '/profiles', route: ProfileRoutes },
  { path: '/auth', route: AuthRoutes },
];
moduleRoutes.forEach((route) => router.use(route.path, route.route));
export default router;
