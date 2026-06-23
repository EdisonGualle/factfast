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

function mensajeError(error: unknown): string {
  const e = error as { response?: { data?: { message?: string } }; message?: string };
  return (
    e?.response?.data?.message ||
    e?.message ||
    "Ocurrió un error inesperado. Inténtalo de nuevo."
  );
}

function tituloError(error: unknown): string {
  const status = (error as { response?: { status?: number } })?.response?.status;
  if (status === 401) return "Credenciales inválidas";
  if (status === 404) return "No encontrado";
  if (status === 403) return "Sin permiso";
  if (status === 422) return "Datos inválidos";
  if (status === 500) return "Error del servidor";
  if (!status) return "Sin conexión";
  return "Error";
}

function debeNotificar(error: unknown, meta?: Record<string, unknown>): boolean {
  if (meta?.skipErrorToast) return false;
  return true;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            retry: 1,
          },
        },
        queryCache: new QueryCache({
          onError: (error, query) => {
            if (debeNotificar(error, query.meta))
              toast.danger(tituloError(error), {
                description: mensajeError(error),
                timeout: 5000,
              });
          },
        }),
        mutationCache: new MutationCache({
          onError: (error, _vars, _ctx, mutation) => {
            if (debeNotificar(error, mutation.meta))
              toast.danger(tituloError(error), {
                description: mensajeError(error),
                timeout: 5000,
              });
          },
        }),
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <Toast.Provider placement="top end" maxVisibleToasts={3} gap={8} />
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
