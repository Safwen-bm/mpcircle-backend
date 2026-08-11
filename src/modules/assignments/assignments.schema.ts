import { z } from 'zod';

const statusEnum = z.enum(['PENDING', 'SUBMITTED', 'GRADED', 'LATE']);

export const listAssignmentsSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({}).optional(),
  query: z.object({
    page: z.string().regex(/^\d+$/).optional(),
    limit: z.string().regex(/^\d+$/).optional(),
    q: z.string().optional(),
    status: statusEnum.optional(),
    studentId: z.string().uuid().optional(),
    courseId: z.string().uuid().optional(),
  }),
});

export const createAssignmentSchema = z.object({
  query: z.object({}).optional(),
  params: z.object({}).optional(),
  body: z.object({
    title: z.string().min(1, 'title is required'),
    dueDate: z.string().datetime({ message: 'dueDate must be an ISO 8601 date string' }),
    studentId: z.string().uuid('Invalid studentId'),
    courseId: z.string().uuid('Invalid courseId'),
    status: statusEnum.optional(),
  }),
});

export const updateAssignmentSchema = z.object({
  query: z.object({}).optional(),
  params: z.object({
    id: z.string().uuid('Invalid assignment id'),
  }),
  body: z
    .object({
      title: z.string().min(1).optional(),
      dueDate: z.string().datetime().optional(),
      status: statusEnum.optional(),
      grade: z.number().min(0).max(100).optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: 'At least one field must be provided to update',
    }),
});
