import { z } from 'zod';
import { Request, Response, NextFunction, RequestHandler } from 'express';
import { logger } from '../utils/logger.js';

export function createZodValidator<T extends z.ZodTypeAny>(schema: T, source: 'body' | 'query' | 'params' = 'body'): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const target = source === 'body' ? req.body : source === 'query' ? req.query : req.params;
      const parsed = schema.parse(target);
      
      if (source === 'body') {
        (req as any).body = parsed;
      } else if (source === 'query') {
        (req as any).query = parsed;
      } else {
        (req as any).params = parsed;
      }
      
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.issues.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        
        logger.warn('Zod validation failed:', { 
          path: req.path, 
          method: req.method,
          errors 
        });
        
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

export function validateBody<T extends z.ZodTypeAny>(schema: T) {
  return createZodValidator(schema, 'body');
}

export function validateQuery<T extends z.ZodTypeAny>(schema: T) {
  return createZodValidator(schema, 'query');
}

export function validateParams<T extends z.ZodTypeAny>(schema: T) {
  return createZodValidator(schema, 'params');
}

export function validateBodyOptional<T extends z.ZodTypeAny>(schema: T) {
  const optionalSchema = schema.optional();
  return createZodValidator(optionalSchema, 'body');
}
