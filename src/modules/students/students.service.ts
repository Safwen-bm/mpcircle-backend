import { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { AppError } from '../../utils/AppError';
import { buildMeta, parsePagination } from '../../utils/pagination';

export async function listStudents(query: Record<string, unknown>) {
  const pagination = parsePagination(query);
  const search = typeof query.q === 'string' && query.q.trim() ? query.q.trim() : undefined;

  const where: Prisma.StudentWhereInput = search
    ? {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      }
    : {};

  const [items, total] = await Promise.all([
    prisma.student.findMany({
      where,
      skip: pagination.skip,
      take: pagination.limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.student.count({ where }),
  ]);

  return { items, meta: buildMeta(total, pagination) };
}

export async function getStudentById(id: string) {
  const student = await prisma.student.findUnique({
    where: { id },
    include: { assignments: true },
  });

  if (!student) {
    throw new AppError('Student not found', 404);
  }

  return student;
}

function isUniqueConstraintError(err: unknown): boolean {
  return typeof err === 'object' && err !== null && (err as { code?: string }).code === 'P2002';
}

export async function createStudent(data: {
  firstName: string;
  lastName: string;
  email: string;
}) {
  try {
    return await prisma.student.create({ data });
  } catch (err) {
    if (isUniqueConstraintError(err)) {
      throw new AppError('A student with this email already exists', 409);
    }
    throw err;
  }
}

export async function updateStudent(
  id: string,
  data: Partial<{ firstName: string; lastName: string; email: string }>,
) {
  await getStudentById(id); // 404 if missing

  try {
    return await prisma.student.update({ where: { id }, data });
  } catch (err) {
    if (isUniqueConstraintError(err)) {
      throw new AppError('A student with this email already exists', 409);
    }
    throw err;
  }
}

export async function deleteStudent(id: string) {
  await getStudentById(id); // 404 if missing
  await prisma.student.delete({ where: { id } });
}
