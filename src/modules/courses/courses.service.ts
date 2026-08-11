import { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { AppError } from '../../utils/AppError';
import { buildMeta, parsePagination } from '../../utils/pagination';

export async function listCourses(query: Record<string, unknown>) {
  const pagination = parsePagination(query);
  const search = typeof query.q === 'string' && query.q.trim() ? query.q.trim() : undefined;

  const where: Prisma.CourseWhereInput = search
    ? { title: { contains: search, mode: 'insensitive' } }
    : {};

  const [items, total] = await Promise.all([
    prisma.course.findMany({
      where,
      skip: pagination.skip,
      take: pagination.limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.course.count({ where }),
  ]);

  return { items, meta: buildMeta(total, pagination) };
}

export async function getCourseById(id: string) {
  const course = await prisma.course.findUnique({
    where: { id },
    include: { assignments: true },
  });

  if (!course) {
    throw new AppError('Course not found', 404);
  }

  return course;
}

export async function createCourse(data: {
  title: string;
  description?: string;
  credits?: number;
}) {
  return prisma.course.create({ data });
}
