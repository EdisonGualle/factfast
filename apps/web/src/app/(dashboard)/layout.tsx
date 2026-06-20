"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { useAppContext } from "../../store/app-context.store";
import {
  LayoutDashboard, ShoppingCart, FileText, UserPlus,
  Package, Database, BarChart3, Settings, Menu, X, LogOut,
  Building2, MapPin, ShieldCheck, Zap, ToggleLeft, ToggleRight
} from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const ctx = useAppContext();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Consultas de sucursales del usuario para el switcher
  const { data: sucursales = [] } = useQuery({
    queryKey: ["sucursales", ctx.empresaId],
    queryFn: async () => {
      if (!ctx.empresaId) return [];
      const { data } = await api.get(`/empresas/${ctx.empresaId}/sucursales`);
      return data;
    },
    enabled: !!ctx.empresaId,
  });

  // Cambiar sucursal activa desde el sidebar
  const handleSucursalChange = (sucId: string) => {
    const selected = sucursales.find((s: any) => s.id === sucId);
    if (selected) {
      ctx.setSucursal(selected.id, selected.nombre);
      // Al cambiar de sucursal, reiniciamos la caja/bodega activa del contexto
      ctx.setCaja("", "");
      ctx.setBodega("", "");
      ctx.setSesionCaja(null);
    }
  };

  const logout = () => {
    localStorage.removeItem("factfast_token");
    localStorage.removeItem("factfast_refresh");
    document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
    ctx.resetContext();
    router.push("/login");
  };

  const navItems = [
    { href: "/dashboard", label: "Inicio", icon: LayoutDashboard },
    { href: "/pos", label: "Punto de Venta (POS)", icon: ShoppingCart, highlight: true },
    { href: "/dashboard/ventas", label: "Comprobantes SRI", icon: FileText },
    { href: "/dashboard/clientes", label: "Clientes", icon: UserPlus },
    { href: "/dashboard/productos", label: "Productos", icon: Package },
    { href: "/dashboard/bodegas", label: "Bodegas & Inventario", icon: Database },
    { href: "/dashboard/reportes", label: "Reportes & KPIs", icon: BarChart3 },
    { href: "/dashboard/configuracion", label: "Configuración", icon: Settings },
  ];

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--ff-bg)" }}>
      {/* ── SIDEBAR DESKTOP ── */}
      <aside style={{
        width: "260px",
        background: "var(--ff-sidebar)",
        borderRight: "1px solid var(--ff-border)",
        display: "flex",
        flexDirection: "column",
        position: "fixed",
        top: 0,
        bottom: 0,
        left: 0,
        zIndex: 30,
        boxShadow: "var(--ff-shadow-xs)",
        transform: "translateX(0)",
        transition: "transform 0.2s ease",
      }} className="hidden md:flex">
        {/* Sidebar Brand Logo */}
        <div style={{
          height: "64px",
          display: "flex",
          alignItems: "center",
          padding: "0 24px",
          gap: "10px",
          borderBottom: "1px solid var(--ff-border)"
        }}>
          <div style={{
            width: "30px",
            height: "30px",
            borderRadius: "7px",
            background: "var(--ff-brand)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 2px 8px rgba(79, 70, 229, 0.25)"
          }}>
            <Zap size={15} color="#fff" strokeWidth={2.5} />
          </div>
          <span style={{ fontSize: "17px", fontWeight: 800, color: "var(--ff-text-h)" }}>
            Fact<span style={{ color: "var(--ff-brand)" }}>Fast</span>
          </span>
        </div>

        {/* Switcher de Empresa / Sucursal */}
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--ff-border)", display: "flex", flexDirection: "column", gap: "10px" }}>
          {/* Empresa info (solo lectura en este demo) */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "var(--ff-bg-hover)", padding: "8px 12px", borderRadius: "8px" }}>
            <Building2 size={15} color="var(--ff-text-m)" />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--ff-text-m)", textTransform: "uppercase", letterSpacing: "0.02em" }}>Empresa</div>
              <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--ff-text-h)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {ctx.empresaNombre || "Sin empresa"}
              </div>
            </div>
          </div>

          {/* Sucursal Selector */}
          {sucursales.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <label style={{ fontSize: "10px", fontWeight: 700, color: "var(--ff-text-m)", textTransform: "uppercase", letterSpacing: "0.02em", display: "flex", alignItems: "center", gap: "4px" }}>
                <MapPin size={11} /> Sucursal activa
              </label>
              <div style={{ position: "relative" }}>
                <select
                  value={ctx.sucursalId || ""}
                  onChange={(e) => handleSucursalChange(e.target.value)}
                  style={{
                    width: "100%",
                    height: "34px",
                    padding: "0 10px",
                    background: "#ffffff",
                    border: "1.5px solid var(--ff-border)",
                    borderRadius: "6px",
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "var(--ff-text-h)",
                    outline: "none",
                    cursor: "pointer",
                    appearance: "none"
                  }}
                >
                  {sucursales.map((s: any) => (
                    <option key={s.id} value={s.id}>
                      {s.codigo} · {s.nombre}
                    </option>
                  ))}
                </select>
                <div style={{ pointerEvents: "none", position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", fontSize: "10px", color: "var(--ff-text-m)" }}>▼</div>
              </div>
            </div>
          )}
        </div>

        {/* Enlaces de Navegación */}
        <nav style={{ flex: 1, padding: "20px 14px", display: "flex", flexDirection: "column", gap: "4px", overflowY: "auto" }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "10px 14px",
                  borderRadius: "8px",
                  fontSize: "13.5px",
                  fontWeight: active || item.highlight ? 600 : 500,
                  textDecoration: "none",
                  transition: "all 0.15s ease",
                  color: item.highlight
                    ? "#ffffff"
                    : active
                      ? "var(--ff-brand)"
                      : "var(--ff-sidebar-text)",
                  background: item.highlight
                    ? "var(--ff-brand)"
                    : active
                      ? "var(--ff-brand-lt)"
                      : "transparent",
                  boxShadow: item.highlight ? "0 2px 6px rgba(79, 70, 229, 0.2)" : "none",
                }}
                className={!item.highlight ? "hover:bg-slate-100 hover:text-indigo-600" : "hover:bg-indigo-700"}
              >
                <Icon size={17} strokeWidth={active ? 2.5 : 2} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer Sidebar */}
        <div style={{
          padding: "16px 20px",
          borderTop: "1px solid var(--ff-border)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "var(--ff-bg-hover)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
            <div style={{
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              background: "var(--ff-brand-lt)",
              color: "var(--ff-brand)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "13px",
              fontWeight: 700
            }}>
              U
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--ff-text-h)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>Usuario</div>
              <div style={{ fontSize: "10px", color: "var(--ff-text-m)" }}>Activo</div>
            </div>
          </div>
          <button
            onClick={logout}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--ff-text-m)",
              padding: "6px",
              borderRadius: "6px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
            className="hover:bg-red-50 hover:text-red-600"
            title="Cerrar sesión"
          >
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      {/* ── SIDEBAR MOBILE (Overlay + Menu Drawer) ── */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{ position: "fixed", inset: 0, zIndex: 40, background: "rgba(15, 23, 42, 0.4)" }}
          className="md:hidden"
        />
      )}
      <aside style={{
        width: "260px",
        background: "var(--ff-sidebar)",
        borderRight: "1px solid var(--ff-border)",
        display: "flex",
        flexDirection: "column",
        position: "fixed",
        top: 0,
        bottom: 0,
        left: sidebarOpen ? 0 : "-260px",
        zIndex: 50,
        boxShadow: "var(--ff-shadow-lg)",
        transition: "left 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
      }} className="md:hidden">
        {/* Brand */}
        <div style={{ height: "64px", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px", borderBottom: "1px solid var(--ff-border)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ width: "26px", height: "26px", borderRadius: "6px", background: "var(--ff-brand)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Zap size={14} color="#fff" />
            </div>
            <span style={{ fontSize: "16px", fontWeight: 850, color: "var(--ff-text-h)" }}>FactFast</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ff-text-m)" }}>
            <X size={20} />
          </button>
        </div>

        {/* Switcher */}
        <div style={{ padding: "16px", borderBottom: "1px solid var(--ff-border)", display: "flex", flexDirection: "column", gap: "8px" }}>
          <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--ff-text-h)" }}>{ctx.empresaNombre}</div>
          <select
            value={ctx.sucursalId || ""}
            onChange={(e) => handleSucursalChange(e.target.value)}
            style={{ width: "100%", height: "34px", padding: "0 8px", background: "#fff", border: "1px solid var(--ff-border)", borderRadius: "6px", fontSize: "12px" }}
          >
            {sucursales.map((s: any) => (
              <option key={s.id} value={s.id}>{s.nombre}</option>
            ))}
          </select>
        </div>

        {/* Links */}
        <nav style={{ flex: 1, padding: "16px 12px", display: "flex", flexDirection: "column", gap: "4px", overflowY: "auto" }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "10px 12px",
                  borderRadius: "8px",
                  fontSize: "13.5px",
                  fontWeight: active || item.highlight ? 600 : 500,
                  textDecoration: "none",
                  color: item.highlight ? "#fff" : active ? "var(--ff-brand)" : "var(--ff-sidebar-text)",
                  background: item.highlight ? "var(--ff-brand)" : active ? "var(--ff-brand-lt)" : "transparent"
                }}
              >
                <Icon size={16} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* ── CONTENIDO PRINCIPAL ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, paddingLeft: "0" }} className="md:pl-[260px]">
        {/* HEADER DE CABECERA */}
        <header style={{
          height: "64px",
          background: "#ffffff",
          borderBottom: "1px solid var(--ff-border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 24px",
          position: "sticky",
          top: 0,
          zIndex: 20,
        }}>
          {/* Lado Izquierdo: Botón Hamburguesa / Título */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <button
              onClick={() => setSidebarOpen(true)}
              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ff-text-h)" }}
              className="md:hidden"
            >
              <Menu size={20} />
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--ff-text-h)" }}>
                {pathname === "/dashboard" ? "Inicio" : navItems.find(n => n.href !== "/dashboard" && pathname.startsWith(n.href))?.label || "FactFast"}
              </span>
            </div>
          </div>

          {/* Lado Derecho: Estado Operativo y SRI */}
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            {/* Estado SRI */}
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }} className="hidden sm:flex">
              <ShieldCheck size={14} color="var(--ff-success)" />
              <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--ff-success-txt)", textTransform: "uppercase" }}>SRI Conectado</span>
            </div>

            {/* Separador */}
            <span style={{ color: "var(--ff-border)" }} className="hidden sm:inline">|</span>

            {/* Turno de Caja */}
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background: ctx.sesionCajaId ? "var(--ff-success)" : "var(--ff-warning)",
                display: "inline-block"
              }} />
              <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--ff-text-b)" }}>
                {ctx.sesionCajaId ? `Caja: ${ctx.cajaNombre || "Abierta"}` : "Turno cerrado"}
              </span>
              {!ctx.sesionCajaId && (
                <Link
                  href="/pos"
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    color: "var(--ff-brand)",
                    textDecoration: "none",
                    border: "1px solid var(--ff-brand-bdr)",
                    padding: "2px 8px",
                    borderRadius: "4px",
                    background: "var(--ff-brand-lt)",
                  }}
                  className="hover:bg-indigo-100"
                >
                  Abrir
                </Link>
              )}
            </div>
          </div>
        </header>

        {/* CONTENEDOR DE PÁGINAS */}
        <main style={{ flex: 1, padding: "28px 24px", overflowY: "auto" }}>
          {children}
        </main>
      </div>
    </div>
  );
}
