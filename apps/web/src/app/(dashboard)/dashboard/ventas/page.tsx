"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../../../lib/api";
import { useAppContext } from "../../../../store/app-context.store";
import { Button, Card, Chip, InputGroup, TextField } from "@heroui/react";
import { Search, FileText, Download, RotateCcw, Plus, Calendar } from "lucide-react";
import { useRouter } from "next/navigation";

type Comprobante = {
  id: string | number;
  razon_social_comprador: string;
  numero_secuencial: string;
  identificacion_comprador: string;
  estado: string;
  fecha_emision?: string;
  created_at: string;
  tipo_comprobante: string;
  serie: string;
  importe_total: string | number;
  url_pdf?: string;
  url_xml?: string;
};

export default function VentasPage() {
  const ctx = useAppContext();
  const router = useRouter();
  const [search, setSearch] = useState("");

  const { data: comprobantes = [], isLoading, refetch } = useQuery<Comprobante[]>({
    queryKey: ["comprobantes", ctx.empresaId],
    queryFn: async () => {
      if (!ctx.empresaId) return [];
      const { data } = await api.get(`/empresas/${ctx.empresaId}/comprobantes`);
      return data as Comprobante[];
    },
    enabled: !!ctx.empresaId,
  });

  const filtrados = comprobantes.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.razon_social_comprador.toLowerCase().includes(q) ||
      c.numero_secuencial.includes(q) ||
      c.identificacion_comprador.includes(q)
    );
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }} className="ff-fade-in">
      {/* Encabezado */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1 style={{ fontSize: "20px", fontWeight: 800, color: "var(--ff-text-h)" }}>Comprobantes SRI</h1>
          <p style={{ fontSize: "13.5px", color: "var(--ff-text-m)", marginTop: "2px" }}>
            Administra tus facturas, notas de crédito y retenciones autorizadas.
          </p>
        </div>

        <Button
          variant="primary"
          onPress={() => router.push("/pos")}
          className="h-10 px-4 text-[13px] font-semibold"
        >
          <Plus size={15} />
          Nueva Factura
        </Button>
      </div>

      {/* Buscador e Información */}
      <Card className="flex items-center gap-3 p-4 md:px-5">
        <TextField className="min-w-0 flex-1">
          <InputGroup className="h-10 rounded-lg border-[1.5px] border-[var(--ff-border)] bg-white px-1">
            <InputGroup.Prefix className="pl-2.5 pr-1.5 text-[var(--ff-text-l)]">
              <Search size={15} />
            </InputGroup.Prefix>
            <InputGroup.Input
              type="text"
              placeholder="Buscar por cliente, RUC/Cédula o número secuencial..."
              className="text-[13.5px] text-[var(--ff-text-h)] placeholder:text-[var(--ff-text-l)]"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </InputGroup>
        </TextField>
        <Button
          variant="outline"
          isIconOnly
          onPress={() => refetch()}
          className="h-10 w-10 min-w-10 rounded-lg border-[1.5px] border-[var(--ff-border)] text-[var(--ff-text-m)]"
          aria-label="Refrescar listado"
        >
          <RotateCcw size={15} />
        </Button>
      </Card>

      {/* Tabla de Documentos */}
      <Card className="overflow-hidden">
        {isLoading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "60px 0", color: "var(--ff-text-m)" }}>
            <span>Cargando comprobantes emitidos...</span>
          </div>
        ) : filtrados.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 24px", color: "var(--ff-text-l)" }}>
            <FileText size={32} style={{ opacity: 0.4, margin: "0 auto 12px" }} />
            <p style={{ fontSize: "14px", fontWeight: 500, color: "var(--ff-text-m)" }}>
              {search ? "No se encontraron resultados para tu búsqueda" : "Aún no has emitido ningún comprobante electrónico"}
            </p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--ff-border)", color: "var(--ff-text-m)", background: "var(--ff-bg-hover)", textAlign: "left" }}>
                  <th style={{ padding: "12px 16px", fontWeight: 600 }}>Fecha</th>
                  <th style={{ padding: "12px 16px", fontWeight: 600 }}>Tipo</th>
                  <th style={{ padding: "12px 16px", fontWeight: 600 }}>Número Secuencial</th>
                  <th style={{ padding: "12px 16px", fontWeight: 600 }}>Cliente / Receptor</th>
                  <th style={{ padding: "12px 16px", fontWeight: 600 }}>Total</th>
                  <th style={{ padding: "12px 16px", fontWeight: 600 }}>Estado SRI</th>
                  <th style={{ padding: "12px 16px", fontWeight: 600, textAlign: "right" }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtrados.map((c) => {
                  const statusColor =
                    c.estado === "AUTORIZADO"
                      ? "success"
                      : c.estado === "FALLIDO"
                        ? "danger"
                        : "warning";

                  return (
                    <tr key={c.id} style={{ borderBottom: "1px solid var(--ff-border)" }} className="hover:bg-slate-50 transition-colors">
                      <td style={{ padding: "14px 16px", color: "var(--ff-text-b)", whiteSpace: "nowrap" }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                          <Calendar size={13} color="var(--ff-text-m)" />
                          {new Date(c.fecha_emision || c.created_at).toLocaleDateString()}
                        </span>
                      </td>
                      <td style={{ padding: "14px 16px", fontWeight: 600, color: "var(--ff-text-m)", textTransform: "capitalize" }}>
                        {c.tipo_comprobante.toLowerCase()}
                      </td>
                      <td style={{ padding: "14px 16px", fontWeight: 700, color: "var(--ff-text-h)" }}>
                        {c.serie}-{c.numero_secuencial}
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ display: "flex", flexDirection: "column", minWidth: "150px" }}>
                          <span style={{ fontWeight: 600, color: "var(--ff-text-h)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {c.razon_social_comprador}
                          </span>
                          <span style={{ fontSize: "11px", color: "var(--ff-text-m)", marginTop: "1px" }}>
                            {c.identificacion_comprador}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: "14px 16px", fontWeight: 800, color: "var(--ff-text-h)" }}>
                        ${Number(c.importe_total).toFixed(2)}
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <Chip color={statusColor} variant="soft" size="sm">{c.estado}</Chip>
                      </td>
                      <td style={{ padding: "14px 16px", textAlign: "right" }}>
                        <div style={{ display: "inline-flex", gap: "6px" }}>
                          <a
                            href={c.url_pdf || "#"}
                            target={c.url_pdf ? "_blank" : undefined}
                            onClick={(e) => { if (!c.url_pdf) { e.preventDefault(); alert("El PDF está generándose o el SRI no autorizó el comprobante."); } }}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              width: "30px",
                              height: "30px",
                              borderRadius: "6px",
                              border: "1px solid var(--ff-border)",
                              background: "#ffffff",
                              color: "var(--ff-text-b)",
                              cursor: "pointer"
                            }}
                            className="hover:bg-indigo-50 hover:text-indigo-600"
                            title="Descargar PDF (RIDE)"
                          >
                            <Download size={13} />
                          </a>
                          <a
                            href={c.url_xml || "#"}
                            target={c.url_xml ? "_blank" : undefined}
                            onClick={(e) => { if (!c.url_xml) { e.preventDefault(); alert("El XML no está disponible todavía."); } }}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              width: "30px",
                              height: "30px",
                              borderRadius: "6px",
                              border: "1px solid var(--ff-border)",
                              background: "#ffffff",
                              color: "var(--ff-text-b)",
                              cursor: "pointer"
                            }}
                            className="hover:bg-indigo-50 hover:text-indigo-600"
                            title="Descargar XML SRI"
                          >
                            <FileText size={13} />
                          </a>
                        </div>
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
  );
}
