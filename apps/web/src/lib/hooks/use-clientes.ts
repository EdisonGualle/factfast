import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../api";

export interface Cliente {
  id: string;
  tenant_id: string;
  empresa_id: string;
  tipo_identificacion: string; // "04" | "05" | "08" | "07"
  identificacion: string;
  razon_social: string;
  nombre_comercial?: string | null;
  correo?: string | null;
  telefono?: string | null;
  direccion?: string | null;
  ciudad?: string | null;
  es_consumidor_final: boolean;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface CrearClientePayload {
  empresa_id: string | null;
  tipo_identificacion: string;
  identificacion: string;
  razon_social: string;
  correo: string | null;
  telefono: string | null;
  direccion: string | null;
}

// Fábrica de claves de consultas para clientes
export const clienteKeys = {
  all: ["clientes"] as const,
  lists: () => [...clienteKeys.all, "list"] as const,
  list: (empresaId: string | null) => [...clienteKeys.lists(), { empresaId }] as const,
};

// Hook para consultar clientes
export function useClientes(empresaId: string | null) {
  return useQuery<Cliente[]>({
    queryKey: clienteKeys.list(empresaId),
    queryFn: async () => {
      if (!empresaId) return [];
      const { data } = await api.get<Cliente[]>("/clientes");
      return data;
    },
    enabled: !!empresaId,
    staleTime: 1000 * 60 * 5, // 5 minutos de validez de caché
  });
}

// Hook para registrar un cliente
export function useCrearCliente() {
  const queryClient = useQueryClient();

  return useMutation<Cliente, any, CrearClientePayload>({
    mutationFn: async (payload) => {
      const { data } = await api.post<Cliente>("/clientes", payload);
      return data;
    },
    onSuccess: (_, variables) => {
      // Invalidar las consultas de clientes de la empresa específica
      queryClient.invalidateQueries({
        queryKey: clienteKeys.all,
      });
    },
  });
}
