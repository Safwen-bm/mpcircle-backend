import { NextFunction, Request, Response } from 'express';
import { AnyZodObject, ZodError } from 'zod';

/**
 * Validates req.body / req.query / req.params against a zod schema.
 * Usage: router.post('/', validate(createStudentSchema), controller.create)
 *
 * Schema shape: z.object({ body: z.object({...}), query: z.object({...}), params: z.object({...}) })
 * Any of body/query/params can be omitted if not needed.
 */
export const validate =
  (schema: AnyZodObject) => (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      if (parsed.body) req.body = parsed.body;
      if (parsed.params) req.params = parsed.params;
      // note: req.query is left as-is (Express 5 makes it read-only); validated query
      // values are available on req.validatedQuery for controllers that need them.
      (req as Request & { validatedQuery?: unknown }).validatedQuery = parsed.query;
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        return res.status(422).json({
          success: false,
          message: 'Validation failed',
          errors: err.errors.map((e) => ({
            path: e.path.join('.'),
            message: e.message,
          })),
        });
      }
      next(err);
    }
  };
