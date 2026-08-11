import { z } from 'zod';

export const listCoursesSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({}).optional(),
  query: z.object({
    page: z.string().regex(/^\d+$/).optional(),
    limit: z.string().regex(/^\d+$/).optional(),
    q: z.string().optional(),
  }),
});

export const getCourseSchema = z.object({
  body: z.object({}).optional(),
  query: z.object({}).optional(),
  params: z.object({
    id: z.string().uuid('Invalid course id'),
  }),
});

export const createCourseSchema = z.object({
  query: z.object({}).optional(),
  params: z.object({}).optional(),
  body: z.object({
    title: z.string().min(1, 'title is required'),
    description: z.string().optional(),
    credits: z.number().int().positive().optional(),
  }),
});
