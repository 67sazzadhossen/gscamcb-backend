import { ZodError } from 'zod';
import { TGenericErrorResponse } from '../types/error';
export const handleZodError = (error: ZodError): TGenericErrorResponse => ({
  statusCode: 400,
  message: 'Validation error',
  errorSources: error.issues.map((issue) => ({
    path: issue.path.map(String).join('.'),
    message: issue.message,
  })),
});
