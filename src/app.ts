import express, { Application } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import config from './app/config';
import router from './app/routes';
import { globalErrorHandler } from './app/middlewares/globalErrorHandler';
import { notFound } from './app/middlewares/notFound';
const app: Application = express();
app.use(cors({ origin: config.cors_origin, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());
app.get('/', (_req, res) => {
  res.send('GSCAMCB Server Is Running');
});
app.use('/api/v1', router);
app.use(notFound);
app.use(globalErrorHandler);
export default app;
