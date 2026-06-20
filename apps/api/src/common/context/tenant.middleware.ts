import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { TenantContext, TenantContextStore } from './tenant-context';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;
    const store: TenantContextStore = {
      bypassRls: false,
    };

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const payloadPart = token.split('.')[1];
        if (payloadPart) {
          // Decodificar Base64Url de forma segura
          const base64 = payloadPart.replace(/-/g, '+').replace(/_/g, '/');
          const decodedPayload = Buffer.from(base64, 'base64').toString('utf8');
          const payload = JSON.parse(decodedPayload);

          if (payload) {
            store.tenantId = payload.tenant_id || undefined;
            store.userId = payload.sub || undefined;
            store.role = payload.rol || undefined;

            // Si el rol es SUPERADMIN, saltamos RLS
            if (payload.rol === 'SUPERADMIN') {
              store.bypassRls = true;
            }
          }
        }
      } catch (error) {
        // Ignorar errores de parseo, el JwtGuard manejará la validación formal de firma
      }
    }

    // Ejecutar la solicitud dentro de la zona aislada del AsyncLocalStorage
    TenantContext.run(store, () => {
      next();
    });
  }
}
