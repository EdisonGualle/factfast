"use client";

import React, { useState } from "react";
import type { AxiosError } from "axios";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../../../lib/api";
import { useAppContext } from "../../../../store/app-context.store";
import { Search, Plus, Package, Loader2, Check, DollarSign } from "lucide-react";
import { Alert, Button, Card, Chip, Label } from "@heroui/react";

type Producto = {
  id: string | number;
  codigo?: string | null;
  nombre: string;
  tipo: string;
  precio_venta: number | string;
  codigo_tarifa_iva: number;
  stock_minimo: number | string;
};

export default function ProductosPage() {
  const ctx = useAppContext();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  // Formulario
  const [codigo, setCodigo] = useState("");
  const [nombre, setNombre] = useState("");
  const [tipo, setTipo] = useState("PRODUCTO");
  const [precioVenta, setPrecioVenta] = useState("");
  const [precioCosto, setPrecioCosto] = useState("");
  const [ivaTarifa, setIvaTarifa] = useState("4"); // 4 = 15% (SRI Tabla 17), 0 = 0%
  const [stockMinimo, setStockMinimo] = useState("0");


  // Consultar productos
  const { data: productos = [], isLoading } = useQuery({
    queryKey: ["productos", ctx.empresaId],
    queryFn: async () => {
      const { data } = await api.get<Producto[]>("/productos");
      return data;
    },
    enabled: !!ctx.empresaId,
  });

  // Mutación para crear producto
  const crearProductoMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        empresa_id: ctx.empresaId,
        codigo,
        nombre,
        tipo,
        precio_venta: Number(precioVenta),
        precio_costo: precioCosto ? Number(precioCosto) : null,
        codigo_tarifa_iva: Number(ivaTarifa),
        stock_minimo: Number(stockMinimo),
      };
      const { data } = await api.post("/productos", payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["productos"] });
      setModalOpen(false);
      // Reset
      setCodigo("");
      setNombre("");
      setPrecioVenta("");
      setPrecioCosto("");
      setStockMinimo("0");
    },
  });

  const filtrados = productos.filter((p) => {
    const q = search.toLowerCase();
    return (
      p.nombre.toLowerCase().includes(q) ||
      (p.codigo && p.codigo.toLowerCase().includes(q))
    );
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }} className="ff-fade-in">
      {/* Encabezado */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1 style={{ fontSize: "20px", fontWeight: 800, color: "var(--ff-text-h)" }}>Catálogo de Ítems</h1>
          <p style={{ fontSize: "13.5px", color: "var(--ff-text-m)", marginTop: "2px" }}>
            Gestiona tus productos, servicios y combos para facturación rápida.
          </p>
        </div>

        <Button
          variant="primary"
          onPress={() => setModalOpen(true)}
          className="h-10 px-4 text-[13px] font-semibold shadow-[0_2px_8px_rgba(79,70,229,0.2)]"
        >
          <Plus size={15} />
          Nuevo Ítem
        </Button>
      </div>

      {/* Buscador */}
      <Card className="border border-[var(--ff-border)] p-4 shadow-sm" style={{ padding: "16px 20px" }}>
        <div style={{ position: "relative" }}>
          <Search size={15} color="var(--ff-text-l)" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
          <input
            type="text"
            placeholder="Buscar por código o nombre del producto/servicio..."
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

      {/* Catálogo Listado */}
      <Card className="overflow-hidden border border-[var(--ff-border)] shadow-sm" style={{ overflow: "hidden" }}>
        {isLoading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "60px 0", color: "var(--ff-text-m)" }}>
            <span>Cargando catálogo de productos...</span>
          </div>
        ) : filtrados.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 24px", color: "var(--ff-text-l)" }}>
            <Package size={32} style={{ opacity: 0.4, margin: "0 auto 12px" }} />
            <p style={{ fontSize: "14px", fontWeight: 500, color: "var(--ff-text-m)" }}>
              {search ? "No se encontraron ítems para tu búsqueda" : "Aún no tienes productos o servicios en tu catálogo"}
            </p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--ff-border)", color: "var(--ff-text-m)", background: "var(--ff-bg-hover)", textAlign: "left" }}>
                  <th style={{ padding: "12px 16px", fontWeight: 600 }}>Código</th>
                  <th style={{ padding: "12px 16px", fontWeight: 600 }}>Nombre</th>
                  <th style={{ padding: "12px 16px", fontWeight: 600 }}>Tipo</th>
                  <th style={{ padding: "12px 16px", fontWeight: 600 }}>Precio Venta</th>
                  <th style={{ padding: "12px 16px", fontWeight: 600 }}>Tarifa IVA</th>
                  <th style={{ padding: "12px 16px", fontWeight: 600 }}>Stock Mín.</th>
                </tr>
              </thead>
              <tbody>
                {filtrados.map((p) => (
                  <tr key={p.id} style={{ borderBottom: "1px solid var(--ff-border)" }} className="hover:bg-slate-50 transition-colors">
                    <td style={{ padding: "14px 16px", fontWeight: 700, color: "var(--ff-text-h)" }}>
                      {p.codigo || <span style={{ color: "var(--ff-text-l)" }}>—</span>}
                    </td>
                    <td style={{ padding: "14px 16px", fontWeight: 600, color: "var(--ff-text-h)" }}>
                      {p.nombre}
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <Chip color={p.tipo === "PRODUCTO" ? "accent" : "success"} size="sm" variant="secondary">
                        {p.tipo}
                      </Chip>
                    </td>
                    <td style={{ padding: "14px 16px", fontWeight: 800, color: "var(--ff-text-h)" }}>
                      ${Number(p.precio_venta).toFixed(2)}
                    </td>
                    <td style={{ padding: "14px 16px", color: "var(--ff-text-b)", fontWeight: 500 }}>
                      {p.codigo_tarifa_iva === 4 ? "IVA 15%" : p.codigo_tarifa_iva === 0 ? "IVA 0%" : "No Objeto"}
                    </td>
                    <td style={{ padding: "14px 16px", color: "var(--ff-text-m)", fontWeight: 500 }}>
                      {p.tipo === "PRODUCTO" ? `${p.stock_minimo} u.` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* ── MODAL NUEVO PRODUCTO/SERVICIO ── */}
      {modalOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(15, 23, 42, 0.4)", padding: "16px" }}>
          <Card className="ff-fade-up border border-[var(--ff-border)] shadow-sm" style={{ width: "100%", maxWidth: "480px", padding: "28px", display: "flex", flexDirection: "column", gap: "20px" }}>
            <div>
              <h2 style={{ fontSize: "16px", fontWeight: 800, color: "var(--ff-text-h)" }}>Agregar Nuevo Ítem</h2>
              <p style={{ fontSize: "12.5px", color: "var(--ff-text-m)", marginTop: "2px" }}>Registra un producto o servicio en tu catálogo de ventas.</p>
            </div>



            <form onSubmit={(e) => { e.preventDefault(); crearProductoMutation.mutate(); }} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {/* Código y Tipo */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <Label className="mb-1.5 block text-[11.5px] font-semibold tracking-[0.05em] text-[var(--ff-text-m)] uppercase">Código Auxiliar</Label>
                  <input
                    type="text"
                    placeholder="PROD-001"
                    value={codigo}
                    onChange={(e) => setCodigo(e.target.value)}
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
                <div>
                  <Label className="mb-1.5 block text-[11.5px] font-semibold tracking-[0.05em] text-[var(--ff-text-m)] uppercase">Tipo de Ítem</Label>
                  <select
                    value={tipo}
                    onChange={(e) => setTipo(e.target.value)}
                    style={{
                      width: "100%",
                      height: "40px",
                      padding: "0 10px",
                      background: "#fff",
                      border: "1.5px solid var(--ff-border)",
                      borderRadius: "8px",
                      fontSize: "13px"
                    }}
                  >
                    <option value="PRODUCTO">Producto (Bien)</option>
                    <option value="SERVICIO">Servicio</option>
                  </select>
                </div>
              </div>

              {/* Nombre */}
              <div>
                <Label className="mb-1.5 block text-[11.5px] font-semibold tracking-[0.05em] text-[var(--ff-text-m)] uppercase">Nombre del Ítem *</Label>
                <input
                  type="text"
                  required
                  placeholder="Coca Cola 350ml o Asesoría Tributaria"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
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

              {/* Precios */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <Label className="mb-1.5 block text-[11.5px] font-semibold tracking-[0.05em] text-[var(--ff-text-m)] uppercase">Precio de Venta ($) *</Label>
                  <div style={{ position: "relative" }}>
                    <DollarSign size={13} color="var(--ff-text-m)" style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)" }} />
                    <input
                      type="number"
                      step="0.000001"
                      required
                      placeholder="1.25"
                      value={precioVenta}
                      onChange={(e) => setPrecioVenta(e.target.value)}
                      style={{
                        width: "100%",
                        height: "40px",
                        padding: "0 10px 0 24px",
                        border: "1.5px solid var(--ff-border)",
                        borderRadius: "8px",
                        fontSize: "13.5px"
                      }}
                    />
                  </div>
                </div>
                <div>
                  <Label className="mb-1.5 block text-[11.5px] font-semibold tracking-[0.05em] text-[var(--ff-text-m)] uppercase">Precio Costo ($)</Label>
                  <div style={{ position: "relative" }}>
                    <DollarSign size={13} color="var(--ff-text-m)" style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)" }} />
                    <input
                      type="number"
                      step="0.000001"
                      placeholder="0.80"
                      value={precioCosto}
                      onChange={(e) => setPrecioCosto(e.target.value)}
                      style={{
                        width: "100%",
                        height: "40px",
                        padding: "0 10px 0 24px",
                        border: "1.5px solid var(--ff-border)",
                        borderRadius: "8px",
                        fontSize: "13.5px"
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Tarifa IVA y Stock Mínimo */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <Label className="mb-1.5 block text-[11.5px] font-semibold tracking-[0.05em] text-[var(--ff-text-m)] uppercase">Tarifa de IVA</Label>
                  <select
                    value={ivaTarifa}
                    onChange={(e) => setIvaTarifa(e.target.value)}
                    style={{
                      width: "100%",
                      height: "40px",
                      padding: "0 10px",
                      background: "#fff",
                      border: "1.5px solid var(--ff-border)",
                      borderRadius: "8px",
                      fontSize: "13px"
                    }}
                  >
                    <option value="4">IVA 15% (Tarifa Actual)</option>
                    <option value="0">IVA 0%</option>
                    <option value="6">No Objeto de Impuesto</option>
                  </select>
                </div>
                <div>
                  <Label className="mb-1.5 block text-[11.5px] font-semibold tracking-[0.05em] text-[var(--ff-text-m)] uppercase">Stock Mínimo Alerta</Label>
                  <input
                    type="number"
                    disabled={tipo === "SERVICIO"}
                    value={stockMinimo}
                    onChange={(e) => setStockMinimo(e.target.value)}
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
              </div>

              {/* Botones Acciones */}
              <div style={{ display: "flex", justifyItems: "flex-end", justifyContent: "flex-end", gap: "8px", marginTop: "10px" }}>
                <Button
                  type="button"
                  variant="outline"
                  onPress={() => setModalOpen(false)}
                  className="h-[38px] px-[14px] text-[12.5px]"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  isDisabled={crearProductoMutation.isPending}
                  className="h-[38px] px-[14px] text-[12.5px] font-semibold"
                >
                  {crearProductoMutation.isPending ? (
                    <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} />
                  ) : (
                    <Check size={13} />
                  )}
                  Guardar
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
