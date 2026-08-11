import { z } from 'zod';

export const listStudentsSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({}).optional(),
  query: z.object({
    page: z.string().regex(/^\d+$/).optional(),
    limit: z.string().regex(/^\d+$/).optional(),
    q: z.string().optional(), // search by name/email
  }),
});

export const getStudentSchema = z.object({
  body: z.object({}).optional(),
  query: z.object({}).optional(),
  params: z.object({
    id: z.string().uuid('Invalid student id'),
  }),
});

export const createStudentSchema = z.object({
  query: z.object({}).optional(),
  params: z.object({}).optional(),
  body: z.object({
    firstName: z.string().min(1, 'firstName is required'),
    lastName: z.string().min(1, 'lastName is required'),
    email: z.string().email('A valid email is required'),
  }),
});

export const updateStudentSchema = z.object({
  query: z.object({}).optional(),
  params: z.object({
    id: z.string().uuid('Invalid student id'),
  }),
  body: z
    .object({
      firstName: z.string().min(1).optional(),
      lastName: z.string().min(1).optional(),
      email: z.string().email().optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: 'At least one field must be provided to update',
    }),
});

export const deleteStudentSchema = getStudentSchema;
