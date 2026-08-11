import { AssignmentStatus, Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { AppError } from '../../utils/AppError';
import { buildMeta, parsePagination } from '../../utils/pagination';

export async function listAssignments(query: Record<string, unknown>) {
  const pagination = parsePagination(query);
  const search = typeof query.q === 'string' && query.q.trim() ? query.q.trim() : undefined;

  const where: Prisma.AssignmentWhereInput = {
    ...(search ? { title: { contains: search, mode: 'insensitive' } } : {}),
    ...(query.status ? { status: query.status as AssignmentStatus } : {}),
    ...(query.studentId ? { studentId: String(query.studentId) } : {}),
    ...(query.courseId ? { courseId: String(query.courseId) } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.assignment.findMany({
      where,
      skip: pagination.skip,
      take: pagination.limit,
      orderBy: { dueDate: 'asc' },
      include: { student: true, course: true },
    }),
    prisma.assignment.count({ where }),
  ]);

  return { items, meta: buildMeta(total, pagination) };
}

export async function getAssignmentById(id: string) {
  const assignment = await prisma.assignment.findUnique({
    where: { id },
    include: { student: true, course: true },
  });

  if (!assignment) {
    throw new AppError('Assignment not found', 404);
  }

  return assignment;
}

export async function createAssignment(data: {
  title: string;
  dueDate: string;
  studentId: string;
  courseId: string;
  status?: AssignmentStatus;
}) {
  const [student, course] = await Promise.all([
    prisma.student.findUnique({ where: { id: data.studentId } }),
    prisma.course.findUnique({ where: { id: data.courseId } }),
  ]);

  if (!student) throw new AppError('Student not found', 404);
  if (!course) throw new AppError('Course not found', 404);

  return prisma.assignment.create({
    data: {
      title: data.title,
      dueDate: new Date(data.dueDate),
      studentId: data.studentId,
      courseId: data.courseId,
      status: data.status,
    },
  });
}

export async function updateAssignment(
  id: string,
  data: Partial<{ title: string; dueDate: string; status: AssignmentStatus; grade: number }>,
) {
  await getAssignmentById(id); // 404 if missing

  return prisma.assignment.update({
    where: { id },
    data: {
      ...data,
      ...(data.dueDate ? { dueDate: new Date(data.dueDate) } : {}),
    },
  });
}
