import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import * as coursesService from './courses.service';

export const list = asyncHandler(async (req: Request, res: Response) => {
  const { items, meta } = await coursesService.listCourses(req.query);
  res.status(200).json({ success: true, data: items, meta });
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const course = await coursesService.getCourseById(req.params.id);
  res.status(200).json({ success: true, data: course });
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const course = await coursesService.createCourse(req.body);
  res.status(201).json({ success: true, message: 'Course created', data: course });
});
