import { z, ZodError } from 'zod';
import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';

export const zodValidators = {
  id: z.string().uuid({ message: 'ID 必须是有效的 UUID' }),

  uuid: (message: string = 'ID 必须是有效的 UUID') => z.string().uuid({ message }),

  string: (params?: {
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    message?: string;
  }) => {
    let schema = z.string();
    if (params?.minLength) schema = schema.min(params.minLength);
    if (params?.maxLength) schema = schema.max(params.maxLength);
    if (params?.pattern) schema = schema.regex(params.pattern);
    return params?.message ? schema : schema;
  },

  number: (params?: {
    min?: number;
    max?: number;
    integer?: boolean;
  }) => {
    let schema = z.number();
    if (params?.min !== undefined) schema = schema.min(params.min);
    if (params?.max !== undefined) schema = schema.max(params.max);
    if (params?.integer) schema = schema.int();
    return schema;
  },

  enum: <T extends readonly string[]>(enumValues: T, message?: string) => 
    z.enum(enumValues, { message }),

  email: z.string().email({ message: '邮箱格式不正确' }),

  optionalEmail: z.string().email({ message: '邮箱格式不正确' }).optional().or(z.literal('')),

  page: z.coerce.number().int().positive().default(1),

  pageSize: z.coerce.number().int().positive().max(1000).default(20),

  dateString: z.string().datetime({ message: '日期格式不正确' }),

  optionalDateString: z.string().datetime({ message: '日期格式不正确' }).optional(),

  boolean: z.coerce.boolean(),

  array: <T extends z.ZodTypeAny>(schema: T) => z.array(schema),

  object: <T extends z.ZodTypeAny>(schema: T) => z.object(schema),
};

export interface ValidationSchemas {
  body?: z.ZodType<any>;
  query?: z.ZodType<any>;
  params?: z.ZodType<any>;
}

export function validate(schemas: ValidationSchemas) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (schemas.params) {
        schemas.params.parse(req.params);
      }
      if (schemas.query) {
        schemas.query.parse(req.query);
      }
      if (schemas.body) {
        req.body = schemas.body.parse(req.body);
      }
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.issues.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        logger.warn('Zod validation failed:', { errors });
        return res.status(400).json({
          success: false,
          message: '请求参数验证失败',
          errors,
        });
      }
      next(error);
    }
  };
}

export function validateBody<T extends z.ZodType<any>>(schema: T) {
  return validate({ body: schema });
}

export function validateQuery<T extends z.ZodType<any>>(schema: T) {
  return validate({ query: schema });
}

export function validateParams<T extends z.ZodType<any>>(schema: T) {
  return validate({ params: schema });
}

export const commonSchemas = {
  idParam: z.object({
    id: zodValidators.id,
  }),

  paginationQuery: z.object({
    page: zodValidators.page,
    pageSize: zodValidators.pageSize,
  }),

  paginationSortQuery: z.object({
    page: zodValidators.page,
    pageSize: zodValidators.pageSize,
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
  }),
};
