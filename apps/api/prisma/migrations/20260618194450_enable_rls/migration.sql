-- Habilitar RLS en las tablas del inquilino

-- 1. empresas
ALTER TABLE "empresas" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "empresas" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "empresas";
CREATE POLICY tenant_isolation ON "empresas"
  USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid OR current_setting('app.bypass_rls', true) = 'true')
  WITH CHECK (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid OR current_setting('app.bypass_rls', true) = 'true');

-- 2. usuarios (tenant_id es nulable)
ALTER TABLE "usuarios" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "usuarios" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "usuarios";
CREATE POLICY tenant_isolation ON "usuarios"
  USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid OR (tenant_id IS NULL AND current_setting('app.bypass_rls', true) = 'true') OR current_setting('app.bypass_rls', true) = 'true')
  WITH CHECK (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid OR (tenant_id IS NULL AND current_setting('app.bypass_rls', true) = 'true') OR current_setting('app.bypass_rls', true) = 'true');

-- 3. api_keys
ALTER TABLE "api_keys" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "api_keys" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "api_keys";
CREATE POLICY tenant_isolation ON "api_keys"
  USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid OR current_setting('app.bypass_rls', true) = 'true')
  WITH CHECK (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid OR current_setting('app.bypass_rls', true) = 'true');

-- 4. registros_auditoria (tenant_id es nulable)
ALTER TABLE "registros_auditoria" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "registros_auditoria" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "registros_auditoria";
CREATE POLICY tenant_isolation ON "registros_auditoria"
  USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid OR (tenant_id IS NULL AND current_setting('app.bypass_rls', true) = 'true') OR current_setting('app.bypass_rls', true) = 'true')
  WITH CHECK (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid OR (tenant_id IS NULL AND current_setting('app.bypass_rls', true) = 'true') OR current_setting('app.bypass_rls', true) = 'true');

-- 5. sucursales
ALTER TABLE "sucursales" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "sucursales" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "sucursales";
CREATE POLICY tenant_isolation ON "sucursales"
  USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid OR current_setting('app.bypass_rls', true) = 'true')
  WITH CHECK (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid OR current_setting('app.bypass_rls', true) = 'true');

-- 6. puntos_emision
ALTER TABLE "puntos_emision" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "puntos_emision" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "puntos_emision";
CREATE POLICY tenant_isolation ON "puntos_emision"
  USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid OR current_setting('app.bypass_rls', true) = 'true')
  WITH CHECK (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid OR current_setting('app.bypass_rls', true) = 'true');

-- 7. cajas
ALTER TABLE "cajas" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "cajas" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "cajas";
CREATE POLICY tenant_isolation ON "cajas"
  USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid OR current_setting('app.bypass_rls', true) = 'true')
  WITH CHECK (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid OR current_setting('app.bypass_rls', true) = 'true');

-- 8. sesiones_caja
ALTER TABLE "sesiones_caja" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "sesiones_caja" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "sesiones_caja";
CREATE POLICY tenant_isolation ON "sesiones_caja"
  USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid OR current_setting('app.bypass_rls', true) = 'true')
  WITH CHECK (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid OR current_setting('app.bypass_rls', true) = 'true');

-- 9. bodegas
ALTER TABLE "bodegas" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "bodegas" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "bodegas";
CREATE POLICY tenant_isolation ON "bodegas"
  USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid OR current_setting('app.bypass_rls', true) = 'true')
  WITH CHECK (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid OR current_setting('app.bypass_rls', true) = 'true');

-- 10. stock_productos
ALTER TABLE "stock_productos" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "stock_productos" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "stock_productos";
CREATE POLICY tenant_isolation ON "stock_productos"
  USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid OR current_setting('app.bypass_rls', true) = 'true')
  WITH CHECK (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid OR current_setting('app.bypass_rls', true) = 'true');

-- 11. movimientos_inventario
ALTER TABLE "movimientos_inventario" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "movimientos_inventario" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "movimientos_inventario";
CREATE POLICY tenant_isolation ON "movimientos_inventario"
  USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid OR current_setting('app.bypass_rls', true) = 'true')
  WITH CHECK (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid OR current_setting('app.bypass_rls', true) = 'true');

-- 12. clientes
ALTER TABLE "clientes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clientes" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "clientes";
CREATE POLICY tenant_isolation ON "clientes"
  USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid OR current_setting('app.bypass_rls', true) = 'true')
  WITH CHECK (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid OR current_setting('app.bypass_rls', true) = 'true');

-- 13. proveedores
ALTER TABLE "proveedores" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "proveedores" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "proveedores";
CREATE POLICY tenant_isolation ON "proveedores"
  USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid OR current_setting('app.bypass_rls', true) = 'true')
  WITH CHECK (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid OR current_setting('app.bypass_rls', true) = 'true');

-- 14. categorias
ALTER TABLE "categorias" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "categorias" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "categorias";
CREATE POLICY tenant_isolation ON "categorias"
  USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid OR current_setting('app.bypass_rls', true) = 'true')
  WITH CHECK (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid OR current_setting('app.bypass_rls', true) = 'true');

-- 15. productos
ALTER TABLE "productos" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "productos" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "productos";
CREATE POLICY tenant_isolation ON "productos"
  USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid OR current_setting('app.bypass_rls', true) = 'true')
  WITH CHECK (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid OR current_setting('app.bypass_rls', true) = 'true');

-- 16. certificados_digitales
ALTER TABLE "certificados_digitales" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "certificados_digitales" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "certificados_digitales";
CREATE POLICY tenant_isolation ON "certificados_digitales"
  USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid OR current_setting('app.bypass_rls', true) = 'true')
  WITH CHECK (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid OR current_setting('app.bypass_rls', true) = 'true');

-- 17. comprobantes
ALTER TABLE "comprobantes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "comprobantes" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "comprobantes";
CREATE POLICY tenant_isolation ON "comprobantes"
  USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid OR current_setting('app.bypass_rls', true) = 'true')
  WITH CHECK (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid OR current_setting('app.bypass_rls', true) = 'true');

-- 18. comprobantes_recibidos
ALTER TABLE "comprobantes_recibidos" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "comprobantes_recibidos" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "comprobantes_recibidos";
CREATE POLICY tenant_isolation ON "comprobantes_recibidos"
  USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid OR current_setting('app.bypass_rls', true) = 'true')
  WITH CHECK (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid OR current_setting('app.bypass_rls', true) = 'true');

-- 19. webhooks
ALTER TABLE "webhooks" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "webhooks" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "webhooks";
CREATE POLICY tenant_isolation ON "webhooks"
  USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid OR current_setting('app.bypass_rls', true) = 'true')
  WITH CHECK (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid OR current_setting('app.bypass_rls', true) = 'true');