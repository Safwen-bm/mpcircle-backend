import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import * as assignmentsController from './assignments.controller';
import {
  createAssignmentSchema,
  listAssignmentsSchema,
  updateAssignmentSchema,
} from './assignments.schema';

const router = Router();

router.use(requireAuth);

router.get('/', validate(listAssignmentsSchema), assignmentsController.list);
router.post('/', validate(createAssignmentSchema), assignmentsController.create);
router.patch('/:id', validate(updateAssignmentSchema), assignmentsController.update);

export default router;
