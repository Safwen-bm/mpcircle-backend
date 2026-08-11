import { buildMeta, parsePagination } from '../src/utils/pagination';

describe('parsePagination', () => {
  it('defaults to page 1, limit 10', () => {
    expect(parsePagination({})).toEqual({ page: 1, limit: 10, skip: 0 });
  });

  it('parses valid page/limit from query strings', () => {
    expect(parsePagination({ page: '3', limit: '5' })).toEqual({
      page: 3,
      limit: 5,
      skip: 10,
    });
  });

  it('clamps limit to a max of 100', () => {
    expect(parsePagination({ limit: '500' }).limit).toBe(100);
  });

  it('falls back to 1 for invalid/negative page values', () => {
    expect(parsePagination({ page: '-5' }).page).toBe(1);
    expect(parsePagination({ page: 'abc' }).page).toBe(1);
  });
});

describe('buildMeta', () => {
  it('computes totalPages correctly', () => {
    const meta = buildMeta(25, { page: 1, limit: 10, skip: 0 });
    expect(meta).toEqual({ total: 25, page: 1, limit: 10, totalPages: 3 });
  });

  it('returns at least 1 totalPage when total is 0', () => {
    const meta = buildMeta(0, { page: 1, limit: 10, skip: 0 });
    expect(meta.totalPages).toBe(1);
  });
});
