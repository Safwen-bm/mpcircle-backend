import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import * as studentsService from './students.service';

export const list = asyncHandler(async (req: Request, res: Response) => {
  const { items, meta } = await studentsService.listStudents(req.query);
  res.status(200).json({ success: true, data: items, meta });
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const student = await studentsService.getStudentById(req.params.id);
  res.status(200).json({ success: true, data: student });
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const student = await studentsService.createStudent(req.body);
  res.status(201).json({ success: true, message: 'Student created', data: student });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const student = await studentsService.updateStudent(req.params.id, req.body);
  res.status(200).json({ success: true, message: 'Student updated', data: student });
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await studentsService.deleteStudent(req.params.id);
  res.status(200).json({ success: true, message: 'Student deleted' });
});
