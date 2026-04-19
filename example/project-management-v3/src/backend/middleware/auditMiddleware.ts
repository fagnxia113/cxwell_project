import { Request, Response, NextFunction } from 'express';
import { container } from 'tsyringe';
import { AuditService, AuditAction } from '../services/AuditService.js';
import { logger } from '../utils/logger.js';

export interface AuditOptions {
  entityType: string;
  action: AuditAction;
  getEntityId?: (req: Request) => string | undefined;
  getNewValue?: (req: Request, res: Response) => Record<string, any>;
  skipPaths?: string[];
}

export function createAuditMiddleware(options: AuditOptions) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const originalSend = res.send;
    const startTime = Date.now();
    
    const auditService = container.resolve(AuditService);

    res.send = function(body: any) {
      const statusCode = res.statusCode;
      const isSuccess = statusCode >= 200 && statusCode < 400;
      
      if (isSuccess && req.method !== 'GET') {
        const entityId = options.getEntityId 
          ? options.getEntityId(req) 
          : req.params.id || req.body.id;

        if (entityId) {
          const operator = (req as any).user || (req as any).userInfo;
          
          let newValue: Record<string, any> | undefined;
          if (options.getNewValue) {
            newValue = options.getNewValue(req, res);
          } else if (req.body) {
            newValue = req.body;
          }

          auditService.log({
            entityType: options.entityType,
            entityId,
            action: options.action,
            operatorId: operator?.id,
            operatorName: operator?.name,
            newValue: newValue ? sanitizeSensitiveData(newValue) : undefined,
            ipAddress: req.ip || req.connection.remoteAddress,
            userAgent: req.headers['user-agent'],
            requestId: (req as any).id || (req as any).requestId
          }).catch(err => {
            logger.error('Audit middleware error:', err);
          });
        }
      }

      return originalSend.call(this, body);
    };

    next();
  };
}

function sanitizeSensitiveData(data: Record<string, any>): Record<string, any> {
  const sensitiveFields = ['password', 'token', 'secret', 'apiKey', 'creditCard', 'ssn'];
  const sanitized = { ...data };
  
  for (const field of sensitiveFields) {
    if (sanitized[field]) {
      sanitized[field] = '***REDACTED***';
    }
  }
  
  return sanitized;
}

export const equipmentAuditMiddleware = createAuditMiddleware({
  entityType: 'Equipment',
  action: 'update',
  getEntityId: (req) => req.params.id as string,
  skipPaths: ['/health', '/metrics']
});

export const projectAuditMiddleware = createAuditMiddleware({
  entityType: 'Project',
  action: 'update',
  getEntityId: (req) => req.params.id as string
});
