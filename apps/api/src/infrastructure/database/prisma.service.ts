import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { TenantContext } from '../../common/context/tenant-context';

const GLOBAL_MODELS = new Set([
  'Tenant',
  'Plan',
  'Suscripcion',
  'LineaComprobante',
  'ImpuestoLinea',
  'ImpuestoComprobante',
  'FormaPagoComprobante',
  'CampoAdicional',
  'LogEventoWebhook',
]);

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);
  private extendedClient: any;

  constructor() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL is not configured');
    }

    super({
      adapter: new PrismaPg({ connectionString }),
      log:
        process.env.NODE_ENV === 'development'
          ? [
              { emit: 'stdout', level: 'warn' },
              { emit: 'stdout', level: 'error' },
            ]
          : [{ emit: 'stdout', level: 'error' }],
    });

    const self = this;

    // Crear cliente extendido con tenant scoping automático
    this.extendedClient = this.$extends({
      query: {
        $allModels: {
          async $allOperations({ model, operation, args, query }) {
            const tenantId = TenantContext.getTenantId();
            const bypassRls = TenantContext.isBypassRls();

            // Si se salta RLS, no hay tenantId o el modelo es global, ejecutar directo
            if (bypassRls || !tenantId || GLOBAL_MODELS.has(model)) {
              if (tenantId && !GLOBAL_MODELS.has(model)) {
                await self.$executeRawUnsafe(
                  `SELECT set_config('app.current_tenant_id', '${tenantId}', true);`
                ).catch(() => {});
              }
              return query(args);
            }

            // Configurar la variable de sesión RLS en PostgreSQL
            await self.$executeRawUnsafe(
              `SELECT set_config('app.current_tenant_id', '${tenantId}', true);`
            ).catch(() => {});

            // Inicializar argumentos
            args = args || {};
            const requiereWhere = !['create', 'createMany'].includes(operation);
            if (requiereWhere) {
              (args as any).where = (args as any).where || {};
            }

            // Desestructurar claves únicas compuestas en 'where' para hacerlas compatibles con findFirst y filtros planos
            if ((args as any).where) {
              const whereObj = (args as any).where;
              for (const key of Object.keys(whereObj)) {
                const val = whereObj[key];
                if (
                  val &&
                  typeof val === 'object' &&
                  !Array.isArray(val) &&
                  !(
                    'equals' in val ||
                    'in' in val ||
                    'not' in val ||
                    'contains' in val ||
                    'startsWith' in val ||
                    'endsWith' in val ||
                    'lt' in val ||
                    'lte' in val ||
                    'gt' in val ||
                    'gte' in val
                  )
                ) {
                  Object.assign(whereObj, val);
                  delete whereObj[key];
                }
              }
            }

            // 1. Consultas findUnique -> se transforman a findFirst
            if (operation === 'findUnique' || operation === 'findUniqueOrThrow') {
              const newOperation = operation === 'findUnique' ? 'findFirst' : 'findFirstOrThrow';
              (args as any).where = { ...(args as any).where, tenant_id: tenantId };
              return (self.extendedClient as any)[model][newOperation](args);
            }

            // 2. Lecturas (findMany, findFirst, etc.)
            if ([
              'findMany',
              'findFirst',
              'findFirstOrThrow',
              'count',
              'aggregate',
              'groupBy'
            ].includes(operation)) {
              (args as any).where = { ...(args as any).where, tenant_id: tenantId };
            }

            // 3. Escrituras (create, createMany)
            if (operation === 'create') {
              (args as any).data = { ...(args as any).data, tenant_id: tenantId };
            } else if (operation === 'createMany') {
              if (Array.isArray((args as any).data)) {
                (args as any).data = (args as any).data.map((item: any) => ({
                  ...item,
                  tenant_id: tenantId,
                }));
              } else if ((args as any).data) {
                (args as any).data = { ...(args as any).data, tenant_id: tenantId };
              }
            }

            // 4. Actualizaciones y Eliminaciones
            if ([
              'update',
              'updateMany',
              'delete',
              'deleteMany'
            ].includes(operation)) {
              (args as any).where = { ...(args as any).where, tenant_id: tenantId };
            }

            return query(args);
          },
        },
      },
    });

    // Retornar proxy para delegar al cliente extendido manteniendo tipos e inyección
    return new Proxy(this, {
      get(target, prop, receiver) {
        if (Reflect.has(target.extendedClient, prop)) {
          const value = Reflect.get(target.extendedClient, prop, receiver);
          if (typeof value === 'function') {
            return value.bind(target.extendedClient);
          }
          return value;
        }
        const value = Reflect.get(target, prop, receiver);
        if (typeof value === 'function') {
          return value.bind(target);
        }
        return value;
      },
    });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
    this.logger.log('Database connection established');
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
    this.logger.log('Database connection closed');
  }
}
