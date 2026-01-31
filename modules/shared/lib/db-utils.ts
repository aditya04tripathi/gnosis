import type { FilterQuery, QueryOptions } from "mongoose";
import { cachedFetch } from "./cache";
import connectDB from "./db";

export interface PaginationOptions {
  page?: number;
  limit?: number;
  sort?: Record<string, 1 | -1>;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export async function paginatedQuery<T>(
  model: any,
  filter: FilterQuery<T> = {},
  options: PaginationOptions = {},
  projection?: Record<string, 1 | 0>,
): Promise<PaginatedResult<T>> {
  await connectDB();

  const page = Math.max(1, options.page || 1);
  const limit = Math.min(100, Math.max(1, options.limit || 10));
  const skip = (page - 1) * limit;
  const sort = options.sort || { createdAt: -1 };

  const [data, total] = await Promise.all([
    model
      .find(filter, projection)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean()
      .exec(),
    model.countDocuments(filter).exec(),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    data: data as T[],
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
}

export async function cachedQuery<T>(
  cacheKey: string,
  model: any,
  filter: FilterQuery<T>,
  options?: QueryOptions,
  ttl: number = 5 * 60 * 1000,
): Promise<T[]> {
  return cachedFetch(
    cacheKey,
    async () => {
      await connectDB();
      return model.find(filter, null, options).lean().exec();
    },
    ttl,
  );
}

export async function cachedFindOne<T>(
  cacheKey: string,
  model: any,
  filter: FilterQuery<T>,
  projection?: Record<string, 1 | 0>,
  ttl: number = 5 * 60 * 1000,
): Promise<T | null> {
  return cachedFetch(
    cacheKey,
    async () => {
      await connectDB();
      return model.findOne(filter, projection).lean().exec();
    },
    ttl,
  );
}

export async function batchFindByIds<T>(
  model: any,
  ids: string[],
  projection?: Record<string, 1 | 0>,
): Promise<T[]> {
  if (ids.length === 0) return [];

  await connectDB();
  return model
    .find({ _id: { $in: ids } }, projection)
    .lean()
    .exec();
}

export function buildCacheKey(
  prefix: string,
  ...parts: (string | number)[]
): string {
  return `${prefix}:${parts.join(":")}`;
}
