# FactFast — HeroUI v3 + Tailwind v4: contexto, fix aplicado y plan

> Documento de contexto para retomar el trabajo de estilos de la app web.
> Resume el stack real, el bug que ya se corrigió, cómo se personaliza HeroUI v3
> y el plan para consolidar todo en un solo sistema.

---

## 1. TL;DR

- La app usa **HeroUI v3** + **Tailwind CSS v4** + **Next 16**.
- Los estilos de HeroUI "no se aplicaban bien" → **causa real:** el CSS personalizado de `globals.css` estaba **fuera de `@layer`**. En Tailwind v4 el CSS sin capa **gana a todas las capas**, así que un reset `* { padding: 0 }` le borraba el espaciado interno a TODOS los componentes de HeroUI.
- **Ya se corrigió** moviendo el CSS propio a `@layer base` y `@layer components`. Verificado en el navegador (botón pasó de `padding: 0px` → `16px`; input de `height: 20px` → `36px`).
- La configuración de imports y el "no Provider" **ya estaban correctos** según la doc oficial v3.
- Hay **dos sistemas de estilos** conviviendo: (a) los **tokens del tema** = personalización real de HeroUI (✅), y (b) las clases **`.ff-*`** = un sistema propio paralelo y **redundante** con lo que HeroUI ya trae.
- **Plan acordado:** quedarnos solo con HeroUI tematizado y migrar las `.ff-*` a componentes de HeroUI, página por página.

---

## 2. Stack real (versiones leídas del repo)

- Monorepo **Turbo + pnpm**. La web está en `apps/web`.
- `@heroui/react`: **3.2.1**
- `@heroui/styles`: **3.2.1**
- `tailwindcss`: **4.3.1** (Tailwind v4 — sin `tailwind.config.js`, config por CSS)
- `next`: **16.2.9** · `react` / `react-dom`: **19.2.4**
- `framer-motion`, `lucide-react`, `react-hook-form` + `zod`, `@tanstack/react-query`, `zustand`, `axios`.

Datos clave de HeroUI v3 (confirmados en la doc oficial y en el README del paquete):
- **No necesita `<Provider>`** (es React Aria + `tailwind-variants` precompilado). No hay `HeroUIProvider`.
- Setup oficial del CSS: importar `tailwindcss` **primero** y luego `@heroui/styles`.

---

## 3. El problema reportado

Los componentes de HeroUI (`Button`, `TextField`, `InputGroup`, `Label`, `FieldError`, etc.) se renderizaban pero "no se aplicaban bien" los estilos, en toda la app.

## 4. Causa raíz (con evidencia)

HeroUI v3 mete sus estilos en `@layer components` / `@layer theme`, y las utilidades de Tailwind viven en `@layer utilities`. El orden de capas declarado es:

```
@layer theme, base, components, utilities;   /* theme < base < components < utilities */
```

**Regla de CSS:** las reglas **sin `@layer` (unlayered) ganan a CUALQUIER capa**, sin importar la especificidad.

El `globals.css` tenía todo el CSS propio fuera de capas, incluido:

```css
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
```

Ese reset sin capa **sobreescribía** el `padding`/espaciado interno de HeroUI (`@layer components`) e incluso las utilidades `p-*`/`pl-*` propias (`@layer utilities`).

**Medición real en `/login` (estilos computados, antes del fix):**

| Elemento | Antes | Después del fix |
|---|---|---|
| `<Button>` `padding-left/right` | `0px` ❌ | `16px` ✅ (el `px-4` de HeroUI) |
| `<Input>` `padding-left` | `0px` ❌ | `4px` ✅ (`pl-1`) |
| `<Input>` `height` | `20px` (aplastado) ❌ | `36px` ✅ |

## 5. El fix aplicado

En `apps/web/src/app/globals.css` se reorganizó el CSS por capas (sin borrar nada):

- Reset + `html` / `body` / `::selection` / scrollbar → **`@layer base`**
- Clases `.ff-*` (componentes propios) → **`@layer components`**
- Variables `:root` → **se dejan sin capa a propósito** (así sobreescriben los tokens del tema de HeroUI; esto es correcto y deseado).
- `@keyframes` y clases de animación → quedan al final (no chocan con nada).

Estructura resultante:

```css
@import "tailwindcss";          /* 1º Tailwind */
@import "@heroui/styles/css";   /* 2º HeroUI (este archivo ya re-importa tailwind por dentro) */

:root { /* overrides de tokens HeroUI + variables --ff-* propias (sin capa, intencional) */ }

@layer base {
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html { ... } body { ... } ::selection { ... } /* scrollbar */
}

@layer components {
  .ff-card { ... } .ff-input { ... } .ff-btn-primary { ... } /* etc. */
}

/* @keyframes + .ff-fade-* */
```

Con esto el orden queda **theme < base < components < utilities**, que es lo que HeroUI espera: el reset (base) ya no pisa a HeroUI (components) ni a las utilidades (utilities), y los `className` siguen ganando donde toca.

---

## 6. Los DOS sistemas que conviven hoy

### (a) Tokens del tema → SÍ personalizan HeroUI (esto es lo correcto)

Las variables que se sobreescriben en `:root` **son los nombres exactos de tokens de HeroUI** (verificado en `@heroui/styles/dist/themes/default/variables.css`). HeroUI los lee internamente; ej.:

```css
.button--primary { --button-bg: var(--accent); --button-fg: var(--accent-foreground); }
```

Por eso poner `--accent: <índigo>` re-tematiza TODOS los componentes. Esto es el modelo "tipo daisyUI" y funciona.

### (b) Clases `.ff-*` → sistema propio, paralelo y REDUNDANTE

`.ff-card`, `.ff-btn-primary`, `.ff-input`, `.ff-badge-*`, `.ff-alert-*`… usan sus propias variables `--ff-*`, **no** los tokens de HeroUI. Son CSS plano sobre HTML normal. No extienden HeroUI: son una alternativa a HeroUI.

- Uso actual: **`.ff-*` ≈ 176 veces** en 12 páginas · **variables ≈ 343 usos** en 14 archivos. (No son "de gana", pero sí duplican lo que HeroUI ya ofrece.)
- Redundancia extra: el color de marca está escrito dos veces → `--accent` (HeroUI) y `--ff-brand` (propio), sincronizados a mano.

---

## 7. Cómo se personaliza HeroUI v3 (3 niveles)

### Nivel 1 — Tokens del tema (global, una sola fuente de verdad)

Sobreescribir en `:root` (o `@theme`). Tokens disponibles (valores por defecto del tema claro, leídos del paquete):

```
Colores base:   --background (oklch 0.9702) · --foreground · --surface (white) ·
                --surface-secondary · --surface-tertiary · --overlay · --muted
Acción/marca:   --accent (oklch 0.6204 0.195 253.83) · --accent-foreground · --default
Semánticos:     --success · --warning · --danger  (+ cada uno con -foreground)
Calculados auto:--accent-hover · --accent-soft · --danger-soft · ... (no hace falta definirlos)
Forma:          --radius (0.5rem = 8px) · --field-radius · --border-width (1px) · --spacing (0.25rem)
Estado/foco:    --disabled-opacity (0.5) · --focus · --ring-offset-width (2px) · --link
Sombras:        --surface-shadow · --overlay-shadow · --field-shadow
Modo oscuro:    .dark / [data-theme="dark"]  (ya viene definido)
```

> Nota: el `--radius` por defecto ya es 8px (lo que la app quiere). Los botones usan un radio más redondeado por diseño, pero se puede ajustar con `className` o variante.

### Nivel 2 — `className` por instancia

Cualquier componente acepta utilidades Tailwind que ganan sobre su estilo base (ya se usa en el `<Button>` del login).

### Nivel 3 — Extender

Para algo que HeroUI no traiga: componente propio o receta con `tailwind-variants`. Aquí es donde de verdad "se extiende".

---

## 8. Mapeo `.ff-*` → componentes HeroUI (variantes confirmadas leyendo el CSS)

| Clase `.ff-*` actual | Componente HeroUI | Variante |
|---|---|---|
| `.ff-card` | `<Card>` | — |
| `.ff-btn-primary` | `<Button>` | `variant="primary"` |
| `.ff-btn-secondary` | `<Button>` | `variant="secondary"` o `"outline"` |
| `.ff-btn-danger` | `<Button>` | `variant="danger"` |
| `.ff-input` | `<TextField>` + `<Input>` / `<InputGroup>` | — |
| `.ff-label` | `<Label>` | — |
| `.ff-badge-blue` / `.ff-badge-teal` | `<Chip>` | `variant="accent"` |
| `.ff-badge-green` | `<Chip>` | `variant="success"` |
| `.ff-badge-red` | `<Chip>` | `variant="danger"` |
| `.ff-badge-amber` | `<Chip>` | `variant="warning"` |
| `.ff-alert-error` | `<Alert>` | `variant="danger"` |
| `.ff-alert-success` | `<Alert>` | `variant="success"` |
| `.ff-divider` | `<Separator>` | — |

**Variantes que existen en el build instalado:**
- `Button`: `primary, secondary, tertiary, danger, outline, ghost, icon` · tamaños `sm, md, lg` · `full`
- `Chip`: `accent, primary, secondary, tertiary, default, danger, success, warning, soft` · `sm, md, lg`
- `Alert`: `accent, default, danger, success, warning`

---

## 9. Plan para dejar "solo HeroUI" (acordado)

1. **Fundación (1 vez):** un único bloque de tokens en `globals.css` con la marca (acento índigo, `--success/--danger/--warning`, `--radius`, etc.) sobreescribiendo los de HeroUI. Ir retirando los `--ff-*` duplicados.
2. **Migrar página por página:** reemplazar cada `.ff-*` por su componente HeroUI según la tabla.
3. **Extender:** donde HeroUI no llegue, crear componente/variante propia.

> Es un refactor de ~176 usos → se hace **gradual y verificado** (cada página probada en el navegador), no de un golpe.

**Páginas candidatas para empezar:** `dashboard`, `pos`, `productos`, `clientes`, `ventas`, `bodegas`, `reportes`, `configuración`, `registro`, `onboarding`, `recuperar-contraseña`. (El `login` ya usa componentes HeroUI.)

---

## 10. Estado actual / pendientes

- ✅ Bug de capas corregido y verificado en `/login`.
- ⏳ Definir el bloque de tokens de marca definitivo (Nivel 1).
- ⏳ Elegir la primera página a migrar y empezar el reemplazo `.ff-*` → HeroUI.
- ❓ Decisión: ¿migración total a HeroUI o se conservan algunas `.ff-*` puntuales como utilidades?
