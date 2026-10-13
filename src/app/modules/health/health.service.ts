import { THealth } from './health.interface';
const getHealth = (): THealth => ({
  status: 'ok',
  service: 'gscamcb-backend',
  uptime: process.uptime(),
});
export const HealthServices = { getHealth };
