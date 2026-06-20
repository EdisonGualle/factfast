# Plan Maestro Mejorado — Monorepo SaaS ERP/POS Facturación Ecuador

Este plan maestro define la arquitectura y el diseño técnico detallado para la construcción del MVP de **FactFast** (Fases 1–4), integrando las mejores prácticas para multi-tenancy, backend modular y frontend reactivo.

---

## Decisiones Clave e Integración de Skills

### 1. Multi-Tenancy y Aislamiento de Datos
*   **Modelo de Tenencia:** Base de datos compartida con esquema compartido. La columna `tenant_id` (UUID) se incluye en todas las tablas de ámbito tenant.
*   **Row-Level Security (RLS) en PostgreSQL:** Activado como salvaguarda en la base de datos para todas las tablas dependientes de un tenant. Todas las consultas se filtrarán utilizando `current_setting('app.current_tenant_id')`.
*   **Automatización con Prisma:** Se implementará una extensión/middleware de Prisma a nivel de consulta en NestJS que inyectará automáticamente el filtro `tenant_id` en lecturas, actualizaciones y eliminaciones, y asignará el `tenant_id` en las inserciones, evitando errores por filtros manuales.

### 2. Arquitectura de NestJS (Backend)
*   **Validación Global:** Uso de `ValidationPipe` global con `whitelist: true`, `forbidNonWhitelisted: true` y `transform: true`.
*   **Controladores delgados (Thin Controllers):** Los controladores únicamente validarán DTOs y delegarán toda la lógica de negocio a servicios inyectables.
*   **Contexto de Solicitud:** El `tenant_id` se extraerá del token JWT decodificado en cada solicitud y se propagará automáticamente al contexto de ejecución de base de datos dentro del ciclo de vida de la transacción.

### 3. Frontend Next.js 16 + HeroUI v3
*   **Compilador Dev:** Se usará **Turbopack** por defecto para HMR ultra rápido y caché persistente.
*   **Middleware:** Nombrado **`proxy.ts`** en la raíz del frontend (`apps/web/src/proxy.ts`) siguiendo las directrices de Next.js 16+.
*   **HeroUI v3:**
    *   **Sin Proveedor:** No se utilizará `<HeroUIProvider>` en la raíz (patrón v3).
    *   **Componentes Compuestos:** Uso estricto de notación de puntos (ej: `<Card.Header>`, `<Card.Title>`).
    *   **Estilos:** TailwindCSS v4 + `@heroui/styles` importados secuencialmente en `globals.css`.
    *   **Eventos:** Uso de `onPress` en lugar de `onClick` en componentes HeroUI para accesibilidad avanzada.
*   **TanStack Query v5 + Zustand:**
    *   Abstracción de fetches en hooks personalizados.
    *   Fábrica de claves de consultas (`Query Key Factories`) estructurada para evitar colisiones y organizar invalidaciones.
    *   Pre-fetching e hidratación en Server Components mediante `<HydrationBoundary state={dehydrate(queryClient)}>`.
    *   Zustand para sincronizar el estado del contexto de sesión (Tenant, Empresa, Sucursal, Caja y Bodega activa).

---

## Arquitectura del Monorepo

```text
factfast/
├── pnpm-workspace.yaml
├── package.json
├── turbo.json
│
├── apps/
│   ├── api/                         ← NestJS Backend
│   │   ├── src/
│   │   │   ├── common/              ← Interceptores, Guards, Filters, Decorators
│   │   │   ├── config/              ← Configuración tipada y validación de env
│   │   │   ├── infrastructure/      ← Database, Mailer, Colas (BullMQ)
│   │   │   └── modules/             ← Módulos del dominio (Auth, Empresas, etc.)
│   │   └── prisma/                  ← Esquema y migraciones
│   │
│   └── web/                         ← Next.js 16 Frontend (Turbopack)
│       ├── src/
│       │   ├── app/                 ← App Router (auth, onboarding, dashboard)
│       │   ├── lib/                 ← Clientes (axios, queryClient)
│       │   ├── store/               ← Zustand stores (app-context)
│       │   └── proxy.ts             ← Middleware oficial de Next.js 16+
│       └── postcss.config.mjs
│
└── packages/
    └── shared/                      ← Biblioteca Compartida
        ├── src/
        │   ├── types/               ← Interfaces y contratos
        │   ├── schemas/             ← Esquemas Zod para formularios y validación
        │   └── constants/           ← Códigos SRI y límites de planes
        └── package.json
```

---

## Proposed Changes

### 1. Modelado de Base de Datos y Aislamiento de Tenants

#### [MODIFY] [schema.prisma](file:///c:/Users/PC/Desktop/factfast/apps/api/prisma/schema.prisma)
Garantizar la columna `tenant_id` UUID en las tablas relativas al inquilino y crear los índices correspondientes.
*   Tablas globales (sin `tenant_id`): `Tenant`, `Plan`, `Suscripcion`.
*   Tablas scoped (con `tenant_id`): `Empresa`, `Usuario`, `Caja`, `Bodega`, `Cliente`, `Proveedor`, `Producto`, `Categoria`, `Comprobante`, `ApiKey`.
*   Añadir índices compuestos de tipo `@@index([tenant_id, ...])` para consultas eficientes con aislamiento RLS.

#### [NEW] Migración de RLS para PostgreSQL
Crear scripts de migración para activar Row-Level Security en PostgreSQL:
```sql
-- Habilitar RLS
ALTER TABLE empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE empresas FORCE ROW LEVEL SECURITY;

-- Crear políticas basadas en el contexto de transacción
CREATE POLICY tenant_isolation ON empresas
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);
```

---

### 2. Implementación de Módulos NestJS (Backend)

#### [NEW] Extensión Prisma para Scoping Automático de Tenants
Crear un proveedor o servicio que extienda el cliente Prisma para interceptar operaciones de lectura y escritura:
*   Inyectar automáticamente `where: { tenant_id: currentTenantId }` en operaciones `findMany`, `findFirst`, `update`, `delete`.
*   Inyectar `data: { tenant_id: currentTenantId }` en operaciones `create` y `createMany`.

#### [NEW] Modulo de Tenants (`apps/api/src/modules/tenant/`)
*   Servicios de creación de tenant, registro del slug y asignación del plan por defecto.

#### [NEW] Módulo de Cajas y POS (`apps/api/src/modules/cajas/` / `pos/`)
*   Estructura de cajas y sesiones físicas. Guard `CajaAbiertaGuard` para validar transacciones del POS rápido.

#### [NEW] Módulos de Catálogos e Inventario (`apps/api/src/modules/clientes/` / `productos/` / `bodegas/`)
*   Implementación de CRUDs usando DTOs tipados.
*   Gestión de movimientos de inventario y stocks por bodega.

---

### 3. Implementación del Frontend (Next.js 16 + HeroUI v3)

#### [NEW] Configuración CSS con TailwindCSS v4 y PostCSS
Actualizar `app/globals.css` importando TailwindCSS v4 y las directivas de HeroUI:
```css
@import "tailwindcss";
@import "@heroui/styles";
```

#### [NEW] Middleware de Rutas (`apps/web/src/proxy.ts`)
*   Implementación de `proxy.ts` para interceptar rutas, verificar el JWT del usuario en las páginas del dashboard y realizar redirecciones si no existe sesión.

#### [NEW] Client Boundaries y TanStack Query Hydration
Implementar el pre-fetching desde el servidor y posterior hidratación en el cliente para agilizar la carga del Dashboard y Catálogos:
*   Uso de fábrica de query keys para gestionar el cache:
    ```typescript
    export const empresaKeys = {
      all: ['empresas'] as const,
      lists: () => [...empresaKeys.all, 'list'] as const,
      detail: (id: string) => [...empresaKeys.all, 'detail', id] as const,
    };
    ```

#### [NEW] Vistas del MVP
*   **`(auth)/login` y `(auth)/registro`:** Formularios con validación Zod y conexión mediante mutations de TanStack Query.
*   **`onboarding/`:** Flujo guiado de configuración de RUC, firma digital, secuenciales de comprobantes, cajas y bodegas.
*   **`(dashboard)/pos/venta`:** POS rápido optimizado para uso sin ratón utilizando atajos de teclado y selección rápida de productos.

---

## Plan de Verificación

### Pruebas Automatizadas
*   Ejecución de build en paralelo con Turborepo:
    ```bash
    pnpm build
    ```
*   Compilación individual de la API y el Frontend:
    ```bash
    pnpm --filter @factfast/api run build
    pnpm --filter @factfast/web run build
    ```

### Pruebas Manuales
1.  **Aislamiento Multi-Tenant:** Crear 3 tenants diferentes y validar en la base de datos que las consultas de un tenant nunca devuelvan registros de los otros tenants, confirmando que las políticas de RLS e interceptores de Prisma están activos.
2.  **Operación del POS:** Validar la apertura de caja, venta rápida de un producto y descuento correcto de stock en la bodega seleccionada.
3.  **Configuración SRI:** Carga de certificado digital `.p12` y firma exitosa de un XML de pruebas.
