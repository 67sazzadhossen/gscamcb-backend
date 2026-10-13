import 'dotenv/config';
import { z } from 'zod';
const env = z
  .object({
    NODE_ENV: z
      .enum(['development', 'production', 'test'])
      .default('development'),
    PORT: z.coerce.number().int().min(1).max(65535).default(5000),
    DATABASE_URL: z
      .string()
      .regex(
        /^postgres(?:ql)?:\/\//,
        'DATABASE_URL must be a PostgreSQL connection URL',
      ),
    CORS_ORIGIN: z.string().default('http://localhost:3000'),
  })
  .parse(process.env);
export default {
  node_env: env.NODE_ENV,
  port: env.PORT,
  database_url: env.DATABASE_URL,
  cors_origin: env.CORS_ORIGIN.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
};
