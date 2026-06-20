# PROMPT — Migración total a HeroUI v3 (multi-agente)

> Copia TODO este documento como instrucción para ChatGPT / orquestador multi-agente.
> Objetivo: dejar la app web **solo con HeroUI v3 tematizado**, eliminar el sistema
> redundante `.ff-*`, arreglar el bug del proxy y verificar cada página.

---

## 0) Objetivo

En el monorepo **FactFast** (`apps/web`), reemplazar TODAS las clases CSS propias `.ff-*`
por componentes nativos de **HeroUI v3**, limpiar `globals.css`, y arreglar un bug del
middleware (`proxy.ts`). Todo debe quedar **idéntico visualmente** (o mejor) y **sin errores
de consola**. La marca ya está tematizada vía tokens, así que los componentes salen on-brand solos.

---

## 1) Contexto del proyecto (stack real)

- Monorepo **Turbo + pnpm**. App web en `apps/web`. Working dir de comandos: la raíz del repo.
- **HeroUI v3** (`@heroui/react@3.2.1`, `@heroui/styles@3.2.1`) · **Tailwind CSS v4** (`4.3.1`) · **Next 16.2.9** · **React 19.2.4**.
- Comandos: `pnpm --filter @factfast/web dev` (levanta en `http://localhost:3000`), `pnpm --filter @factfast/web build`, `pnpm --filter @factfast/web lint`.
- Estado del repo: **no es git** (no asumir git).

### ⚠️ Reglas críticas (NO romper)

1. **HeroUI v3 NO usa `<Provider>`.** No agregar `HeroUIProvider`. Los componentes funcionan directo.
2. **Tailwind v4 = config por CSS** (no hay `tailwind.config.js`). El CSS propio DEBE ir dentro de `@layer base` / `@layer components`; el CSS sin capa pisa a HeroUI (ya corregido — no volver a meter reglas sueltas).
3. **Next 16 renombró `middleware.ts` → `proxy.ts`.** Es "NOT the Next.js you know": ante dudas de API de Next, leer `apps/web/node_modules/next/dist/docs/`.
4. **Setup de `globals.css` (ya correcto):** `@import "tailwindcss";` PRIMERO, luego `@import "@heroui/styles/css";`. No tocar ese orden.
5. Tras editar tokens en `globals.css`, el dev server a veces **tarda en recompilar el CSS** (HMR lag). Si un color sale viejo, guardar de nuevo / refresh fuerte antes de concluir que falla.

---

## 2) Estado actual — YA HECHO (no rehacer)

1. **Bug de capas corregido** en `apps/web/src/app/globals.css`: el reset y las `.ff-*` ya están dentro de `@layer base` / `@layer components`. (Antes, sin capa, borraban el padding de HeroUI.)
2. **Fundación de tokens hecha:** en `:root` (sin capa, a propósito) los tokens de HeroUI apuntan a la paleta de marca `--ff-*`:
   ```css
   --accent: var(--ff-brand); --accent-foreground:#fff;
   --background: var(--ff-bg); --foreground: var(--ff-text-b); --muted: var(--ff-text-m);
   --surface: var(--ff-bg-white); --surface-foreground: var(--ff-text-h); --surface-secondary: var(--ff-bg-hover);
   --border: var(--ff-border); --separator: var(--ff-border);
   --success: var(--ff-success); --warning: var(--ff-warning); --danger: var(--ff-danger);  /* +foreground #fff */
   --radius: 0.5rem;
   ```
   → Verificado: `--accent #4f46e5 · --success #10b981 · --danger #ef4444`.
   **MANTENER estos overrides y las variables `--ff-*` (son la fuente de verdad de la marca).**
3. **Primera página YA migrada (úsala de plantilla):** `apps/web/src/app/(auth)/recuperar-contrasena/page.tsx`. Reemplazó `.ff-card → <Card>`, `.ff-label+.ff-input → <TextField>+<Label>+<InputGroup>`, `.ff-btn-primary → <Button variant="primary">`, `.ff-divider → <Separator>`. Renderiza igual, sin errores.

---

## 3) API real de componentes HeroUI v3 (NO inventar)

Importar todo desde `@heroui/react`. Son **compound components**. Props confirmadas leyendo el paquete:

- **Button**: `variant="primary"|"secondary"|"tertiary"|"danger"|"outline"|"ghost"`; tamaños vía clase `button--sm/lg`; props React-Aria: `isDisabled`, `onPress` (NO `onClick` para acciones), `type`.
- **Card** (compound): `<Card variant="default"|"secondary"|"tertiary"|"transparent">` + `Card.Header`, `Card.Title`, `Card.Description`, `Card.Content`, `Card.Footer`. La Card default ya trae superficie/sombra desde tokens; si quieres borde sutil añade `className="border border-slate-100 shadow-sm"`.
- **Alert** (compound): `<Alert status="success"|"danger"|"warning"|"accent"|"default">` + `Alert.Indicator`, `Alert.Title`, `Alert.Description`. (Ojo: la prop es **`status`**, no `variant`.)
- **Chip** (= badge): `<Chip variant="accent"|"primary"|"secondary"|"tertiary"|"default"|"danger"|"success"|"warning"|"soft">`.
- **Campos de formulario** (patrón del login/recuperar):
  ```tsx
  <TextField isRequired isInvalid={!!error} className="flex flex-col gap-1.5">
    <Label className="...">Etiqueta</Label>
    <InputGroup className="...">
      <InputGroup.Prefix>{/* icono */}</InputGroup.Prefix>
      <InputGroup.Input {...register("campo")} />   {/* o value/onChange nativos */}
      <InputGroup.Suffix>{/* botón ojo, etc. */}</InputGroup.Suffix>
    </InputGroup>
    <FieldError className="...">{error?.message}</FieldError>
  </TextField>
  ```
  `TextField` admite `variant="primary"|"secondary"`, `isRequired`, `isInvalid`.
- **Separator**: `<Separator />` (horizontal por defecto), props `orientation`, `variant`.
- Otros disponibles si hacen falta: `Tabs`, `Table`, `Select`, `Checkbox`, `Switch`, `Modal`, `Drawer`, `Popover`, `Tooltip`, `Pagination`, `Skeleton`, `Spinner`, `Avatar`, `Breadcrumbs`, `Toast`. (Carpetas en `node_modules/@heroui/react/dist/components/`.)

---

## 4) Mapeo `.ff-*` → HeroUI (tabla maestra)

| Clase actual | Componente HeroUI | Nota |
|---|---|---|
| `.ff-card` | `<Card>` | añadir `border border-slate-100 shadow-sm` si se quiere el borde |
| `.ff-btn-primary` | `<Button variant="primary">` | |
| `.ff-btn-secondary` | `<Button variant="secondary">` o `"outline"` | |
| `.ff-btn-danger` | `<Button variant="danger">` | |
| `.ff-input` | `<TextField>`+`<Label>`+`<InputGroup>` | patrón de §3 |
| `.ff-label` | `<Label>` | |
| `.ff-badge-blue` / `.ff-badge-teal` | `<Chip variant="accent">` | |
| `.ff-badge-green` | `<Chip variant="success">` | |
| `.ff-badge-red` | `<Chip variant="danger">` | |
| `.ff-badge-amber` | `<Chip variant="warning">` | |
| `.ff-alert-error` | `<Alert status="danger">` | |
| `.ff-alert-success` | `<Alert status="success">` | |
| `.ff-divider` | `<Separator>` | |

**Conservar tal cual** (NO migrar): las animaciones `.ff-fade-up` / `.ff-fade-in` (no hay equivalente), y los usos directos de variables en className tipo `bg-[var(--ff-brand)]`, `text-[var(--ff-text-h)]` (son solo tokens CSS).

---

## 5) Tareas (divídelas entre agentes)

### Tarea A — Fix del proxy (1 agente, rápida)
Archivo: `apps/web/src/proxy.ts`, línea ~34. Las rutas públicas son `["/login", "/registro"]`, pero faltan las de recuperación → un usuario sin sesión NO puede recuperar su contraseña (lo redirige a `/login`).
**Cambio:** `const rutasPublicas = ["/login", "/registro", "/recuperar-contrasena", "/recuperar"];`
Verificar: en navegador sin token, `http://localhost:3000/recuperar-contrasena` ya NO redirige.

### Tareas B1..Bn — Migrar cada página (1 agente por página, en paralelo)
Para cada archivo: reemplazar las `.ff-*` por su componente HeroUI (tabla §4), preservar layout, textos, lógica (react-hook-form, react-query, zustand, handlers) y clases Tailwind utilitarias. Usar `recuperar-contrasena/page.tsx` como plantilla.

Lista de archivos con `.ff-*` (≈176 usos totales):
- [ ] `apps/web/src/app/page.tsx` (landing)
- [ ] `apps/web/src/app/(auth)/registro/page.tsx`
- [ ] `apps/web/src/app/onboarding/page.tsx`
- [ ] `apps/web/src/app/pos/page.tsx`
- [ ] `apps/web/src/app/(dashboard)/layout.tsx`
- [ ] `apps/web/src/app/(dashboard)/dashboard/page.tsx`
- [ ] `apps/web/src/app/(dashboard)/dashboard/clientes/page.tsx`
- [ ] `apps/web/src/app/(dashboard)/dashboard/productos/page.tsx`
- [ ] `apps/web/src/app/(dashboard)/dashboard/ventas/page.tsx`
- [ ] `apps/web/src/app/(dashboard)/dashboard/bodegas/page.tsx`
- [ ] `apps/web/src/app/(dashboard)/dashboard/reportes/page.tsx`
- [ ] `apps/web/src/app/(dashboard)/dashboard/configuracion/page.tsx`
- [x] `apps/web/src/app/(auth)/recuperar-contrasena/page.tsx` ← YA HECHA (plantilla)
- `apps/web/src/app/(auth)/login/page.tsx` ← ya usa HeroUI; solo revisar consistencia.

> Regla de concurrencia: cada agente edita SOLO su archivo de página (sin tocar `globals.css`) para evitar conflictos. La limpieza de `globals.css` (Tarea C) va DESPUÉS, cuando ninguna página use ya `.ff-*`.

### Tarea C — Limpiar `globals.css` (1 agente, AL FINAL)
Solo cuando un `grep` confirme **0 usos** de cada clase: eliminar de `@layer components` las definiciones `.ff-card`, `.ff-input`, `.ff-label`, `.ff-btn-primary/secondary/danger`, `.ff-badge*`, `.ff-alert-*`, `.ff-divider`.
**NO borrar:** el bloque `:root` (tokens HeroUI + variables `--ff-*`), `@layer base`, las animaciones `@keyframes`/`.ff-fade-*`.

### Tarea D — Verificación (1 agente verificador por lote)
Por cada página migrada comprobar: (1) compila, (2) **cero errores/warnings de consola**, (3) se ve igual que antes. Para rutas protegidas por `proxy.ts`, inyectar una cookie `token` falsa (el proxy solo decodifica base64, no valida firma) con `empresa_id` para entrar al dashboard.

---

## 6) Orquestación multi-agente sugerida

1. **Lead** lee este documento + abre cada archivo, confirma `.ff-*` usadas por página.
2. **Paralelo, fase 1:** Tarea A (proxy) + Tareas B (una página por agente). Cada agente: editar → `lint` → auto-revisar.
3. **Barrera:** esperar a que TODAS las páginas terminen y `grep -r "ff-card\|ff-btn\|ff-input\|ff-label\|ff-badge\|ff-alert\|ff-divider" apps/web/src` dé 0.
4. **Fase 2:** Tarea C (limpiar globals) + Tarea D (verificación visual/consola).
5. **Lead** corre `pnpm --filter @factfast/web build` y reporta.

---

## 7) Criterios de aceptación (por página y global)

- [ ] No quedan clases `.ff-card/.ff-btn-*/.ff-input/.ff-label/.ff-badge*/.ff-alert-*/.ff-divider` en `apps/web/src`.
- [ ] Cada página renderiza sin errores de consola ni de hidratación.
- [ ] Apariencia equivalente a la original (marca índigo, espaciados, estados disabled/hover).
- [ ] `proxy.ts` ya permite `/recuperar-contrasena` sin sesión.
- [ ] `pnpm --filter @factfast/web build` pasa.
- [ ] `globals.css` solo conserva: imports, `:root` (tokens+`--ff-*`), `@layer base`, animaciones. Sin `.ff-*` de componentes.
- [ ] Sin `HeroUIProvider`. Sin reglas CSS fuera de `@layer` (excepto `:root` de variables y `@keyframes`).

---

## 8) Gotchas a recordar

- HeroUI v3 sin Provider. Tailwind v4 (capas). Next 16 (`proxy.ts`, no `middleware.ts`).
- `Alert` usa `status`, los demás usan `variant`.
- Acciones de `Button` con `onPress`, no `onClick`.
- Mantener `--ff-*` (alimentan los tokens de HeroUI). No reintroducir CSS sin capa.
- Si un color sale viejo tras editar tokens: es lag de HMR, guardar/refrescar antes de concluir.
