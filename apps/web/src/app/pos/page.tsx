"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { useAppContext } from "../../store/app-context.store";
import { Alert, Button, Card, Chip, Label } from "@heroui/react";
import {
  Search, ShoppingCart, Trash2, Plus, Minus, Check,
  User, LogOut, Store, Loader2, Zap, ChevronDown, AlertCircle, Wallet,
} from "lucide-react";

interface Producto { id: string; nombre: string; codigo: string; precio_venta: number; codigo_tarifa_iva: number; tipo: "PRODUCTO" | "SERVICIO"; }
interface Cliente  { id: string; identificacion: string; razon_social: string; tipo_identificacion: string; }
interface CartItem { producto: Producto; cantidad: number; descuento: number; }

const selectStyle: React.CSSProperties = {
  background: "#ffffff",
  border: "1px solid #cbd5e1",
  borderRadius: "8px",
  color: "#0f172a",
  height: "42px",
  padding: "0 12px",
  fontSize: "14px",
  width: "100%",
  outline: "none",
  appearance: "none",
  cursor: "pointer",
  fontFamily: "inherit",
};

export default function PosPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const ctx = useAppContext();

  const [carrito, setCarrito] = useState<CartItem[]>([]);
  const [buscarQ, setBuscarQ] = useState("");
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [formaPago, setFormaPago] = useState("01");
  const [montoApertura, setMontoApertura] = useState("50.00");
  const [selSucursal, setSelSucursal] = useState("");
  const [selCaja, setSelCaja] = useState("");
  const [selBodega, setSelBodega] = useState("");
  const [ventaOk, setVentaOk] = useState(false);

  const { data: sucursales = [] } = useQuery({ queryKey: ["sucursales", ctx.empresaId], queryFn: async () => { if (!ctx.empresaId) return []; const { data } = await api.get(`/empresas/${ctx.empresaId}/sucursales`); return data; }, enabled: !!ctx.empresaId });
  const { data: cajas = [] }     = useQuery({ queryKey: ["cajas"], queryFn: async () => { const { data } = await api.get("/cajas"); return data; }, enabled: !!ctx.empresaId });
  const { data: bodegas = [] }   = useQuery({ queryKey: ["bodegas"], queryFn: async () => { const { data } = await api.get("/bodegas"); return data; }, enabled: !!ctx.empresaId });
  const { data: productos = [], isLoading: cargandoProductos } = useQuery({ queryKey: ["productos"], queryFn: async () => { const { data } = await api.get("/productos"); return data; }, enabled: !!ctx.sesionCajaId });
  const { data: clientes = [] }  = useQuery({ queryKey: ["clientes"], queryFn: async () => { const { data } = await api.get("/clientes"); return data; }, enabled: !!ctx.sesionCajaId });

  useEffect(() => {
    if (clientes.length > 0 && !cliente) { const cf = clientes.find((c: Cliente) => c.identificacion === "9999999999999"); if (cf) setCliente(cf); }
  }, [clientes, cliente]);

  const obtenerStock = async (pid: string) => {
    if (!ctx.bodegaId) return 0;
    try { const { data } = await api.get(`/bodegas/producto/${pid}/stock`); const s = data.find((x: any) => x.bodega_id === ctx.bodegaId); return s ? s.cantidad : 0; }
    catch { return 0; }
  };

  const abrirCajaMutation = useMutation({
    mutationFn: async () => {
      try { const { data } = await api.get(`/cajas/${selCaja}/sesion-activa`); if (data?.id) return data; } catch {}
      const { data } = await api.post(`/cajas/${selCaja}/abrir`, { monto_apertura: Number(montoApertura) });
      return data;
    },
    onSuccess: (data) => {
      const suc = sucursales.find((s: any) => s.id === selSucursal);
      const caj = cajas.find((c: any) => c.id === selCaja);
      const bod = bodegas.find((b: any) => b.id === selBodega);
      ctx.setSucursal(selSucursal, suc?.nombre || "Sucursal");
      ctx.setCaja(selCaja, caj?.nombre || "Caja");
      ctx.setBodega(selBodega, bod?.nombre || "Bodega");
      ctx.setSesionCaja(data.id);
      qc.invalidateQueries({ queryKey: ["productos"] });
    },
  });

  const cerrarCajaMutation = useMutation({
    mutationFn: async () => { if (ctx.cajaId) await api.post(`/cajas/${ctx.cajaId}/cerrar`, { observacion: "Cierre desde POS" }); },
    onSuccess: () => { ctx.setSucursal("", ""); ctx.setCaja("", ""); ctx.setBodega("", ""); ctx.setSesionCaja(null); setCarrito([]); setCliente(null); },
  });

  const ventaMutation = useMutation({
    mutationFn: async () => {
      if (!ctx.cajaId || !ctx.bodegaId || !cliente) throw new Error("Faltan parámetros");
      const total = calcTotal();
      const { data } = await api.post("/pos/venta", { caja_id: ctx.cajaId, bodega_id: ctx.bodegaId, cliente_id: cliente.id, formas_pago: [{ forma_pago: formaPago, total }], lineas: carrito.map((i) => ({ producto_id: i.producto.id, cantidad: i.cantidad, precio_unitario: i.producto.precio_venta, descuento: i.descuento })), clave_idempotencia: `pos-${Date.now()}` });
      return data;
    },
    onSuccess: () => {
      setVentaOk(true); setTimeout(() => setVentaOk(false), 3000);
      setCarrito([]); setBuscarQ("");
      const cf = clientes.find((c: Cliente) => c.identificacion === "9999999999999");
      if (cf) setCliente(cf);
      qc.invalidateQueries({ queryKey: ["productos"] });
    },
  });

  const agregarAlCarrito = async (p: Producto) => {
    if (p.tipo === "PRODUCTO") {
      const stock = await obtenerStock(p.id);
      const en = carrito.find((i) => i.producto.id === p.id);
      if (stock < (en ? en.cantidad + 1 : 1)) { alert(`Sin stock: ${p.nombre}`); return; }
    }
    setCarrito((prev) => { const ex = prev.find((i) => i.producto.id === p.id); return ex ? prev.map((i) => i.producto.id === p.id ? { ...i, cantidad: i.cantidad + 1 } : i) : [...prev, { producto: p, cantidad: 1, descuento: 0 }]; });
  };
  const actualizarCantidad = (id: string, delta: number) => setCarrito((prev) => prev.map((i) => i.producto.id === id ? { ...i, cantidad: Math.max(1, i.cantidad + delta) } : i));
  const removerItem = (id: string) => setCarrito((prev) => prev.filter((i) => i.producto.id !== id));

  const base15 = () => carrito.filter((i) => i.producto.codigo_tarifa_iva === 4).reduce((s, i) => s + Number(i.producto.precio_venta) * i.cantidad - i.descuento, 0);
  const base0  = () => carrito.filter((i) => i.producto.codigo_tarifa_iva === 0).reduce((s, i) => s + Number(i.producto.precio_venta) * i.cantidad - i.descuento, 0);
  const iva    = () => base15() * 0.15;
  const calcTotal = () => base15() + base0() + iva();

  const logout = () => { localStorage.removeItem("factfast_token"); localStorage.removeItem("factfast_refresh"); document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;"; router.push("/login"); };

  const cajasDeSelSuc   = cajas.filter((c: any) => c.sucursal_id === selSucursal);
  const bodegasDeSelSuc = bodegas.filter((b: any) => b.sucursal_id === selSucursal);
  const productosFiltrados = productos.filter((p: Producto) => { const q = buscarQ.toLowerCase(); return p.nombre.toLowerCase().includes(q) || (p.codigo && p.codigo.toLowerCase().includes(q)); });

  /* ─── PANTALLA APERTURA ─── */
  if (!ctx.sesionCajaId) {
    return (
      <div style={{ minHeight: "100vh", background: "#f1f5f9", display: "flex", flexDirection: "column" }}>
        <nav style={{ background: "#ffffff", borderBottom: "1px solid #e2e8f0", padding: "0 24px", height: "60px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ width: "30px", height: "30px", borderRadius: "7px", background: "#1a56db", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Zap size={16} color="#fff" strokeWidth={2.5} />
            </div>
            <span style={{ fontSize: "17px", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.02em" }}>Fact<span style={{ color: "#1a56db" }}>Fast</span></span>
          </div>
          <Button variant="ghost" onPress={logout} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b", fontSize: "13px", display: "flex", alignItems: "center", gap: "6px" }}>
            <LogOut size={14} /> Cerrar sesión
          </Button>
        </nav>

        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 24px" }}>
          <Card className="ff-fade-up" style={{ width: "100%", maxWidth: "460px", padding: "40px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "28px" }}>
              <div style={{ width: "44px", height: "44px", borderRadius: "10px", background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Store size={22} color="#1a56db" strokeWidth={2} />
              </div>
              <div>
                <h1 style={{ fontSize: "18px", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.02em" }}>Apertura de turno</h1>
                <p style={{ fontSize: "13px", color: "#64748b" }}>Selecciona la caja para comenzar</p>
              </div>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); abrirCajaMutation.mutate(); }} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>


              {/* Sucursal */}
              <div>
                <Label htmlFor="ap-sucursal">Sucursal</Label>
                <div style={{ position: "relative" }}>
                  <select id="ap-sucursal" style={selectStyle} value={selSucursal} onChange={(e) => { setSelSucursal(e.target.value); setSelCaja(""); setSelBodega(""); }} required>
                    <option value="">— Seleccionar sucursal —</option>
                    {sucursales.map((s: any) => <option key={s.id} value={s.id}>{s.codigo} · {s.nombre}</option>)}
                  </select>
                  <ChevronDown size={14} color="#94a3b8" style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                </div>
              </div>

              {/* Caja */}
              <div>
                <Label htmlFor="ap-caja">Caja POS</Label>
                <div style={{ position: "relative" }}>
                  <select id="ap-caja" style={{ ...selectStyle, opacity: selSucursal ? 1 : 0.5 }} value={selCaja} onChange={(e) => setSelCaja(e.target.value)} disabled={!selSucursal} required>
                    <option value="">— Seleccionar caja —</option>
                    {cajasDeSelSuc.map((c: any) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                  </select>
                  <ChevronDown size={14} color="#94a3b8" style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                </div>
              </div>

              {/* Bodega */}
              <div>
                <Label htmlFor="ap-bodega">Bodega de despacho</Label>
                <div style={{ position: "relative" }}>
                  <select id="ap-bodega" style={{ ...selectStyle, opacity: selSucursal ? 1 : 0.5 }} value={selBodega} onChange={(e) => setSelBodega(e.target.value)} disabled={!selSucursal} required>
                    <option value="">— Seleccionar bodega —</option>
                    {bodegasDeSelSuc.map((b: any) => <option key={b.id} value={b.id}>{b.nombre}</option>)}
                  </select>
                  <ChevronDown size={14} color="#94a3b8" style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                </div>
              </div>

              {/* Monto */}
              <div>
                <Label htmlFor="ap-monto">Monto de apertura ($)</Label>
                <input id="ap-monto" type="number" step="0.01" min="0" placeholder="50.00" style={{ background: "#fff", border: "1px solid #cbd5e1", borderRadius: "8px", color: "#0f172a", height: "42px", padding: "0 12px", fontSize: "14px", width: "100%", outline: "none", fontFamily: "inherit" }} value={montoApertura} onChange={(e) => setMontoApertura(e.target.value)} />
              </div>

              <Button id="ap-submit" type="submit" variant="primary" isDisabled={abrirCajaMutation.isPending || !selCaja || !selBodega} style={{ width: "100%", marginTop: "4px" }}>
                {abrirCajaMutation.isPending ? <><Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} /> Abriendo...</> : <><Zap size={15} /> Abrir turno</>}
              </Button>
            </form>
          </Card>
        </div>
      </div>
    );
  }

  /* ─── POS ACTIVO (header blanco, contenido claro, panel derecho blanco) ─── */
  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", background: "#f1f5f9" }}>

      {/* Header */}
      <header style={{ background: "#ffffff", borderBottom: "1px solid #e2e8f0", height: "56px", display: "flex", alignItems: "center", padding: "0 20px", gap: "16px", position: "sticky", top: 0, zIndex: 40 }}>
        {/* Brand */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginRight: "8px" }}>
          <div style={{ width: "28px", height: "28px", borderRadius: "6px", background: "var(--ff-brand)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Zap size={14} color="#fff" strokeWidth={2.5} />
          </div>
          <span style={{ fontSize: "15px", fontWeight: 800, color: "#0f172a" }}>Fact<span style={{ color: "var(--ff-brand)" }}>Fast</span></span>
        </div>

        {/* Información de la sesión */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px", flex: 1 }}>
          <span style={{ fontSize: "12px", color: "#64748b" }}>{ctx.sucursalNombre}</span>
          <span style={{ color: "#cbd5e1" }}>·</span>
          <span style={{ fontSize: "12px", color: "#64748b" }}>{ctx.cajaNombre}</span>
          <Chip color="success" variant="soft" style={{ marginLeft: "8px" }}>● Turno abierto</Chip>
        </div>

        {/* Acciones */}
        <div style={{ display: "flex", gap: "8px" }}>
          <Link href="/dashboard" style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            height: "34px",
            padding: "0 12px",
            border: "1.5px solid var(--ff-border)",
            borderRadius: "8px",
            fontSize: "12px",
            fontWeight: 600,
            textDecoration: "none",
            color: "var(--ff-text-b)",
            background: "#ffffff",
          }} className="hover:bg-slate-50 transition-colors">
            Volver al Dashboard
          </Link>
          <Button id="pos-cerrar-caja" variant="danger" onPress={() => { if (confirm("¿Cerrar el turno actual?")) cerrarCajaMutation.mutate(); }} isDisabled={cerrarCajaMutation.isPending} style={{ height: "34px", padding: "0 12px", fontSize: "12px" }}>
            {cerrarCajaMutation.isPending ? <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> : "Cerrar turno"}
          </Button>
          <Button isIconOnly variant="outline" aria-label="Cerrar sesión" onPress={logout} style={{ background: "none", border: "1px solid #e2e8f0", borderRadius: "8px", width: "34px", height: "34px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b" }}>
            <LogOut size={15} />
          </Button>
        </div>
      </header>

      {/* Cuerpo */}
      <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 360px", overflow: "hidden" }}>

        {/* ── CATÁLOGO (izquierda) ── */}
        <main style={{ display: "flex", flexDirection: "column", overflow: "hidden", padding: "20px", gap: "16px" }}>
          {/* Buscador */}
          <div style={{ position: "relative" }}>
            <Search size={15} color="#94a3b8" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
            <input id="pos-buscar" type="text" placeholder="Buscar producto por nombre o código..." style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "8px", color: "#0f172a", height: "42px", padding: "0 12px 0 38px", fontSize: "14px", width: "100%", outline: "none", fontFamily: "inherit", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
              onFocus={(e) => { e.target.style.borderColor = "#1a56db"; e.target.style.boxShadow = "0 0 0 3px rgba(59,130,246,0.18)"; }}
              onBlur={(e)  => { e.target.style.borderColor = "#e2e8f0"; e.target.style.boxShadow = "0 1px 3px rgba(0,0,0,0.06)"; }}
              value={buscarQ} onChange={(e) => setBuscarQ(e.target.value)} />
          </div>

          {/* Grid de productos */}
          <div style={{ flex: 1, overflowY: "auto" }}>
            {cargandoProductos ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "200px", gap: "10px", color: "#94a3b8" }}>
                <Loader2 size={26} style={{ animation: "spin 1s linear infinite", color: "#1a56db" }} />
                <span style={{ fontSize: "14px" }}>Cargando catálogo...</span>
              </div>
            ) : productosFiltrados.length === 0 ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "200px", gap: "8px", color: "#94a3b8" }}>
                <Search size={26} strokeWidth={1.5} />
                <span style={{ fontSize: "14px" }}>No se encontraron productos</span>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))", gap: "12px", paddingBottom: "20px" }}>
                {productosFiltrados.map((p: Producto) => (
                  <Button key={p.id} id={`prod-${p.id}`} variant="outline" onPress={() => agregarAlCarrito(p)}
                    style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "16px", cursor: "pointer", textAlign: "left", transition: "border-color 0.15s, box-shadow 0.15s, transform 0.1s", display: "flex", flexDirection: "column", gap: "8px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", width: "100%" }}
                    onMouseOver={(e) => { const el = e.currentTarget; el.style.borderColor = "#1a56db"; el.style.boxShadow = "0 4px 12px rgba(26,86,219,0.12)"; el.style.transform = "translateY(-1px)"; }}
                    onMouseOut={(e)  => { const el = e.currentTarget; el.style.borderColor = "#e2e8f0"; el.style.boxShadow = "0 1px 3px rgba(0,0,0,0.06)"; el.style.transform = "translateY(0)"; }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <span style={{ fontSize: "10px", fontWeight: 700, color: "#64748b", letterSpacing: "0.05em", textTransform: "uppercase" }}>{p.codigo || "S/C"}</span>
                      <span style={{ fontSize: "9px", fontWeight: 700, padding: "2px 6px", borderRadius: "99px", background: p.tipo === "PRODUCTO" ? "#eff6ff" : "#f0fdf4", color: p.tipo === "PRODUCTO" ? "#1d4ed8" : "#15803d" }}>{p.tipo}</span>
                    </div>
                    <p style={{ fontSize: "14px", fontWeight: 600, color: "#0f172a", lineHeight: 1.3, margin: 0 }}>{p.nombre}</p>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "4px", paddingTop: "8px", borderTop: "1px solid #f1f5f9" }}>
                      <span style={{ fontSize: "17px", fontWeight: 800, color: "#0f172a" }}>${Number(p.precio_venta).toFixed(2)}</span>
                      <span style={{ fontSize: "10px", color: "#94a3b8" }}>{p.codigo_tarifa_iva === 4 ? "IVA 15%" : "0%"}</span>
                    </div>
                  </Button>
                ))}
              </div>
            )}
          </div>
        </main>

        {/* ── PANEL DERECHO (carrito) ── */}
        <aside style={{ background: "#ffffff", borderLeft: "1px solid #e2e8f0", display: "flex", flexDirection: "column", overflow: "hidden" }}>

          {/* Header del carrito */}
          <div style={{ padding: "14px 18px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <ShoppingCart size={17} color="#1a56db" />
              <span style={{ fontSize: "14px", fontWeight: 700, color: "#0f172a" }}>Venta</span>
            </div>
            {carrito.length > 0 && <Chip color="accent" variant="soft">{carrito.length} ítem{carrito.length !== 1 ? "s" : ""}</Chip>}
          </div>

          {/* Cliente */}
          <div style={{ padding: "10px 18px", borderBottom: "1px solid #f1f5f9" }}>
            <Label htmlFor="pos-cliente" style={{ display: "flex", alignItems: "center", gap: "5px" }}><User size={11} /> Cliente</Label>
            <div style={{ position: "relative" }}>
              <select id="pos-cliente" style={selectStyle} value={cliente?.id || ""} onChange={(e) => { const c = clientes.find((c: Cliente) => c.id === e.target.value); if (c) setCliente(c); }}>
                {clientes.map((c: Cliente) => <option key={c.id} value={c.id}>{c.identificacion} · {c.razon_social}</option>)}
              </select>
              <ChevronDown size={13} color="#94a3b8" style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
            </div>
          </div>

          {/* Lista de ítems */}
          <div style={{ flex: 1, overflowY: "auto", padding: "10px 18px" }}>
            {carrito.length === 0 ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "130px", gap: "8px", color: "#94a3b8" }}>
                <ShoppingCart size={26} strokeWidth={1.5} />
                <span style={{ fontSize: "13px" }}>Selecciona productos</span>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {carrito.map((item) => (
                  <div key={item.producto.id} style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "10px 12px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: "13px", fontWeight: 600, color: "#0f172a", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.producto.nombre}</p>
                      <p style={{ fontSize: "11px", color: "#64748b", margin: 0 }}>${Number(item.producto.precio_venta).toFixed(2)} c/u</p>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", border: "1px solid #e2e8f0", borderRadius: "6px", overflow: "hidden", background: "#fff" }}>
                        <Button isIconOnly variant="ghost" aria-label={`Reducir cantidad de ${item.producto.nombre}`} onPress={() => actualizarCantidad(item.producto.id, -1)} style={{ width: "26px", height: "26px", background: "none", border: "none", cursor: "pointer", color: "#475569", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Minus size={12} />
                        </Button>
                        <span style={{ width: "26px", textAlign: "center", fontSize: "13px", fontWeight: 700, color: "#0f172a" }}>{item.cantidad}</span>
                        <Button isIconOnly variant="ghost" aria-label={`Aumentar cantidad de ${item.producto.nombre}`} onPress={() => agregarAlCarrito(item.producto)} style={{ width: "26px", height: "26px", background: "none", border: "none", cursor: "pointer", color: "#475569", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Plus size={12} />
                        </Button>
                      </div>
                      <span style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a", minWidth: "52px", textAlign: "right" }}>${(Number(item.producto.precio_venta) * item.cantidad).toFixed(2)}</span>
                      <Button isIconOnly variant="ghost" aria-label={`Eliminar ${item.producto.nombre}`} onPress={() => removerItem(item.producto.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: "4px", display: "flex", alignItems: "center", borderRadius: "4px", transition: "color 0.15s" }}
                        onMouseOver={(e) => (e.currentTarget.style.color = "#dc2626")}
                        onMouseOut={(e)  => (e.currentTarget.style.color = "#94a3b8")}>
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Forma de pago */}
          <div style={{ padding: "10px 18px", borderTop: "1px solid #f1f5f9" }}>
            <Label style={{ display: "flex", alignItems: "center", gap: "5px" }}><Wallet size={11} /> Pago</Label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
              {[{ code: "01", label: "Efectivo" }, { code: "19", label: "Tarjeta" }, { code: "16", label: "Transferencia" }, { code: "17", label: "Cheque" }].map((fp) => (
                <Button key={fp.code} type="button" id={`pos-pago-${fp.code}`} variant={formaPago === fp.code ? "primary" : "secondary"} onPress={() => setFormaPago(fp.code)}
                  style={{ height: "34px", borderRadius: "6px", border: `1px solid ${formaPago === fp.code ? "#1a56db" : "#e2e8f0"}`, background: formaPago === fp.code ? "#eff6ff" : "#f8fafc", color: formaPago === fp.code ? "#1d4ed8" : "#475569", fontSize: "12px", fontWeight: 600, cursor: "pointer", transition: "all 0.12s", fontFamily: "inherit" }}>
                  {fp.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Totales */}
          <div style={{ padding: "12px 18px", borderTop: "1px solid #e2e8f0", background: "#f8fafc", display: "flex", flexDirection: "column", gap: "5px" }}>
            {[{ label: "Subtotal 15%", val: base15() }, { label: "Subtotal 0%", val: base0() }, { label: "IVA 15%", val: iva() }].map((r) => (
              <div key={r.label} style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#64748b" }}>
                <span>{r.label}</span><span>${r.val.toFixed(2)}</span>
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "20px", fontWeight: 900, color: "#0f172a", borderTop: "1px solid #e2e8f0", paddingTop: "8px", marginTop: "4px" }}>
              <span>Total</span>
              <span style={{ color: "#1a56db" }}>${calcTotal().toFixed(2)}</span>
            </div>
          </div>

          {/* Botón cobrar */}
          <div style={{ padding: "12px 18px 18px" }}>
            {ventaOk && (
              <Alert status="success" style={{ marginBottom: "10px", justifyContent: "center", fontWeight: 600 }}>
                <Alert.Indicator><Check size={14} /></Alert.Indicator>
                <Alert.Description>¡Factura emitida correctamente!</Alert.Description>
              </Alert>
            )}
            <Button id="pos-cobrar" variant="primary" onPress={() => ventaMutation.mutate()} isDisabled={ventaMutation.isPending || carrito.length === 0} style={{ width: "100%", height: "46px", fontSize: "14px" }}>
              {ventaMutation.isPending
                ? <><Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} /> Emitiendo factura...</>
                : <><Check size={16} /> Cobrar y emitir factura</>}
            </Button>
          </div>
        </aside>
      </div>
    </div>
  );
}
