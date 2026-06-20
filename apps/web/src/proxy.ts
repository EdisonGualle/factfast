import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Decodifica el payload de un JWT sin validar la firma (seguro para el Edge runtime).
 */
export function decodificarJwt(token: string) {
  try {
    const partes = token.split(".");
    if (partes.length !== 3) return null;
    const payloadJson = atob(partes[1].replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(payloadJson);
  } catch (e) {
    return null;
  }
}

/**
 * Lógica del proxy middleware para el control de rutas e inquilinos (tenants).
 */
export function tenantProxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("token")?.value;

  // Omitir recursos estáticos, de Next.js y endpoints de API interna
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const rutasPublicas = ["/login", "/registro", "/recuperar-contrasena", "/recuperar"];
  const esRutaPublica = rutasPublicas.some((r) => pathname.startsWith(r));

  // Si no hay token de sesión
  if (!token) {
    if (!esRutaPublica && pathname !== "/") {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return NextResponse.next();
  }

  // Validar y decodificar el token
  const payload = decodificarJwt(token);
  if (!payload) {
    const respuesta = NextResponse.redirect(new URL("/login", request.url));
    respuesta.cookies.delete("token");
    return respuesta;
  }

  // Si tiene token y accede a login/registro/raíz
  if (esRutaPublica || pathname === "/") {
    // Si no tiene empresa asignada (excepto superadmin), debe ir a onboarding
    if (!payload.empresa_id && payload.rol !== "SUPERADMIN") {
      return NextResponse.redirect(new URL("/onboarding", request.url));
    }
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Validar onboarding para rutas protegidas
  if (!payload.empresa_id && payload.rol !== "SUPERADMIN" && pathname !== "/onboarding") {
    return NextResponse.redirect(new URL("/onboarding", request.url));
  }

  return NextResponse.next();
}

export function proxy(request: NextRequest) {
  return tenantProxy(request);
}

export default proxy;

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
