import 'dotenv/config';
import { z } from 'zod';
const env = z
  .object({
    NODE_ENV: z
      .enum(['development', 'production', 'test'])
      .default('development'),
    DEFAULT_PASSWORD: z.string().min(8).max(72).optional(),
    BCRYPT_SALT_ROUNDS: z.coerce.number().int().min(10).max(15).default(12),
    JWT_SECRET: z.string().min(32),
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
  default_password: env.DEFAULT_PASSWORD,
  bcrypt_salt_rounds: env.BCRYPT_SALT_ROUNDS,
  jwt_secret: env.JWT_SECRET,
  node_env: env.NODE_ENV,
  port: env.PORT,
  database_url: env.DATABASE_URL,
  cors_origin: env.CORS_ORIGIN.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
};
