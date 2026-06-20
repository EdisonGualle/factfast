import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { AppContextState } from "@factfast/shared";

interface AppContextActions {
  setTenant: (id: string, nombre: string) => void;
  setEmpresa: (id: string, nombre: string, ruc: string) => void;
  setSucursal: (id: string, nombre: string) => void;
  setCaja: (id: string, nombre: string) => void;
  setSesionCaja: (id: string | null) => void;
  setBodega: (id: string, nombre: string) => void;
  setPuntoEmision: (id: string) => void;
  setAmbiente: (ambiente: "PRUEBAS" | "PRODUCCION") => void;
  resetContext: () => void;
}

const initialState: AppContextState = {
  tenantId: null,
  tenantNombre: null,
  empresaId: null,
  empresaNombre: null,
  empresaRuc: null,
  sucursalId: null,
  sucursalNombre: null,
  cajaId: null,
  cajaNombre: null,
  sesionCajaId: null,
  bodegaId: null,
  bodegaNombre: null,
  puntoEmisionId: null,
  ambienteSri: null,
};

// Store global del contexto operativo — persiste en localStorage
export const useAppContext = create<AppContextState & AppContextActions>()(
  persist(
    (set) => ({
      ...initialState,

      setTenant: (id, nombre) =>
        set({ tenantId: id, tenantNombre: nombre }),

      setEmpresa: (id, nombre, ruc) =>
        set({ empresaId: id, empresaNombre: nombre, empresaRuc: ruc }),

      setSucursal: (id, nombre) =>
        set({ sucursalId: id, sucursalNombre: nombre }),

      setCaja: (id, nombre) =>
        set({ cajaId: id, cajaNombre: nombre }),

      setSesionCaja: (id) =>
        set({ sesionCajaId: id }),

      setBodega: (id, nombre) =>
        set({ bodegaId: id, bodegaNombre: nombre }),

      setPuntoEmision: (id) =>
        set({ puntoEmisionId: id }),

      setAmbiente: (ambiente) =>
        set({ ambienteSri: ambiente }),

      resetContext: () => set(initialState),
    }),
    {
      name: "factfast-context",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
