import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import type { Request } from 'express';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

/**
 * Tamper-evident audit logging of privileged actions (who, what, when, from where).
 * MOCK: writes structured logs. In prod this appends to an append-only/WORM store
 * reviewable by the Privacy Officer, with hash chaining for tamper evidence.
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger('Audit');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<Request & { principal?: { subjectId?: string } }>();
    const started = Date.now();
    return next.handle().pipe(
      tap(() => {
        this.logger.log(
          JSON.stringify({
            who: req.principal?.subjectId ?? 'anonymous',
            action: `${req.method} ${req.originalUrl}`,
            ip: req.ip,
            at: new Date().toISOString(),
            ms: Date.now() - started,
          }),
        );
      }),
    );
  }
}
