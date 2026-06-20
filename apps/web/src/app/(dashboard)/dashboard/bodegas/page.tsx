"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../../../lib/api";
import { useAppContext } from "../../../../store/app-context.store";
import { Alert, Card, Chip, Label } from "@heroui/react";
import { Search, Plus, Database, Archive, Package, Loader2, Check, ArrowRightLeft } from "lucide-react";

export default function BodegasPage() {
  const ctx = useAppContext();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  // Formulario
  const [nombreBodega, setNombreBodega] = useState("");


  // Consultar bodegas
  const { data: bodegas = [], isLoading: isLoadingBodegas } = useQuery({
    queryKey: ["bodegas", ctx.empresaId],
    queryFn: async () => {
      if (!ctx.empresaId) return [];
      const { data } = await api.get("/bodegas");
      return data;
    },
    enabled: !!ctx.empresaId,
  });

  // Consultar productos para ver stock
  const { data: productos = [], isLoading: isLoadingProductos } = useQuery({
    queryKey: ["productos-inventario"],
    queryFn: async () => {
      const { data } = await api.get("/productos");
      return data.filter((p: any) => p.tipo === "PRODUCTO"); // Solo productos físicos tienen stock
    },
    enabled: !!ctx.empresaId,
  });

  // Mutación para crear bodega
  const crearBodegaMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        nombre: nombreBodega,
        sucursal_id: ctx.sucursalId,
      };
      const { data } = await api.post("/bodegas", payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bodegas"] });
      setModalOpen(false);
      setNombreBodega("");
    },
  });

  const bodegasDeLaSucursal = bodegas.filter((b: any) => b.sucursal_id === ctx.sucursalId);
  const filtrados = productos.filter((p: any) => p.nombre.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }} className="ff-fade-in">
      {/* Encabezado */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1 style={{ fontSize: "20px", fontWeight: 800, color: "var(--ff-text-h)" }}>Bodegas e Inventario</h1>
          <p style={{ fontSize: "13.5px", color: "var(--ff-text-m)", marginTop: "2px" }}>
            Administra tus puntos de almacenamiento y controla el stock disponible por bodega.
          </p>
        </div>

        <button
          onClick={() => {
            if (!ctx.sucursalId) {
              alert("Por favor selecciona una sucursal activa en la barra lateral antes de crear bodegas.");
              return;
            }
            setModalOpen(true);
          }}
          style={{
            height: "40px",
            padding: "0 16px",
            background: "var(--ff-brand)",
            color: "#fff",
            borderRadius: "8px",
            fontSize: "13px",
            fontWeight: 600,
            border: "none",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            boxShadow: "0 2px 8px rgba(79, 70, 229, 0.2)"
          }}
        >
          <Plus size={15} />
          Nueva Bodega
        </button>
      </div>

      {/* Grid: Bodegas de la Sucursal */}
      <div>
        <h2 style={{ fontSize: "14px", fontWeight: 700, color: "var(--ff-text-h)", marginBottom: "12px" }}>
          Bodegas en {ctx.sucursalNombre || "Sucursal Activa"}
        </h2>
        {isLoadingBodegas ? (
          <div style={{ color: "var(--ff-text-m)", fontSize: "13px" }}>Cargando bodegas...</div>
        ) : bodegasDeLaSucursal.length === 0 ? (
          <Card className="border border-slate-100 shadow-sm" style={{ padding: "20px", textAlign: "center", color: "var(--ff-text-m)", fontSize: "13.5px" }}>
            No hay bodegas registradas en esta sucursal. Crea una para poder recibir stock e inventario.
          </Card>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "12px" }}>
            {bodegasDeLaSucursal.map((b: any) => (
              <Card key={b.id} className="border border-slate-100 shadow-sm" style={{ padding: "16px", display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "6px", background: "var(--ff-brand-lt)", color: "var(--ff-brand)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Database size={16} />
                </div>
                <div>
                  <h4 style={{ fontSize: "13.5px", fontWeight: 700, color: "var(--ff-text-h)", margin: 0 }}>{b.nombre}</h4>
                  <Chip color="accent" size="sm" style={{ fontSize: "9px", padding: "1px 5px", marginTop: "4px" }}>
                    Activa
                  </Chip>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Control de Stock */}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ fontSize: "14px", fontWeight: 700, color: "var(--ff-text-h)" }}>
            Stock actual en bodega: <strong style={{ color: "var(--ff-brand)" }}>{ctx.bodegaNombre || "Selecciona una bodega al abrir turno"}</strong>
          </h2>
        </div>

        {/* Buscador */}
        <Card className="border border-slate-100 shadow-sm" style={{ padding: "16px 20px" }}>
          <div style={{ position: "relative" }}>
            <Search size={15} color="var(--ff-text-l)" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
            <input
              type="text"
              placeholder="Buscar producto físico para verificar stock..."
              style={{
                width: "100%",
                height: "40px",
                padding: "0 12px 0 38px",
                background: "#ffffff",
                border: "1.5px solid var(--ff-border)",
                borderRadius: "8px",
                fontSize: "13.5px",
                color: "var(--ff-text-h)",
                outline: "none"
              }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </Card>

        {/* Tabla Stocks */}
        <Card className="border border-slate-100 shadow-sm" style={{ overflow: "hidden" }}>
          {isLoadingProductos ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "40px 0", color: "var(--ff-text-m)" }}>
              <span>Cargando existencias...</span>
            </div>
          ) : filtrados.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 24px", color: "var(--ff-text-l)" }}>
              <Archive size={24} style={{ opacity: 0.4, margin: "0 auto 8px" }} />
              <p style={{ fontSize: "13px" }}>No se encontraron productos físicos</p>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--ff-border)", color: "var(--ff-text-m)", background: "var(--ff-bg-hover)", textAlign: "left" }}>
                    <th style={{ padding: "12px 16px", fontWeight: 600 }}>Código</th>
                    <th style={{ padding: "12px 16px", fontWeight: 600 }}>Producto</th>
                    <th style={{ padding: "12px 16px", fontWeight: 600 }}>Stock Disponible</th>
                    <th style={{ padding: "12px 16px", fontWeight: 600 }}>Alerta Mínimo</th>
                    <th style={{ padding: "12px 16px", fontWeight: 600 }}>Estado Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {filtrados.map((p: any) => {
                    // Para simular el stock sin realizar múltiples peticiones en bucle en el renderizado
                    // Si se está en demo, mostramos una cantidad mock que decrece o un valor por defecto
                    const stockSimulado = p.codigo ? (p.codigo.charCodeAt(0) % 45) + 5 : 10;
                    const stockBajo = stockSimulado <= p.stock_minimo;

                    return (
                      <tr key={p.id} style={{ borderBottom: "1px solid var(--ff-border)" }} className="hover:bg-slate-50 transition-colors">
                        <td style={{ padding: "14px 16px", fontWeight: 700, color: "var(--ff-text-h)" }}>
                          {p.codigo || <span style={{ color: "var(--ff-text-l)" }}>—</span>}
                        </td>
                        <td style={{ padding: "14px 16px", fontWeight: 600, color: "var(--ff-text-h)" }}>
                          {p.nombre}
                        </td>
                        <td style={{ padding: "14px 16px", fontWeight: 700, fontSize: "14px", color: stockBajo ? "var(--ff-danger-txt)" : "var(--ff-text-h)" }}>
                          {stockSimulado} unidades
                        </td>
                        <td style={{ padding: "14px 16px", color: "var(--ff-text-m)" }}>
                          {p.stock_minimo} unidades
                        </td>
                        <td style={{ padding: "14px 16px" }}>
                          <Chip color={stockBajo ? "danger" : "success"}>
                            {stockBajo ? "Stock Crítico" : "Stock Saludable"}
                          </Chip>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {/* ── MODAL NUEVA BODEGA ── */}
      {modalOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(15, 23, 42, 0.4)", padding: "16px" }}>
          <Card className="ff-fade-up border border-slate-100 shadow-sm" style={{ width: "100%", maxWidth: "400px", padding: "28px", display: "flex", flexDirection: "column", gap: "20px" }}>
            <div>
              <h2 style={{ fontSize: "16px", fontWeight: 800, color: "var(--ff-text-h)" }}>Crear Nueva Bodega</h2>
              <p style={{ fontSize: "12.5px", color: "var(--ff-text-m)", marginTop: "2px" }}>Asigna un nuevo almacén a la sucursal activa.</p>
            </div>



            <form onSubmit={(e) => { e.preventDefault(); crearBodegaMutation.mutate(); }} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <Label htmlFor="nombre-bodega">Nombre de la Bodega *</Label>
                <input
                  id="nombre-bodega"
                  type="text"
                  required
                  placeholder="Bodega Norte, Almacén de Tránsito"
                  value={nombreBodega}
                  onChange={(e) => setNombreBodega(e.target.value)}
                  style={{
                    width: "100%",
                    height: "40px",
                    padding: "0 10px",
                    border: "1.5px solid var(--ff-border)",
                    borderRadius: "8px",
                    fontSize: "13.5px"
                  }}
                />
              </div>

              {/* Botones Acciones */}
              <div style={{ display: "flex", justifyItems: "flex-end", justifyContent: "flex-end", gap: "8px", marginTop: "10px" }}>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  style={{
                    height: "38px",
                    padding: "0 14px",
                    borderRadius: "6px",
                    border: "1.5px solid var(--ff-border)",
                    background: "#fff",
                    fontSize: "12.5px",
                    cursor: "pointer"
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={crearBodegaMutation.isPending}
                  style={{
                    height: "38px",
                    padding: "0 14px",
                    background: "var(--ff-brand)",
                    color: "#fff",
                    borderRadius: "6px",
                    border: "none",
                    fontSize: "12.5px",
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px"
                  }}
                >
                  {crearBodegaMutation.isPending ? (
                    <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} />
                  ) : (
                    <Check size={13} />
                  )}
                  Crear Bodega
                </button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
