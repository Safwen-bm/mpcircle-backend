import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import * as coursesController from './courses.controller';
import { createCourseSchema, getCourseSchema, listCoursesSchema } from './courses.schema';

const router = Router();

router.use(requireAuth);

router.get('/', validate(listCoursesSchema), coursesController.list);
router.get('/:id', validate(getCourseSchema), coursesController.getById);
router.post('/', validate(createCourseSchema), coursesController.create);

export default router;
