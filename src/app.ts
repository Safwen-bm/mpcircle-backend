import cors from 'cors';
import express, { Request, Response } from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import assignmentsRoutes from './modules/assignments/assignments.routes';
import authRoutes from './modules/auth/auth.routes';
import coursesRoutes from './modules/courses/courses.routes';
import studentsRoutes from './modules/students/students.routes';

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(express.json());
  if (process.env.NODE_ENV !== 'test') {
    app.use(morgan('dev'));
  }

  app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({ success: true, message: 'OK' });
  });

  app.use('/auth', authRoutes);
  app.use('/students', studentsRoutes);
  app.use('/courses', coursesRoutes);
  app.use('/assignments', assignmentsRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
