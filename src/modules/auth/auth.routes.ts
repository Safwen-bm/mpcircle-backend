import { Router } from 'express';
import { validate } from '../../middleware/validate';
import * as authController from './auth.controller';
import { loginSchema } from './auth.schema';

const router = Router();

router.post('/login', validate(loginSchema), authController.login);

export default router;
