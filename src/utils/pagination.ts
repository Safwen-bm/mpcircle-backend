export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

export function parsePagination(query: Record<string, unknown>): PaginationParams {
  const page = Math.max(parseInt(String(query.page ?? '1'), 10) || 1, 1);
  const limitRaw = parseInt(String(query.limit ?? '10'), 10) || 10;
  const limit = Math.min(Math.max(limitRaw, 1), 100); // cap page size at 100
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

export function buildMeta(total: number, { page, limit }: PaginationParams) {
  return {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
  };
}
