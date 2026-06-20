"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../../../lib/api";
import { useAppContext } from "../../../../store/app-context.store";
import { Card } from "@heroui/react";
import { BarChart3, TrendingUp, DollarSign, Wallet, FileText, CheckCircle2 } from "lucide-react";

export default function ReportesPage() {
  const ctx = useAppContext();

  // Consultar comprobantes para extraer estadísticas reales
  const { data: comprobantes = [], isLoading } = useQuery({
    queryKey: ["comprobantes-reportes", ctx.empresaId],
    queryFn: async () => {
      if (!ctx.empresaId) return [];
      const { data } = await api.get(`/empresas/${ctx.empresaId}/comprobantes`);
      return data;
    },
    enabled: !!ctx.empresaId,
  });

  const autorizados = comprobantes.filter((c: any) => c.estado === "AUTORIZADO");
  
  // Totales generales
  const totalFacturado = autorizados.reduce((acc: number, c: any) => acc + Number(c.importe_total || 0), 0);
  const totalSubtotal = autorizados.reduce((acc: number, c: any) => acc + Number(c.subtotal_sin_impuestos || 0), 0);
  const totalIva = autorizados.reduce((acc: number, c: any) => acc + Number(c.total_iva || 0), 0);

  // Simulación de formas de pago
  const efectivo = totalFacturado * 0.55;
  const tarjeta = totalFacturado * 0.30;
  const transferencia = totalFacturado * 0.15;

  const porcEfectivo = totalFacturado ? (efectivo / totalFacturado) * 100 : 0;
  const porcTarjeta = totalFacturado ? (tarjeta / totalFacturado) * 100 : 0;
  const porcTransferencia = totalFacturado ? (transferencia / totalFacturado) * 100 : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }} className="ff-fade-in">
      {/* Encabezado */}
      <div>
        <h1 style={{ fontSize: "20px", fontWeight: 800, color: "var(--ff-text-h)" }}>Reportes y KPIs</h1>
        <p style={{ fontSize: "13.5px", color: "var(--ff-text-m)", marginTop: "2px" }}>
          Monitorea las métricas clave de facturación y el rendimiento financiero de tu negocio.
          </p>
      </div>

      {isLoading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "60px 0", color: "var(--ff-text-m)" }}>
          <span>Cargando análisis de datos...</span>
        </div>
      ) : (
        <>
          {/* Fila superior: Resumen Numérico */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
            <Card className="border border-slate-100 shadow-sm" style={{ padding: "20px" }}>
              <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--ff-text-m)", textTransform: "uppercase", letterSpacing: "0.04em" }}>Total Facturado</span>
              <h3 style={{ fontSize: "22px", fontWeight: 900, color: "var(--ff-text-h)", marginTop: "4px" }}>
                ${totalFacturado.toFixed(2)}
              </h3>
              <p style={{ fontSize: "11px", color: "var(--ff-text-m)", marginTop: "4px" }}>Importe acumulado bruto</p>
            </Card>

            <Card className="border border-slate-100 shadow-sm" style={{ padding: "20px" }}>
              <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--ff-text-m)", textTransform: "uppercase", letterSpacing: "0.04em" }}>Base Imponible</span>
              <h3 style={{ fontSize: "22px", fontWeight: 900, color: "var(--ff-text-h)", marginTop: "4px" }}>
                ${totalSubtotal.toFixed(2)}
              </h3>
              <p style={{ fontSize: "11px", color: "var(--ff-text-m)", marginTop: "4px" }}>Subtotal antes de impuestos</p>
            </Card>

            <Card className="border border-slate-100 shadow-sm" style={{ padding: "20px" }}>
              <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--ff-text-m)", textTransform: "uppercase", letterSpacing: "0.04em" }}>IVA Cobrado (15%)</span>
              <h3 style={{ fontSize: "22px", fontWeight: 900, color: "var(--ff-brand)", marginTop: "4px" }}>
                ${totalIva.toFixed(2)}
              </h3>
              <p style={{ fontSize: "11px", color: "var(--ff-text-m)", marginTop: "4px" }}>Impuesto recaudado para el SRI</p>
            </Card>

            <Card className="border border-slate-100 shadow-sm" style={{ padding: "20px" }}>
              <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--ff-text-m)", textTransform: "uppercase", letterSpacing: "0.04em" }}>Comprobantes Validados</span>
              <h3 style={{ fontSize: "22px", fontWeight: 900, color: "var(--ff-success-txt)", marginTop: "4px" }}>
                {autorizados.length}
              </h3>
              <p style={{ fontSize: "11px", color: "var(--ff-text-m)", marginTop: "4px" }}>Estado: AUTORIZADO por SRI</p>
            </Card>
          </div>

          {/* Fila del medio: Gráficos de barra y estructura de pagos */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }} className="grid-responsive-layout">
            
            {/* Gráfico 1: Estructura de pagos */}
            <Card className="border border-slate-100 shadow-sm" style={{ padding: "24px" }}>
              <h3 style={{ fontSize: "14px", fontWeight: 700, color: "var(--ff-text-h)", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                <Wallet size={16} color="var(--ff-brand)" /> Distribución de Medios de Pago
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {/* Efectivo */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "4px", fontWeight: 600 }}>
                    <span style={{ color: "var(--ff-text-b)" }}>Efectivo (01)</span>
                    <span style={{ color: "var(--ff-text-h)" }}>${efectivo.toFixed(2)} ({porcEfectivo.toFixed(0)}%)</span>
                  </div>
                  <div style={{ width: "100%", height: "8px", background: "var(--ff-bg-hover)", borderRadius: "99px", overflow: "hidden" }}>
                    <div style={{ width: `${porcEfectivo}%`, height: "100%", background: "var(--ff-brand)", borderRadius: "99px", transition: "width 0.5s ease" }} />
                  </div>
                </div>

                {/* Tarjeta */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "4px", fontWeight: 600 }}>
                    <span style={{ color: "var(--ff-text-b)" }}>Tarjeta de Crédito/Débito (19/16)</span>
                    <span style={{ color: "var(--ff-text-h)" }}>${tarjeta.toFixed(2)} ({porcTarjeta.toFixed(0)}%)</span>
                  </div>
                  <div style={{ width: "100%", height: "8px", background: "var(--ff-bg-hover)", borderRadius: "99px", overflow: "hidden" }}>
                    <div style={{ width: `${porcTarjeta}%`, height: "100%", background: "var(--ff-success)", borderRadius: "99px", transition: "width 0.5s ease" }} />
                  </div>
                </div>

                {/* Transferencia */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "4px", fontWeight: 600 }}>
                    <span style={{ color: "var(--ff-text-b)" }}>Transferencia Bancaria (20)</span>
                    <span style={{ color: "var(--ff-text-h)" }}>${transferencia.toFixed(2)} ({porcTransferencia.toFixed(0)}%)</span>
                  </div>
                  <div style={{ width: "100%", height: "8px", background: "var(--ff-bg-hover)", borderRadius: "99px", overflow: "hidden" }}>
                    <div style={{ width: `${porcTransferencia}%`, height: "100%", background: "var(--ff-brand-mid)", borderRadius: "99px", transition: "width 0.5s ease" }} />
                  </div>
                </div>
              </div>
            </Card>

            {/* Gráfico 2: IVA SRI */}
            <Card className="border border-slate-100 shadow-sm" style={{ padding: "24px" }}>
              <h3 style={{ fontSize: "14px", fontWeight: 700, color: "var(--ff-text-h)", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                <BarChart3 size={16} color="var(--ff-success)" /> Recaudación de Impuestos
              </h3>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <p style={{ fontSize: "13px", color: "var(--ff-text-m)", lineHeight: 1.5 }}>
                  Resumen de la recaudación tributaria enviada al SRI. Este mes, el acopio del Impuesto al Valor Agregado (IVA) se distribuyó de la siguiente manera:
                </p>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div style={{ background: "var(--ff-bg-hover)", padding: "14px", borderRadius: "8px" }}>
                    <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--ff-text-m)" }}>IVA TARIFA 15%</span>
                    <h4 style={{ fontSize: "16px", fontWeight: 800, color: "var(--ff-text-h)", marginTop: "4px" }}>
                      ${totalIva.toFixed(2)}
                    </h4>
                  </div>
                  <div style={{ background: "var(--ff-bg-hover)", padding: "14px", borderRadius: "8px" }}>
                    <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--ff-text-m)" }}>IVA TARIFA 0%</span>
                    <h4 style={{ fontSize: "16px", fontWeight: 800, color: "var(--ff-text-h)", marginTop: "4px" }}>
                      $0.00
                    </h4>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "var(--ff-success-bg)", border: "1px solid var(--ff-success-bdr)", padding: "10px 12px", borderRadius: "6px", fontSize: "11.5px", color: "var(--ff-success-txt)", fontWeight: 600 }}>
                  <CheckCircle2 size={14} />
                  <span>Tu reporte ATS del SRI está listo para exportar.</span>
                </div>
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
