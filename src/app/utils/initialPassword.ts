import config from '../config';
import { AppError } from '../errors/AppError';
export const initialPassword = (provided?: string) => {
  const password = provided ?? config.default_password;
  if (!password)
    throw new AppError(400, 'Provide a password or configure DEFAULT_PASSWORD');
  return password;
};
