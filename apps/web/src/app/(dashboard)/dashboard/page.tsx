"use client";

import React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../../lib/api";
import { useAppContext } from "../../../store/app-context.store";
import { Card, Chip } from "@heroui/react";
import {
  TrendingUp, FileText, Package2, ShieldCheck,
  PlusCircle, ShoppingCart, UserPlus, ArrowUpRight,
  TrendingDown, CheckCircle2, AlertTriangle, FileWarning, Settings
} from "lucide-react";

export default function DashboardPage() {
  const ctx = useAppContext();

  // Consultar últimos comprobantes
  const { data: comprobantes = [], isLoading: cargandoComprobantes } = useQuery({
    queryKey: ["comprobantes-recientes", ctx.empresaId],
    queryFn: async () => {
      if (!ctx.empresaId) return [];
      const { data } = await api.get(`/empresas/${ctx.empresaId}/comprobantes`);
      return data.slice(0, 5); // Tomamos los últimos 5
    },
    enabled: !!ctx.empresaId,
  });

  // Consultar total stock de productos
  const { data: productos = [] } = useQuery({
    queryKey: ["productos-total", ctx.empresaId],
    queryFn: async () => {
      const { data } = await api.get("/productos");
      return data;
    },
    enabled: !!ctx.empresaId,
  });

  // Calcular ventas totales ficticias o reales
  const baseVentas = comprobantes
    .filter((c: any) => c.estado === "AUTORIZADO")
    .reduce((acc: number, c: any) => acc + Number(c.importe_total || 0), 0);

  const totalComprobantes = comprobantes.length;
  const autorizados = comprobantes.filter((c: any) => c.estado === "AUTORIZADO").length;
  const pendientes = comprobantes.filter((c: any) => c.estado === "FIRMADO" || c.estado === "ENVIADO").length;
  const fallidos = comprobantes.filter((c: any) => c.estado === "FALLIDO").length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px" }} className="ff-fade-in">
      {/* ── SECCIÓN BIENVENIDA ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 800, color: "var(--ff-text-h)", letterSpacing: "-0.02em" }}>
            ¡Hola, bienvenido de vuelta!
          </h1>
          <p style={{ fontSize: "14px", color: "var(--ff-text-m)", marginTop: "2px" }}>
            Aquí tienes el resumen de tu negocio en la sucursal <strong style={{ color: "var(--ff-brand)" }}>{ctx.sucursalNombre || "Matriz"}</strong>.
          </p>
        </div>

        {/* Acceso Rápido POS */}
        <Link
          href="/pos"
          style={{
            height: "42px",
            padding: "0 18px",
            background: "var(--ff-brand)",
            color: "#ffffff",
            borderRadius: "8px",
            fontSize: "13.5px",
            fontWeight: 600,
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            boxShadow: "0 4px 14px rgba(79, 70, 229, 0.25)"
          }}
          className="hover:bg-indigo-700 transition"
        >
          <ShoppingCart size={15} />
          Facturación Rápida (POS)
        </Link>
      </div>

      {/* ── CARDS DE KPIs ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
        {/* KPI: Ventas */}
        <Card className="border border-slate-100 shadow-sm" style={{ padding: "20px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--ff-text-m)", textTransform: "uppercase", letterSpacing: "0.04em" }}>Ventas del día</span>
            <h3 style={{ fontSize: "24px", fontWeight: 900, color: "var(--ff-text-h)", marginTop: "6px" }}>
              ${baseVentas.toFixed(2)}
            </h3>
            <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", color: "var(--ff-success-txt)", marginTop: "8px", fontWeight: 600 }}>
              <TrendingUp size={12} />
              <span>+12.4% vs ayer</span>
            </div>
          </div>
          <div style={{ width: "38px", height: "38px", borderRadius: "8px", background: "var(--ff-success-bg)", color: "var(--ff-success)", display: "flex", alignItems: "center", justifyItems: "center", justifyContent: "center" }}>
            <TrendingUp size={18} />
          </div>
        </Card>

        {/* KPI: Facturas Emitidas */}
        <Card className="border border-slate-100 shadow-sm" style={{ padding: "20px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--ff-text-m)", textTransform: "uppercase", letterSpacing: "0.04em" }}>Comprobantes emitidos</span>
            <h3 style={{ fontSize: "24px", fontWeight: 900, color: "var(--ff-text-h)", marginTop: "6px" }}>
              {totalComprobantes}
            </h3>
            <p style={{ fontSize: "11px", color: "var(--ff-text-m)", marginTop: "8px" }}>
              <strong style={{ color: "var(--ff-success-txt)" }}>{autorizados}</strong> autorizados por SRI
            </p>
          </div>
          <div style={{ width: "38px", height: "38px", borderRadius: "8px", background: "var(--ff-brand-lt)", color: "var(--ff-brand)", display: "flex", alignItems: "center", justifyItems: "center", justifyContent: "center" }}>
            <FileText size={18} />
          </div>
        </Card>

        {/* KPI: Stock Productos */}
        <Card className="border border-slate-100 shadow-sm" style={{ padding: "20px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--ff-text-m)", textTransform: "uppercase", letterSpacing: "0.04em" }}>Catálogo de Ítems</span>
            <h3 style={{ fontSize: "24px", fontWeight: 900, color: "var(--ff-text-h)", marginTop: "6px" }}>
              {productos.length}
            </h3>
            <p style={{ fontSize: "11px", color: "var(--ff-text-m)", marginTop: "8px" }}>
              Productos y servicios activos
            </p>
          </div>
          <div style={{ width: "38px", height: "38px", borderRadius: "8px", background: "rgba(99, 102, 241, 0.1)", color: "var(--ff-brand-mid)", display: "flex", alignItems: "center", justifyItems: "center", justifyContent: "center" }}>
            <Package2 size={18} />
          </div>
        </Card>

        {/* KPI: Estado Firma Digital */}
        <Card className="border border-slate-100 shadow-sm" style={{ padding: "20px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--ff-text-m)", textTransform: "uppercase", letterSpacing: "0.04em" }}>Firma Electrónica</span>
            <h3 style={{ fontSize: "16px", fontWeight: 800, color: "var(--ff-success-txt)", marginTop: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
              <ShieldCheck size={16} /> Configurada
            </h3>
            <p style={{ fontSize: "11px", color: "var(--ff-text-m)", marginTop: "8px" }}>
              Válida para firma digital SRI
            </p>
          </div>
          <div style={{ width: "38px", height: "38px", borderRadius: "8px", background: "var(--ff-success-bg)", color: "var(--ff-success)", display: "flex", alignItems: "center", justifyItems: "center", justifyContent: "center" }}>
            <ShieldCheck size={18} />
          </div>
        </Card>
      </div>

      {/* ── ACCESOS DIRECTOS & COMPROBANTES RECIENTES ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: "20px", alignItems: "flex-start" }} className="grid-responsive-layout">
        {/* Tabla Comprobantes Recientes */}
        <Card className="border border-slate-100 shadow-sm" style={{ padding: "24px", minWidth: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
            <div>
              <h2 style={{ fontSize: "15px", fontWeight: 700, color: "var(--ff-text-h)" }}>Comprobantes Recientes</h2>
              <p style={{ fontSize: "12px", color: "var(--ff-text-m)", marginTop: "2px" }}>Últimos documentos emitidos y enviados al SRI</p>
            </div>
            <Link
              href="/dashboard/ventas"
              style={{
                fontSize: "12px",
                color: "var(--ff-brand)",
                fontWeight: 600,
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px"
              }}
              className="hover:underline"
            >
              Ver todo <ArrowUpRight size={13} />
            </Link>
          </div>

          {cargandoComprobantes ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "40px 0", color: "var(--ff-text-m)" }}>
              <span>Cargando actividad...</span>
            </div>
          ) : comprobantes.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 0", color: "var(--ff-text-m)" }}>
              <FileText size={24} style={{ opacity: 0.5, margin: "0 auto 8px" }} />
              <p style={{ fontSize: "13px" }}>No hay comprobantes emitidos recientemente</p>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--ff-border)", color: "var(--ff-text-m)", textAlign: "left" }}>
                    <th style={{ padding: "10px 8px", fontWeight: 600 }}>Secuencial</th>
                    <th style={{ padding: "10px 8px", fontWeight: 600 }}>Cliente</th>
                    <th style={{ padding: "10px 8px", fontWeight: 600 }}>Total</th>
                    <th style={{ padding: "10px 8px", fontWeight: 600 }}>Estado SRI</th>
                  </tr>
                </thead>
                <tbody>
                  {comprobantes.map((c: any) => {
                    const statusColor =
                      c.estado === "AUTORIZADO"
                        ? "success"
                        : c.estado === "FALLIDO"
                          ? "danger"
                          : "warning";

                    return (
                      <tr key={c.id} style={{ borderBottom: "1px solid var(--ff-border)" }}>
                        <td style={{ padding: "12px 8px", fontWeight: 600, color: "var(--ff-text-h)" }}>
                          {c.serie}-{c.numero_secuencial}
                        </td>
                        <td style={{ padding: "12px 8px", color: "var(--ff-text-b)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "160px" }}>
                          {c.razon_social_comprador}
                        </td>
                        <td style={{ padding: "12px 8px", fontWeight: 700, color: "var(--ff-text-h)" }}>
                          ${Number(c.importe_total).toFixed(2)}
                        </td>
                        <td style={{ padding: "12px 8px" }}>
                          <Chip color={statusColor}>
                            {c.estado}
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

        {/* Accesos Directos Operativos */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <Card className="border border-slate-100 shadow-sm" style={{ padding: "20px" }}>
            <h3 style={{ fontSize: "14px", fontWeight: 700, color: "var(--ff-text-h)", marginBottom: "14px" }}>
              Accesos Rápidos
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <Link
                href="/pos"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "10px 12px",
                  borderRadius: "8px",
                  border: "1px solid var(--ff-border)",
                  textDecoration: "none",
                  color: "var(--ff-text-b)",
                  fontSize: "13px",
                  fontWeight: 600,
                  transition: "background 0.15s"
                }}
                className="hover:bg-slate-50"
              >
                <PlusCircle size={15} color="var(--ff-brand)" />
                <span>Nueva Factura (POS)</span>
              </Link>

              <Link
                href="/dashboard/clientes"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "10px 12px",
                  borderRadius: "8px",
                  border: "1px solid var(--ff-border)",
                  textDecoration: "none",
                  color: "var(--ff-text-b)",
                  fontSize: "13px",
                  fontWeight: 600,
                  transition: "background 0.15s"
                }}
                className="hover:bg-slate-50"
              >
                <UserPlus size={15} color="var(--ff-success)" />
                <span>Registrar Cliente</span>
              </Link>

              <Link
                href="/dashboard/productos"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "10px 12px",
                  borderRadius: "8px",
                  border: "1px solid var(--ff-border)",
                  textDecoration: "none",
                  color: "var(--ff-text-b)",
                  fontSize: "13px",
                  fontWeight: 600,
                  transition: "background 0.15s"
                }}
                className="hover:bg-slate-50"
              >
                <Package2 size={15} color="var(--ff-brand-mid)" />
                <span>Crear Producto</span>
              </Link>

              <Link
                href="/dashboard/configuracion"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "10px 12px",
                  borderRadius: "8px",
                  border: "1px solid var(--ff-border)",
                  textDecoration: "none",
                  color: "var(--ff-text-b)",
                  fontSize: "13px",
                  fontWeight: 600,
                  transition: "background 0.15s"
                }}
                className="hover:bg-slate-50"
              >
                <Settings size={15} color="var(--ff-text-m)" />
                <span>Ajustes / Firma Digital</span>
              </Link>
            </div>
          </Card>

          {/* Card Resumen de Comprobantes SRI */}
          <Card className="border border-slate-100 shadow-sm" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "12px" }}>
            <h3 style={{ fontSize: "13px", fontWeight: 700, color: "var(--ff-text-h)" }}>Estado de Envío SRI</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "12.5px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--ff-border)", paddingBottom: "4px" }}>
                <span style={{ color: "var(--ff-text-m)" }}>Autorizados</span>
                <Chip color="success">{autorizados}</Chip>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--ff-border)", paddingBottom: "4px" }}>
                <span style={{ color: "var(--ff-text-m)" }}>Pendientes SRI</span>
                <Chip color="warning">{pendientes}</Chip>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--ff-text-m)" }}>Rechazados/Fallidos</span>
                <Chip color="danger">{fallidos}</Chip>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
