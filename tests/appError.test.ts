import { AppError } from '../src/utils/AppError';

describe('AppError', () => {
  it('defaults to a 400 status code', () => {
    const err = new AppError('bad request');
    expect(err.statusCode).toBe(400);
    expect(err.message).toBe('bad request');
    expect(err.isOperational).toBe(true);
  });

  it('accepts a custom status code', () => {
    const err = new AppError('not found', 404);
    expect(err.statusCode).toBe(404);
  });
});
