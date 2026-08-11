import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import * as assignmentsService from './assignments.service';

export const list = asyncHandler(async (req: Request, res: Response) => {
  const { items, meta } = await assignmentsService.listAssignments(req.query);
  res.status(200).json({ success: true, data: items, meta });
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const assignment = await assignmentsService.createAssignment(req.body);
  res.status(201).json({ success: true, message: 'Assignment created', data: assignment });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const assignment = await assignmentsService.updateAssignment(req.params.id, req.body);
  res.status(200).json({ success: true, message: 'Assignment updated', data: assignment });
});
