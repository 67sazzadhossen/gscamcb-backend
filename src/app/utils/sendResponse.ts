import { Response } from 'express';
type TResponse<T> = {
  statusCode: number;
  success: boolean;
  message?: string;
  data: T;
};
export const sendResponse = <T>(res: Response, response: TResponse<T>) => {
  res.status(response.statusCode).json({
    success: response.success,
    message: response.message,
    data: response.data,
  });
};
