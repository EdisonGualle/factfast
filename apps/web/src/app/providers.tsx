"use client";

import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Toast, toast } from "@heroui/react";
import { useState } from "react";

/** Extrae un mensaje legible de cualquier error de API o de red. */
function mensajeError(error: unknown): string {
  const e = error as { response?: { data?: { message?: string } }; message?: string };
  return (
    e?.response?.data?.message ||
    e?.message ||
    "Ocurrió un error inesperado. Inténtalo de nuevo."
  );
}

/**
 * ¿Debe mostrarse un toast global para este error?
 * - Las 401 las maneja el interceptor (redirige a /login), no se notifican.
 * - Una query/mutation puede excluirse con `meta: { skipErrorToast: true }`
 *   (útil cuando ya muestra su propio error inline).
 */
function debeNotificar(error: unknown, meta?: Record<string, unknown>): boolean {
  if (meta?.skipErrorToast) return false;
  if ((error as { response?: { status?: number } })?.response?.status === 401) return false;
  return true;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minuto
            retry: 1,
          },
        },
        // Errores GENERALES de API → toast (un solo lugar para toda la app)
        queryCache: new QueryCache({
          onError: (error, query) => {
            if (debeNotificar(error, query.meta)) toast.danger(mensajeError(error));
          },
        }),
        mutationCache: new MutationCache({
          onError: (error, _vars, _ctx, mutation) => {
            if (debeNotificar(error, mutation.meta)) toast.danger(mensajeError(error));
          },
        }),
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {/* Región de toasts (requerida por HeroUI v3) — montada una sola vez en el root */}
      <Toast.Provider placement="bottom end" />
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
