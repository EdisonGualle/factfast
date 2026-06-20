-- CreateEnum
CREATE TYPE "RolUsuario" AS ENUM ('SUPERADMIN', 'OWNER_TENANT', 'ADMIN_EMPRESA', 'CAJERO', 'BODEGUERO', 'CONTADOR', 'AUDITOR');

-- CreateEnum
CREATE TYPE "RegimenTributario" AS ENUM ('GENERAL', 'RIMPE_EMPRENDEDOR', 'RIMPE_NEGOCIO_POPULAR', 'AGENTE_RETENCION');

-- CreateEnum
CREATE TYPE "TipoComprobante" AS ENUM ('FACTURA', 'LIQUIDACION_COMPRA', 'NOTA_CREDITO', 'NOTA_DEBITO', 'GUIA_REMISION', 'RETENCION');

-- CreateEnum
CREATE TYPE "EstadoComprobante" AS ENUM ('BORRADOR', 'FIRMADO', 'ENVIADO', 'AUTORIZADO', 'FALLIDO', 'ANULADO');

-- CreateEnum
CREATE TYPE "AmbienteSRI" AS ENUM ('PRUEBAS', 'PRODUCCION');

-- CreateEnum
CREATE TYPE "TipoImpuesto" AS ENUM ('IVA', 'ICE', 'IRBPNR', 'RETENCION_FUENTE', 'RETENCION_IVA');

-- CreateEnum
CREATE TYPE "EstadoSuscripcion" AS ENUM ('TRIAL', 'ACTIVA', 'SUSPENDIDA', 'CANCELADA', 'VENCIDA');

-- CreateEnum
CREATE TYPE "TipoProducto" AS ENUM ('PRODUCTO', 'SERVICIO', 'COMBO');

-- CreateEnum
CREATE TYPE "TipoMovimientoInventario" AS ENUM ('ENTRADA_COMPRA', 'SALIDA_VENTA', 'AJUSTE_POSITIVO', 'AJUSTE_NEGATIVO', 'TRANSFERENCIA_SALIDA', 'TRANSFERENCIA_ENTRADA', 'DEVOLUCION_CLIENTE');

-- CreateTable
CREATE TABLE "tenants" (
    "id" UUID NOT NULL,
    "nombre" VARCHAR(200) NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "planes" (
    "id" UUID NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "slug" VARCHAR(50) NOT NULL,
    "descripcion" TEXT,
    "precio_mensual" DECIMAL(10,2) NOT NULL,
    "max_empresas" INTEGER NOT NULL,
    "max_sucursales" INTEGER NOT NULL,
    "max_cajas" INTEGER NOT NULL,
    "max_usuarios" INTEGER NOT NULL,
    "max_comprobantes_mes" INTEGER NOT NULL,
    "max_productos" INTEGER NOT NULL,
    "max_bodegas" INTEGER NOT NULL,
    "incluye_api" BOOLEAN NOT NULL DEFAULT false,
    "incluye_webhooks" BOOLEAN NOT NULL DEFAULT false,
    "incluye_lotes" BOOLEAN NOT NULL DEFAULT false,
    "incluye_reportes_avanzados" BOOLEAN NOT NULL DEFAULT false,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "planes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "suscripciones" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "plan_id" UUID NOT NULL,
    "estado" "EstadoSuscripcion" NOT NULL DEFAULT 'TRIAL',
    "fecha_inicio" TIMESTAMP(3) NOT NULL,
    "fecha_fin" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "suscripciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "empresas" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "ruc" VARCHAR(13) NOT NULL,
    "razon_social" VARCHAR(300) NOT NULL,
    "nombre_comercial" VARCHAR(300),
    "regimen_tributario" "RegimenTributario" NOT NULL DEFAULT 'GENERAL',
    "ambiente_sri" "AmbienteSRI" NOT NULL DEFAULT 'PRUEBAS',
    "direccion_matriz" VARCHAR(300),
    "telefono" VARCHAR(20),
    "correo" VARCHAR(150),
    "url_logo" VARCHAR(500),
    "numero_resolucion" VARCHAR(13),
    "resolucion_agente_retencion" VARCHAR(8),
    "sri_usuario" VARCHAR(13),
    "sri_contrasena_encriptada" VARCHAR(500),
    "obligado_contabilidad" BOOLEAN NOT NULL DEFAULT false,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "empresas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sucursales" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "empresa_id" UUID NOT NULL,
    "codigo" VARCHAR(3) NOT NULL,
    "nombre" VARCHAR(200) NOT NULL,
    "direccion" VARCHAR(300) NOT NULL,
    "ciudad" VARCHAR(100),
    "telefono" VARCHAR(20),
    "es_matriz" BOOLEAN NOT NULL DEFAULT false,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "sucursales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "puntos_emision" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "sucursal_id" UUID NOT NULL,
    "codigo" VARCHAR(3) NOT NULL,
    "nombre" VARCHAR(200) NOT NULL,
    "secuencia_factura" INTEGER NOT NULL DEFAULT 1,
    "secuencia_liquidacion" INTEGER NOT NULL DEFAULT 1,
    "secuencia_nota_credito" INTEGER NOT NULL DEFAULT 1,
    "secuencia_nota_debito" INTEGER NOT NULL DEFAULT 1,
    "secuencia_guia_remision" INTEGER NOT NULL DEFAULT 1,
    "secuencia_retencion" INTEGER NOT NULL DEFAULT 1,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "puntos_emision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cajas" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "sucursal_id" UUID NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "cajas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sesiones_caja" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "caja_id" UUID NOT NULL,
    "usuario_id" UUID NOT NULL,
    "monto_apertura" DECIMAL(14,2) NOT NULL,
    "monto_cierre" DECIMAL(14,2),
    "total_ventas" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "total_efectivo" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "total_tarjeta" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "observacion" TEXT,
    "abierta_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cerrada_en" TIMESTAMP(3),

    CONSTRAINT "sesiones_caja_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bodegas" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "sucursal_id" UUID NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "bodegas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_productos" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "producto_id" UUID NOT NULL,
    "bodega_id" UUID NOT NULL,
    "cantidad" DECIMAL(14,4) NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stock_productos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movimientos_inventario" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "producto_id" UUID NOT NULL,
    "bodega_id" UUID NOT NULL,
    "tipo" "TipoMovimientoInventario" NOT NULL,
    "cantidad" DECIMAL(14,4) NOT NULL,
    "saldo" DECIMAL(14,4) NOT NULL,
    "costo" DECIMAL(14,6),
    "referencia" VARCHAR(100),
    "nota" VARCHAR(300),
    "usuario_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "movimientos_inventario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clientes" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "empresa_id" UUID NOT NULL,
    "tipo_identificacion" VARCHAR(2) NOT NULL,
    "identificacion" VARCHAR(20) NOT NULL,
    "razon_social" VARCHAR(300) NOT NULL,
    "nombre_comercial" VARCHAR(300),
    "correo" VARCHAR(150),
    "telefono" VARCHAR(20),
    "direccion" VARCHAR(300),
    "ciudad" VARCHAR(100),
    "es_consumidor_final" BOOLEAN NOT NULL DEFAULT false,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "clientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proveedores" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "empresa_id" UUID NOT NULL,
    "tipo_identificacion" VARCHAR(2) NOT NULL,
    "identificacion" VARCHAR(20) NOT NULL,
    "razon_social" VARCHAR(300) NOT NULL,
    "nombre_comercial" VARCHAR(300),
    "correo" VARCHAR(150),
    "telefono" VARCHAR(20),
    "direccion" VARCHAR(300),
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "proveedores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categorias" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "empresa_id" UUID NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "categorias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "productos" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "empresa_id" UUID NOT NULL,
    "categoria_id" UUID,
    "codigo" VARCHAR(25),
    "codigo_barras" VARCHAR(50),
    "nombre" VARCHAR(300) NOT NULL,
    "descripcion" TEXT,
    "tipo" "TipoProducto" NOT NULL DEFAULT 'PRODUCTO',
    "precio_venta" DECIMAL(14,6) NOT NULL,
    "precio_costo" DECIMAL(14,6),
    "codigo_tarifa_iva" INTEGER NOT NULL DEFAULT 4,
    "stock_minimo" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "productos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "certificados_digitales" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "empresa_id" UUID NOT NULL,
    "nombre_titular" VARCHAR(300) NOT NULL,
    "ruc_titular" VARCHAR(13) NOT NULL,
    "datos_encriptados" BYTEA NOT NULL,
    "iv_encriptacion" VARCHAR(32) NOT NULL,
    "tag_autenticacion" VARCHAR(32) NOT NULL,
    "contrasena_encriptada" VARCHAR(500) NOT NULL,
    "fecha_vencimiento" TIMESTAMP(3) NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "certificados_digitales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuarios" (
    "id" UUID NOT NULL,
    "tenant_id" UUID,
    "empresa_id" UUID,
    "correo" VARCHAR(150) NOT NULL,
    "hash_contrasena" VARCHAR(100) NOT NULL,
    "nombre_completo" VARCHAR(200) NOT NULL,
    "rol" "RolUsuario" NOT NULL DEFAULT 'CAJERO',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tokens_refresh" (
    "id" UUID NOT NULL,
    "usuario_id" UUID NOT NULL,
    "hash_token" VARCHAR(100) NOT NULL,
    "expira_en" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revocado_en" TIMESTAMP(3),

    CONSTRAINT "tokens_refresh_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comprobantes" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "empresa_id" UUID NOT NULL,
    "punto_emision_id" UUID NOT NULL,
    "tipo_comprobante" "TipoComprobante" NOT NULL,
    "estado" "EstadoComprobante" NOT NULL DEFAULT 'BORRADOR',
    "clave_acceso" VARCHAR(49) NOT NULL,
    "clave_idempotencia" VARCHAR(64),
    "serie" VARCHAR(6) NOT NULL,
    "numero_secuencial" VARCHAR(9) NOT NULL,
    "tipo_identificacion_comprador" VARCHAR(2) NOT NULL,
    "identificacion_comprador" VARCHAR(20) NOT NULL,
    "razon_social_comprador" VARCHAR(300) NOT NULL,
    "correo_comprador" VARCHAR(150),
    "direccion_comprador" VARCHAR(300),
    "subtotal_sin_impuestos" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "total_descuento" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "subtotal_iva_0" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "subtotal_iva_5" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "subtotal_iva_12" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "subtotal_iva_15" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "subtotal_no_objeto" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "subtotal_exento" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "total_ice" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "total_irbpnr" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "total_iva" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "propina" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "importe_total" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "url_xml" VARCHAR(500),
    "url_pdf" VARCHAR(500),
    "numero_autorizacion" VARCHAR(49),
    "fecha_autorizacion" TIMESTAMP(3),
    "respuesta_sri_raw" TEXT,
    "intentos_envio" INTEGER NOT NULL DEFAULT 0,
    "ultimo_error" TEXT,
    "comprobante_referencia_id" UUID,
    "fecha_emision" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "comprobantes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lineas_comprobante" (
    "id" UUID NOT NULL,
    "comprobante_id" UUID NOT NULL,
    "numero_linea" INTEGER NOT NULL,
    "codigo_principal" VARCHAR(25),
    "codigo_auxiliar" VARCHAR(25),
    "descripcion" VARCHAR(300) NOT NULL,
    "cantidad" DECIMAL(14,6) NOT NULL,
    "precio_unitario" DECIMAL(14,6) NOT NULL,
    "descuento" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "precio_total_sin_impuesto" DECIMAL(14,2) NOT NULL,
    "codigo_tarifa_iva" INTEGER NOT NULL DEFAULT 4,

    CONSTRAINT "lineas_comprobante_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "impuestos_linea" (
    "id" UUID NOT NULL,
    "linea_id" UUID NOT NULL,
    "tipo_impuesto" "TipoImpuesto" NOT NULL,
    "codigo_impuesto" VARCHAR(4) NOT NULL,
    "codigo_porcentaje" VARCHAR(4) NOT NULL,
    "tarifa" DECIMAL(8,4) NOT NULL,
    "base_imponible" DECIMAL(14,2) NOT NULL,
    "valor" DECIMAL(14,2) NOT NULL,

    CONSTRAINT "impuestos_linea_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "impuestos_comprobante" (
    "id" UUID NOT NULL,
    "comprobante_id" UUID NOT NULL,
    "tipo_impuesto" "TipoImpuesto" NOT NULL,
    "codigo_impuesto" VARCHAR(4) NOT NULL,
    "codigo_porcentaje" VARCHAR(4) NOT NULL,
    "base_imponible" DECIMAL(14,2) NOT NULL,
    "valor" DECIMAL(14,2) NOT NULL,

    CONSTRAINT "impuestos_comprobante_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "formas_pago_comprobante" (
    "id" UUID NOT NULL,
    "comprobante_id" UUID NOT NULL,
    "forma_pago" VARCHAR(2) NOT NULL,
    "total" DECIMAL(14,2) NOT NULL,
    "plazo" INTEGER,
    "unidad_tiempo" VARCHAR(10),

    CONSTRAINT "formas_pago_comprobante_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campos_adicionales" (
    "id" UUID NOT NULL,
    "comprobante_id" UUID NOT NULL,
    "nombre" VARCHAR(300) NOT NULL,
    "valor" VARCHAR(300) NOT NULL,

    CONSTRAINT "campos_adicionales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comprobantes_recibidos" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "empresa_id" UUID NOT NULL,
    "clave_acceso" VARCHAR(49) NOT NULL,
    "tipo_comprobante" "TipoComprobante" NOT NULL,
    "ruc_emisor" VARCHAR(13) NOT NULL,
    "razon_social_emisor" VARCHAR(300) NOT NULL,
    "importe_total" DECIMAL(14,2) NOT NULL,
    "url_xml" VARCHAR(500),
    "numero_autorizacion" VARCHAR(49),
    "fecha_autorizacion" TIMESTAMP(3),
    "fecha_emision" TIMESTAMP(3) NOT NULL,
    "fecha_descarga" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comprobantes_recibidos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_keys" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "empresa_id" UUID,
    "nombre" VARCHAR(100) NOT NULL,
    "prefijo" VARCHAR(20) NOT NULL,
    "hash_clave" VARCHAR(64) NOT NULL,
    "scopes" TEXT[],
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revocado_en" TIMESTAMP(3),

    CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhooks" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "empresa_id" UUID NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "url" VARCHAR(500) NOT NULL,
    "secreto" VARCHAR(200) NOT NULL,
    "eventos" TEXT[],
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "webhooks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "log_eventos_webhook" (
    "id" UUID NOT NULL,
    "webhook_id" UUID NOT NULL,
    "evento" VARCHAR(100) NOT NULL,
    "payload" JSONB NOT NULL,
    "status_code" INTEGER,
    "respuesta" TEXT,
    "exitoso" BOOLEAN NOT NULL DEFAULT false,
    "intento" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "log_eventos_webhook_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "registros_auditoria" (
    "id" UUID NOT NULL,
    "tenant_id" UUID,
    "empresa_id" UUID,
    "usuario_id" UUID,
    "entidad" VARCHAR(100) NOT NULL,
    "entidad_id" VARCHAR(36),
    "accion" VARCHAR(50) NOT NULL,
    "valores_antes" JSONB,
    "valores_despues" JSONB,
    "ip_origen" VARCHAR(45),
    "agente_usuario" VARCHAR(500),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "registros_auditoria_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tenants_slug_key" ON "tenants"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "planes_slug_key" ON "planes"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "suscripciones_tenant_id_key" ON "suscripciones"("tenant_id");

-- CreateIndex
CREATE INDEX "empresas_tenant_id_idx" ON "empresas"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "empresas_tenant_id_ruc_key" ON "empresas"("tenant_id", "ruc");

-- CreateIndex
CREATE INDEX "sucursales_tenant_id_idx" ON "sucursales"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "sucursales_empresa_id_codigo_key" ON "sucursales"("empresa_id", "codigo");

-- CreateIndex
CREATE INDEX "puntos_emision_tenant_id_idx" ON "puntos_emision"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "puntos_emision_sucursal_id_codigo_key" ON "puntos_emision"("sucursal_id", "codigo");

-- CreateIndex
CREATE INDEX "cajas_tenant_id_idx" ON "cajas"("tenant_id");

-- CreateIndex
CREATE INDEX "sesiones_caja_caja_id_idx" ON "sesiones_caja"("caja_id");

-- CreateIndex
CREATE INDEX "sesiones_caja_tenant_id_idx" ON "sesiones_caja"("tenant_id");

-- CreateIndex
CREATE INDEX "bodegas_tenant_id_idx" ON "bodegas"("tenant_id");

-- CreateIndex
CREATE INDEX "stock_productos_tenant_id_idx" ON "stock_productos"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "stock_productos_producto_id_bodega_id_key" ON "stock_productos"("producto_id", "bodega_id");

-- CreateIndex
CREATE INDEX "movimientos_inventario_producto_id_bodega_id_idx" ON "movimientos_inventario"("producto_id", "bodega_id");

-- CreateIndex
CREATE INDEX "movimientos_inventario_created_at_idx" ON "movimientos_inventario"("created_at");

-- CreateIndex
CREATE INDEX "movimientos_inventario_tenant_id_idx" ON "movimientos_inventario"("tenant_id");

-- CreateIndex
CREATE INDEX "clientes_empresa_id_idx" ON "clientes"("empresa_id");

-- CreateIndex
CREATE INDEX "clientes_tenant_id_idx" ON "clientes"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "clientes_empresa_id_identificacion_key" ON "clientes"("empresa_id", "identificacion");

-- CreateIndex
CREATE INDEX "proveedores_empresa_id_idx" ON "proveedores"("empresa_id");

-- CreateIndex
CREATE INDEX "proveedores_tenant_id_idx" ON "proveedores"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "proveedores_empresa_id_identificacion_key" ON "proveedores"("empresa_id", "identificacion");

-- CreateIndex
CREATE INDEX "categorias_empresa_id_idx" ON "categorias"("empresa_id");

-- CreateIndex
CREATE INDEX "categorias_tenant_id_idx" ON "categorias"("tenant_id");

-- CreateIndex
CREATE INDEX "productos_empresa_id_idx" ON "productos"("empresa_id");

-- CreateIndex
CREATE INDEX "productos_tenant_id_idx" ON "productos"("tenant_id");

-- CreateIndex
CREATE INDEX "certificados_digitales_tenant_id_idx" ON "certificados_digitales"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_correo_key" ON "usuarios"("correo");

-- CreateIndex
CREATE INDEX "usuarios_tenant_id_idx" ON "usuarios"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "tokens_refresh_hash_token_key" ON "tokens_refresh"("hash_token");

-- CreateIndex
CREATE UNIQUE INDEX "comprobantes_clave_acceso_key" ON "comprobantes"("clave_acceso");

-- CreateIndex
CREATE UNIQUE INDEX "comprobantes_clave_idempotencia_key" ON "comprobantes"("clave_idempotencia");

-- CreateIndex
CREATE INDEX "comprobantes_empresa_id_estado_idx" ON "comprobantes"("empresa_id", "estado");

-- CreateIndex
CREATE INDEX "comprobantes_empresa_id_tipo_comprobante_idx" ON "comprobantes"("empresa_id", "tipo_comprobante");

-- CreateIndex
CREATE INDEX "comprobantes_clave_acceso_idx" ON "comprobantes"("clave_acceso");

-- CreateIndex
CREATE INDEX "comprobantes_tenant_id_idx" ON "comprobantes"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "comprobantes_recibidos_clave_acceso_key" ON "comprobantes_recibidos"("clave_acceso");

-- CreateIndex
CREATE INDEX "comprobantes_recibidos_empresa_id_idx" ON "comprobantes_recibidos"("empresa_id");

-- CreateIndex
CREATE INDEX "comprobantes_recibidos_tenant_id_idx" ON "comprobantes_recibidos"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "api_keys_hash_clave_key" ON "api_keys"("hash_clave");

-- CreateIndex
CREATE INDEX "api_keys_tenant_id_idx" ON "api_keys"("tenant_id");

-- CreateIndex
CREATE INDEX "webhooks_tenant_id_idx" ON "webhooks"("tenant_id");

-- CreateIndex
CREATE INDEX "log_eventos_webhook_webhook_id_idx" ON "log_eventos_webhook"("webhook_id");

-- CreateIndex
CREATE INDEX "registros_auditoria_empresa_id_entidad_idx" ON "registros_auditoria"("empresa_id", "entidad");

-- CreateIndex
CREATE INDEX "registros_auditoria_tenant_id_idx" ON "registros_auditoria"("tenant_id");

-- CreateIndex
CREATE INDEX "registros_auditoria_created_at_idx" ON "registros_auditoria"("created_at");

-- AddForeignKey
ALTER TABLE "suscripciones" ADD CONSTRAINT "suscripciones_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suscripciones" ADD CONSTRAINT "suscripciones_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "planes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "empresas" ADD CONSTRAINT "empresas_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sucursales" ADD CONSTRAINT "sucursales_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sucursales" ADD CONSTRAINT "sucursales_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "puntos_emision" ADD CONSTRAINT "puntos_emision_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "puntos_emision" ADD CONSTRAINT "puntos_emision_sucursal_id_fkey" FOREIGN KEY ("sucursal_id") REFERENCES "sucursales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cajas" ADD CONSTRAINT "cajas_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cajas" ADD CONSTRAINT "cajas_sucursal_id_fkey" FOREIGN KEY ("sucursal_id") REFERENCES "sucursales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sesiones_caja" ADD CONSTRAINT "sesiones_caja_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sesiones_caja" ADD CONSTRAINT "sesiones_caja_caja_id_fkey" FOREIGN KEY ("caja_id") REFERENCES "cajas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bodegas" ADD CONSTRAINT "bodegas_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bodegas" ADD CONSTRAINT "bodegas_sucursal_id_fkey" FOREIGN KEY ("sucursal_id") REFERENCES "sucursales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_productos" ADD CONSTRAINT "stock_productos_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_productos" ADD CONSTRAINT "stock_productos_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_productos" ADD CONSTRAINT "stock_productos_bodega_id_fkey" FOREIGN KEY ("bodega_id") REFERENCES "bodegas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_inventario" ADD CONSTRAINT "movimientos_inventario_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_inventario" ADD CONSTRAINT "movimientos_inventario_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_inventario" ADD CONSTRAINT "movimientos_inventario_bodega_id_fkey" FOREIGN KEY ("bodega_id") REFERENCES "bodegas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clientes" ADD CONSTRAINT "clientes_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clientes" ADD CONSTRAINT "clientes_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proveedores" ADD CONSTRAINT "proveedores_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proveedores" ADD CONSTRAINT "proveedores_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categorias" ADD CONSTRAINT "categorias_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categorias" ADD CONSTRAINT "categorias_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "productos" ADD CONSTRAINT "productos_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "productos" ADD CONSTRAINT "productos_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "productos" ADD CONSTRAINT "productos_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "categorias"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificados_digitales" ADD CONSTRAINT "certificados_digitales_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificados_digitales" ADD CONSTRAINT "certificados_digitales_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tokens_refresh" ADD CONSTRAINT "tokens_refresh_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comprobantes" ADD CONSTRAINT "comprobantes_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comprobantes" ADD CONSTRAINT "comprobantes_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comprobantes" ADD CONSTRAINT "comprobantes_punto_emision_id_fkey" FOREIGN KEY ("punto_emision_id") REFERENCES "puntos_emision"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lineas_comprobante" ADD CONSTRAINT "lineas_comprobante_comprobante_id_fkey" FOREIGN KEY ("comprobante_id") REFERENCES "comprobantes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "impuestos_linea" ADD CONSTRAINT "impuestos_linea_linea_id_fkey" FOREIGN KEY ("linea_id") REFERENCES "lineas_comprobante"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "impuestos_comprobante" ADD CONSTRAINT "impuestos_comprobante_comprobante_id_fkey" FOREIGN KEY ("comprobante_id") REFERENCES "comprobantes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "formas_pago_comprobante" ADD CONSTRAINT "formas_pago_comprobante_comprobante_id_fkey" FOREIGN KEY ("comprobante_id") REFERENCES "comprobantes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campos_adicionales" ADD CONSTRAINT "campos_adicionales_comprobante_id_fkey" FOREIGN KEY ("comprobante_id") REFERENCES "comprobantes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comprobantes_recibidos" ADD CONSTRAINT "comprobantes_recibidos_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webhooks" ADD CONSTRAINT "webhooks_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webhooks" ADD CONSTRAINT "webhooks_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "log_eventos_webhook" ADD CONSTRAINT "log_eventos_webhook_webhook_id_fkey" FOREIGN KEY ("webhook_id") REFERENCES "webhooks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
