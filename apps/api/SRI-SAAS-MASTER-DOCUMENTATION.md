# 🧾 BIBLIA ARQUITECTÓNICA — FACTURADOR SRI SAAS
**Versión Ficha Técnica SRI:** 2.26 (Marzo 2024) — **LEÍDA Y VERIFICADA DEL PDF OFICIAL**

---

## 1. STACK TECNOLÓGICO
```
NestJS + TypeScript (strict)
├── Base de datos      → PostgreSQL 16 + Prisma ORM
├── Colas asíncronas  → BullMQ + Redis 7
├── Criptografía      → node-forge (XAdES-BES, AES-256-GCM, RSA-SHA1)
├── XML               → xmlbuilder2 + C14N canonicalización
├── PDFs (RIDE)       → Puppeteer + @signpdf
├── Storage           → MinIO (dev) / AWS S3 (prod)
└── Docs API          → Swagger @nestjs/swagger
```

> **Docker:** Opcional. Los servicios (Postgres, Redis, MinIO) pueden instalarse localmente o en Docker, a elección.

---

## 2. COMPROBANTES SOPORTADOS (Tabla 3 — Ficha Técnica SRI v2.26)

| Código | Nombre | Tag XML raíz |
|--------|--------|-------------|
| `01` | Factura | `<factura>` |
| `03` | Liquidación de Compra | `<liquidacionCompra>` |
| `04` | Nota de Crédito | `<notaCredito>` |
| `05` | Nota de Débito | `<notaDebito>` |
| `06` | Guía de Remisión | `<guiaRemision>` |
| `07` | Comprobante de Retención | `<comprobanteRetencion>` |

---

## 3. CLAVE DE ACCESO — ALGORITMO MÓDULO 11 (49 dígitos exactos)

Fuente: **Tabla 1, Sección 5.2 de la Ficha Técnica SRI v2.26**

```
┌─────────────┬────────────┬─────┬─────┬───────┬───────────┬──────────┬──────────┬──────────────┐
│ fechaEmision│tipoComprob.│ RUC │ambi.│ serie │ secuencial│ codNumeri│tipoEmision│ dígitoVerif. │
│  8 dígitos  │  2 dígitos │ 13  │  1  │   6   │     9     │    8     │     1    │      1       │
│  ddmmaaaa   │  Tabla 3   │     │Tab4 │001001 │000000001  │ libre    │  Tab 2   │  Módulo 11   │
└─────────────┴────────────┴─────┴─────┴───────┴───────────┴──────────┴──────────┴──────────────┘
TOTAL: 8+2+13+1+6+9+8+1+1 = 49 dígitos
```

**Algoritmo Módulo 11 (del ejemplo real del PDF):**
- Multiplicar cada dígito (de derecha a izquierda) por factor ponderado que cicla: 2,3,4,5,6,7,2,3,4...
- Sumar productos → dividir entre 11 → obtener residuo → `dígito = 11 - residuo`
- Si resultado = 11 → dígito = 0 / Si resultado = 10 → dígito = 1

**Tipo de emisión (Tabla 2):** Solo existe `1` = Emisión normal (offline)
**Tipo de ambiente (Tabla 4):** `1` = Pruebas / `2` = Producción

---

## 4. SERVICIOS WEB SRI (URLs REALES — Sección 7 Ficha Técnica)

### Ambiente de Pruebas
```
Recepción:    https://celcer.sri.gob.ec/comprobantes-electronicos-ws/RecepcionComprobantesOffline?wsdl
Autorización: https://celcer.sri.gob.ec/comprobantes-electronicos-ws/AutorizacionComprobantesOffline?wsdl
```

### Ambiente de Producción
```
Recepción:    https://cel.sri.gob.ec/comprobantes-electronicos-ws/RecepcionComprobantesOffline?wsdl
Autorización: https://cel.sri.gob.ec/comprobantes-electronicos-ws/AutorizacionComprobantesOffline?wsdl
```

### Respuestas SOAP reales del SRI
- **Recepción exitosa:** `<estado>RECIBIDA</estado>`
- **Recepción fallida:** `<estado>DEVUELTA</estado>` + mensajes de error
- **Autorizado:** `<estado>AUTORIZADO</estado>` + `<numeroAutorizacion>` (= claveAcceso)
- **Rechazado:** `<estado>RECHAZADO</estado>` + mensajes
- **En procesamiento:** `PPR` — reintentar más tarde

---

## 5. ESTRUCTURA XML — FACTURA (Anexo 1 v1.0.0 — Ficha Técnica)

### `<infoTributaria>` — Obligatoria en TODOS los comprobantes
| Tag | Tipo | Longitud | Req |
|-----|------|----------|-----|
| `<ambiente>` | Numérico | 1 | Obligatorio — Tabla 4 |
| `<tipoEmision>` | Numérico | 1 | Obligatorio — Tabla 2 |
| `<razonSocial>` | Alfanumérico | Max 300 | Obligatorio |
| `<nombreComercial>` | Alfanumérico | Max 300 | Condicional |
| `<ruc>` | Numérico | 13 | Obligatorio |
| `<claveAcceso>` | Numérico | 49 | Obligatorio |
| `<codDoc>` | Numérico | 2 | Obligatorio — Tabla 3 |
| `<estab>` | Numérico | 3 | Obligatorio (ej: `002`) |
| `<ptoEmi>` | Numérico | 3 | Obligatorio (ej: `001`) |
| `<secuencial>` | Numérico | 9 | Obligatorio (ej: `000000001`) |
| `<dirMatriz>` | Alfanumérico | Max 300 | Obligatorio |

### `<infoFactura>` — Específico de Factura
| Tag | Tipo | Longitud | Req |
|-----|------|----------|-----|
| `<fechaEmision>` | Fecha | dd/mm/aaaa | Obligatorio |
| `<dirEstablecimiento>` | Alfanumérico | Max 300 | Condicional |
| `<contribuyenteEspecial>` | Alfanumérico | Min 3 Max 13 | Condicional |
| `<obligadoContabilidad>` | Texto | SI/NO | Condicional |
| `<tipoIdentificacionComprador>` | Numérico | 2 | Obligatorio — Tabla 6 |
| `<guiaRemision>` | Numérico | 15 | Condicional |
| `<razonSocialComprador>` | Alfanumérico | Max 300 | Obligatorio |
| `<identificacionComprador>` | Alfanumérico | Max 20 | Obligatorio |
| `<direccionComprador>` | Alfanumérico | Max 300 | Condicional |
| `<totalSinImpuestos>` | Numérico | Max 14 | Obligatorio |
| `<totalDescuento>` | Numérico | Max 14 | Obligatorio |
| `<totalConImpuestos>` → `<totalImpuesto>` | — | — | Obligatorio |
| `<propina>` | Numérico | Max 14 | Obligatorio |
| `<importeTotal>` | Numérico | Max 14 | Obligatorio |
| `<moneda>` | Alfanumérico | Max 15 | Condicional (`DOLAR`) |
| `<pagos>` → `<pago>` → `<formaPago>` | Numérico | 2 | Obligatorio — Tabla 24 |
| `<valorRetIva>` | Numérico | Max 14 | Opcional |
| `<valorRetRenta>` | Numérico | Max 14 | Opcional |

### `<detalles>` → `<detalle>` — Línea de producto
| Tag | Tipo | Longitud | Req |
|-----|------|----------|-----|
| `<codigoPrincipal>` | Alfanumérico | Max 25 | Obligatorio |
| `<codigoAuxiliar>` | Alfanumérico | Max 25 | Condicional |
| `<descripcion>` | Alfanumérico | Max 300 | Obligatorio |
| `<cantidad>` | Numérico | Max 14 | Obligatorio |
| `<precioUnitario>` | Numérico | Max 14 | Obligatorio |
| `<descuento>` | Numérico | Max 14 | Obligatorio |
| `<precioTotalSinImpuesto>` | Numérico | Max 14 | Obligatorio |
| `<impuestos>` → `<impuesto>` → `<codigo>` | Numérico | 1 | Obligatorio — Tabla 16 |
| `<codigoPorcentaje>` | Numérico | Min1 Max4 | Obligatorio — Tabla 17/18 |
| `<tarifa>` | Numérico | Min1 Max4 | Obligatorio |
| `<baseImponible>` | Numérico | Max 14 | Obligatorio |
| `<valor>` | Numérico | Max 14 | Obligatorio |

---

## 6. CÓDIGOS DE IMPUESTOS (Ficha Técnica v2.26)

### Tabla 16 — Código de Impuesto
| Impuesto | Código |
|----------|--------|
| IVA | `2` |
| ICE | `3` |
| IRBPNR | `5` |

### Tabla 17 — Tarifas IVA
| Porcentaje | Código |
|-----------|--------|
| 0% | `0` |
| 12% | `2` |
| 14% | `3` |
| **15%** | **`4`** |
| 5% | `5` |
| No Objeto | `6` |
| Exento | `7` |
| IVA Diferenciado | `8` |
| 13% | `10` |

### Tabla 6 — Tipo de Identificación del Comprador
| Tipo | Código |
|------|--------|
| RUC | `04` |
| Cédula | `05` |
| Pasaporte | `06` |
| Consumidor Final | `07` |
| Identificación del Exterior | `08` |

> **Consumidor Final:** se usan 13 nueves (`9999999999999`)

---

## 7. FIRMA ELECTRÓNICA — XADES-BES (Sección 6 Ficha Técnica)

| Parámetro | Valor |
|-----------|-------|
| Estándar | `XAdES_BES` |
| Versión esquema | `1.3.2` |
| Codificación | `UTF-8` |
| Tipo de firma | `ENVELOPED` |
| Algoritmo firmado | **`RSA-SHA1`** (requerido por SRI, no SHA-256) |
| Longitud de clave | `2048 bits` |
| Formato certificado | `PKCS12 (.p12)` |

---

## 8. JERARQUÍA MULTI-TENANT — BASE DE DATOS

```
empresas (RUC / Empresa)
  └── sucursales (establecimientos, código 3 dígitos)
        └── puntos_emision (cajas, código 3 dígitos + secuencias)
```

### Convenciones de Base de Datos
- **Nombres:** español (snake_case, plurales)  
- **IDs:** UUID v4 (`uuid` tipo)
- **Timestamps:** `created_at`, `updated_at`, `deleted_at` (en inglés, estándar)
- **Montos:** `DECIMAL(14,2)` — el SRI usa Max 14 dígitos
- **Borrado:** Solo soft delete (`deleted_at`)
- **Sin abreviaturas** en nombres de columnas — legibles y claros

---

## 9. ESTRUCTURA DE CARPETAS

```
api-facturacion/
├── prisma/
│   ├── schema.prisma             ← Modelos BD en español
│   └── migrations/
├── src/
│   ├── comun/                    ← Filtros, guards, decoradores, interceptors
│   │   ├── filtros/
│   │   ├── guardias/
│   │   ├── interceptores/
│   │   └── decoradores/
│   ├── configuracion/            ← ConfigModule tipado con Joi
│   ├── base-de-datos/            ← PrismaService
│   ├── autenticacion/            ← JWT, bcrypt, refresh tokens
│   ├── empresas/                 ← CRUD empresas (RUC, razón social)
│   ├── sucursales/               ← CRUD sucursales
│   ├── puntos-emision/           ← CRUD cajas + control secuencias
│   ├── certificados/             ← Bóveda AES-256-GCM para .p12
│   ├── documentos/               ← Módulo maestro de comprobantes
│   │   ├── facturas/             ← Facturas (código 01)
│   │   ├── notas-credito/        ← Notas de crédito (código 04)
│   │   ├── notas-debito/         ← Notas de débito (código 05)
│   │   ├── guias-remision/       ← Guías de remisión (código 06)
│   │   └── retenciones/          ← Retenciones (código 07)
│   ├── sri/                      ← Motor SRI
│   │   ├── clave-acceso/         ← Algoritmo Módulo 11 (49 dígitos)
│   │   ├── constructor-xml/      ← Build XML por tipo de comprobante
│   │   ├── firmador/             ← XAdES-BES (RSA-SHA1, ENVELOPED)
│   │   └── cliente-soap/         ← SOAP celcer/cel
│   ├── colas/                    ← BullMQ workers
│   │   ├── firma.processor.ts
│   │   ├── envio.processor.ts
│   │   └── pdf.processor.ts
│   ├── pdf/                      ← Generación RIDE con Puppeteer
│   │   ├── plantillas/           ← HTML por tipo de comprobante
│   │   └── pdf.service.ts
│   ├── almacenamiento/           ← MinIO/S3
│   ├── webhooks/                 ← Notificaciones salientes
│   ├── rpa/                      ← Bot descarga compras SRI
│   └── salud/                    ← Health check /status
├── test/
│   └── sri/
│       └── clave-acceso.spec.ts  ← TDD obligatorio Módulo 11
├── docker-compose.yml            ← OPCIONAL — Postgres + Redis + MinIO
├── .env.example
└── .env
```

---

## 10. FLUJO ASÍNCRONO — CICLO DE VIDA DE UNA FACTURA

```
POST /v1/facturas
  ↓ Valida DTO + calcula clave de acceso (Módulo 11)
  ↓ Guarda en BD → estado: BORRADOR
  ↓ Respuesta inmediata: 202 Accepted + { documento_id }

[Cola: firma]
  ↓ Descifra .p12 en RAM → nunca a disco
  ↓ Construye XML según ficha técnica SRI
  ↓ Firma con XAdES-BES (RSA-SHA1 ENVELOPED)
  ↓ Estado: FIRMADO

[Cola: envio]
  ↓ POST SOAP → celcer/cel → RecepcionComprobantesOffline
  ↓ Si respuesta = RECIBIDA → esperar → GET AutorizacionComprobantesOffline
  ↓ Si SRI caído → backoff 5min → 15min → 30min (máx 10 reintentos)
  ↓ Estado: ENVIADO → AUTORIZADO / FALLIDO

[Cola: pdf]
  ↓ Renderiza HTML con Puppeteer (logo + QR + datos SRI)
  ↓ Sube XML + PDF a MinIO/S3
  ↓ Actualiza urls en BD

[Webhook saliente]
  ↓ Notifica al e-commerce del cliente
```

---

## 11. SEGURIDAD

| Mecanismo | Implementación |
|-----------|---------------|
| `.p12` en BD | AES-256-GCM: `encrypted_data` + `iv` + `auth_tag` |
| `.p12` en uso | Solo en RAM durante firma, se limpia inmediatamente |
| Contraseña `.p12` | También encriptada AES-256-GCM |
| JWT | Access 15min + Refresh 7días con invalidación Redis |
| Roles | `SUPERADMIN` · `ADMIN` · `USUARIO` |
| Multi-tenant | Guard automático inyecta `empresa_id` en cada request |
| Idempotencia | Header `Idempotency-Key` → SHA-256 en BD |
| Secuencias | `SELECT FOR UPDATE` en `puntos_emision` dentro de transacción |
| Rate limiting | 100 req/min por IP (ThrottlerModule) |

---

## 12. PLAN DE SPRINTS

### ✅ FASE 1 — Cimientos (EN PROGRESO)
- [x] NestJS CLI instalado
- [x] Proyecto NestJS inicializado
- [x] Dependencias instaladas
- [x] `docker-compose.yml` (opcional)
- [x] `.env.example` con todas las variables
- [ ] `ConfigModule` con validación Joi
- [ ] Schema Prisma completo (modelos en español)
- [ ] `PrismaService` con lifecycle hooks
- [ ] `GlobalExceptionFilter`
- [ ] Swagger en `/api/docs`
- [ ] Health Check en `/status`

### 🔜 FASE 2 — Multi-Empresa y Seguridad
### 🔜 FASE 3 — Motor Tributario SRI (XML + Módulo 11 + XAdES-BES)
### 🔜 FASE 4 — Motor Asíncrono BullMQ
### 🔜 FASE 5 — RIDE / PDFs Puppeteer
### 🔜 FASE 6 — Bot RPA

---

## 13. VARIABLES DE ENTORNO

```env
# Aplicación
NODE_ENV=development
PORT=3000
API_PREFIX=v1

# Base de Datos (requerida)
DATABASE_URL=postgresql://facturacion:facturacion_pass@localhost:5432/facturacion_db

# Redis (requerido para colas)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=redis_pass

# JWT (cambiar en producción)
JWT_ACCESS_SECRET=minimo_20_caracteres_aqui
JWT_REFRESH_SECRET=otro_secreto_minimo_20_chars
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d

# Criptografía AES-256 (exactamente 32 caracteres)
MASTER_ENCRYPTION_KEY=32_caracteres_exactos_aqui_ok_0

# MinIO / S3
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin123
MINIO_BUCKET=facturacion

# SRI
SRI_ENVIRONMENT=pruebas
SRI_WSDL_RECEPCION_PRUEBAS=https://celcer.sri.gob.ec/comprobantes-electronicos-ws/RecepcionComprobantesOffline?wsdl
SRI_WSDL_AUTORIZACION_PRUEBAS=https://celcer.sri.gob.ec/comprobantes-electronicos-ws/AutorizacionComprobantesOffline?wsdl
SRI_WSDL_RECEPCION_PROD=https://cel.sri.gob.ec/comprobantes-electronicos-ws/RecepcionComprobantesOffline?wsdl
SRI_WSDL_AUTORIZACION_PROD=https://cel.sri.gob.ec/comprobantes-electronicos-ws/AutorizacionComprobantesOffline?wsdl
```
