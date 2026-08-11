import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import * as studentsController from './students.controller';
import {
  createStudentSchema,
  deleteStudentSchema,
  getStudentSchema,
  listStudentsSchema,
  updateStudentSchema,
} from './students.schema';

const router = Router();

router.use(requireAuth); // every student endpoint requires a valid token

router.get('/', validate(listStudentsSchema), studentsController.list);
router.get('/:id', validate(getStudentSchema), studentsController.getById);
router.post('/', validate(createStudentSchema), studentsController.create);
router.put('/:id', validate(updateStudentSchema), studentsController.update);
router.delete('/:id', validate(deleteStudentSchema), studentsController.remove);

export default router;
