"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Alert, Button, Label, toast } from "@heroui/react";
import { api } from "../../lib/api";
import { useAppContext } from "../../store/app-context.store";
import {
  Building2, MapPin, FileText, DollarSign, Package,
  Loader2, CheckCircle2, Zap, Search, ChevronRight,
} from "lucide-react";

/* ── Tipos de pasos ── */
const PASOS = [
  { num: 1, label: "Empresa",   icon: Building2 },
  { num: 2, label: "Sucursal",  icon: MapPin },
  { num: 3, label: "Emisión",   icon: FileText },
  { num: 4, label: "Caja",      icon: DollarSign },
  { num: 5, label: "Bodega",    icon: Package },
];

/* ── Helpers de estilo ── */
const inputBase: React.CSSProperties = {
  width: "100%",
  height: "44px",
  padding: "0 12px",
  background: "#ffffff",
  border: "1.5px solid #e2e8f0",
  borderRadius: "8px",
  fontSize: "14px",
  color: "#0f172a",
  outline: "none",
  fontFamily: "inherit",
  transition: "border-color 0.15s, box-shadow 0.15s",
};
const onFocusStyle = (e: React.FocusEvent<HTMLInputElement>) => {
  e.target.style.borderColor = "#3b82f6";
  e.target.style.boxShadow = "0 0 0 3px rgba(59,130,246,0.18)";
};
const onBlurStyle = (e: React.FocusEvent<HTMLInputElement>) => {
  e.target.style.borderColor = "#e2e8f0";
  e.target.style.boxShadow = "none";
};

export default function OnboardingPage() {
  const router = useRouter();
  const ctx = useAppContext();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [buscandoRuc, setBuscandoRuc] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* Paso 1 */
  const [ruc, setRuc] = useState("");
  const [razonSocial, setRazonSocial] = useState("");
  const [nombreComercial, setNombreComercial] = useState("");
  const [direccionMatriz, setDireccionMatriz] = useState("");
  const [correoEmpresa, setCorreoEmpresa] = useState("");

  /* Paso 2 */
  const [sucursalCodigo, setSucursalCodigo] = useState("001");
  const [sucursalNombre, setSucursalNombre] = useState("Matriz");
  const [sucursalDireccion, setSucursalDireccion] = useState("");

  /* Paso 3 */
  const [puntoCodigo, setPuntoCodigo] = useState("001");
  const [puntoNombre, setPuntoNombre] = useState("Facturación Matriz");

  /* Paso 4 */
  const [cajaNombre, setCajaNombre] = useState("Caja Principal");

  /* Paso 5 */
  const [bodegaNombre, setBodegaNombre] = useState("Bodega General");

  useEffect(() => {
    if (step === 2 && !sucursalDireccion && direccionMatriz) {
      setSucursalDireccion(direccionMatriz);
    }
  }, [step, direccionMatriz, sucursalDireccion]);

  /* ── Consulta RUC ── */
  const consultarRuc = async () => {
    if (ruc.length !== 13) { setError("El RUC debe tener 13 dígitos"); return; }
    setBuscandoRuc(true); setError(null);
    try {
      const { data } = await api.get(`/empresas/buscar-ruc/${ruc}`);
      if (data?.empresa_sugerida) {
        setRazonSocial(data.empresa_sugerida.razon_social || "");
        setNombreComercial(data.empresa_sugerida.nombre_comercial || "");
        setDireccionMatriz(data.empresa_sugerida.direccion_matriz || "");
        setCorreoEmpresa(data.empresa_sugerida.correo || "");
      }
    } catch (e: any) {
      toast.danger(e.response?.data?.message || "RUC no encontrado. Completa manualmente.");
    } finally { setBuscandoRuc(false); }
  };

  const refrescarSesion = async () => {
    const rt = localStorage.getItem("factfast_refresh");
    if (!rt) return;
    try {
      const { data } = await api.post("/autenticacion/refrescar", { token_refresh: rt });
      localStorage.setItem("factfast_token", data.token_acceso);
      document.cookie = `token=${data.token_acceso}; path=/; max-age=604800; SameSite=Lax`;
    } catch {}
  };

  /* ── Paso handlers ── */
  const step1 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruc || !razonSocial || !direccionMatriz) { setError("Completa los campos con * antes de continuar"); return; }
    setLoading(true); setError(null);
    try {
      const { data } = await api.post("/empresas", {
        ruc, razon_social: razonSocial,
        nombre_comercial: nombreComercial || null,
        direccion_matriz: direccionMatriz,
        correo: correoEmpresa || null,
        regimen_tributario: "GENERAL", ambiente_sri: "PRUEBAS",
      });
      ctx.setEmpresa(data.id, data.razon_social, data.ruc);
      await refrescarSesion(); setStep(2);
    } catch (err: any) { toast.danger(err.response?.data?.message || "Error al registrar la empresa"); }
    finally { setLoading(false); }
  };

  const step2 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sucursalCodigo || !sucursalNombre || !sucursalDireccion) { setError("Completa todos los campos"); return; }
    setLoading(true); setError(null);
    try {
      const { data } = await api.post(`/empresas/${ctx.empresaId}/sucursales`, {
        codigo: sucursalCodigo, nombre: sucursalNombre, direccion: sucursalDireccion,
      });
      ctx.setSucursal(data.id, data.nombre); setStep(3);
    } catch (err: any) { toast.danger(err.response?.data?.message || "Error al crear la sucursal"); }
    finally { setLoading(false); }
  };

  const step3 = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
      const { data } = await api.post(`/sucursales/${ctx.sucursalId}/puntos-emision`, {
        codigo: puntoCodigo, nombre: puntoNombre,
      });
      ctx.setPuntoEmision(data.id); setStep(4);
    } catch (err: any) { toast.danger(err.response?.data?.message || "Error al crear el punto de emisión"); }
    finally { setLoading(false); }
  };

  const step4 = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
      const { data } = await api.post("/cajas", { nombre: cajaNombre, sucursal_id: ctx.sucursalId });
      ctx.setCaja(data.id, data.nombre); setStep(5);
    } catch (err: any) { toast.danger(err.response?.data?.message || "Error al crear la caja"); }
    finally { setLoading(false); }
  };

  const step5 = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
      const { data } = await api.post("/bodegas", { nombre: bodegaNombre, sucursal_id: ctx.sucursalId });
      ctx.setBodega(data.id, data.nombre); router.push("/pos");
    } catch (err: any) { toast.danger(err.response?.data?.message || "Error al crear la bodega"); }
    finally { setLoading(false); }
  };

  /* ── Títulos y descripciones por paso ── */
  const titulosPasos: Record<number, { titulo: string; desc: string }> = {
    1: { titulo: "Registra tu empresa", desc: "Ingresa el RUC para consultar los datos del SRI automáticamente." },
    2: { titulo: "Sucursal o establecimiento", desc: "Define el local o sucursal donde operas físicamente." },
    3: { titulo: "Punto de emisión", desc: "Identifica el punto de emisión para numerar tus comprobantes." },
    4: { titulo: "Caja de ventas", desc: "La caja te permite abrir turnos y registrar ventas del día." },
    5: { titulo: "Bodega de inventario", desc: "La bodega almacena y controla el stock de tus productos." },
  };

  return (
    /* ── FONDO: gris muy suave, como Xero/QuickBooks ── */
    <div style={{ minHeight: "100vh", background: "#f8fafc", display: "flex", flexDirection: "column" }}>

      {/* ── NAVBAR ── */}
      <nav style={{
        background: "#ffffff",
        borderBottom: "1px solid #e2e8f0",
        padding: "0 24px",
        height: "60px",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        position: "sticky",
        top: 0,
        zIndex: 50,
        boxShadow: "0 1px 3px rgba(15,23,42,0.06)",
      }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "var(--ff-brand)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(79,70,229,0.3)" }}>
            <Zap size={16} color="#ffffff" strokeWidth={2.5} />
          </div>
          <span style={{ fontSize: "18px", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.02em" }}>
            Fact<span style={{ color: "var(--ff-brand)" }}>Fast</span>
          </span>
        </div>
        <span style={{ fontSize: "13px", color: "#94a3b8", fontWeight: 500 }}>·</span>
        <span style={{ fontSize: "13px", color: "#64748b", fontWeight: 500 }}>Configuración inicial</span>
      </nav>

      {/* ── CONTENIDO ── */}
      <div style={{
        flex: 1,
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        padding: "40px 24px 60px",
      }}>
        <div style={{ width: "100%", maxWidth: "600px" }}>

          {/* ── BARRA DE PROGRESO ── */}
          <div style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "14px",
            padding: "20px 28px",
            marginBottom: "20px",
            boxShadow: "0 1px 3px rgba(15,23,42,0.06)",
          }} className="ff-fade-in">
            <div style={{ display: "flex", alignItems: "center" }}>
              {PASOS.map((p, idx) => {
                const Icono = p.icon;
                const done  = step > p.num;
                const active = step === p.num;
                return (
                  <div key={p.num} style={{ display: "flex", alignItems: "center", flex: idx < PASOS.length - 1 ? 1 : undefined }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
                      {/* Círculo */}
                      <div style={{
                        width: "40px",
                        height: "40px",
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: done ? "var(--ff-brand)" : active ? "#eff6ff" : "#f8fafc",
                        border: `2px solid ${done ? "var(--ff-brand)" : active ? "var(--ff-brand)" : "#e2e8f0"}`,
                        transition: "all 0.25s ease",
                      }}>
                        {done
                          ? <CheckCircle2 size={18} color="#ffffff" strokeWidth={2.5} />
                          : <Icono size={17} color={active ? "var(--ff-brand)" : "#94a3b8"} strokeWidth={2} />}
                      </div>
                      {/* Label */}
                      <span style={{
                        fontSize: "10.5px",
                        fontWeight: active ? 700 : done ? 600 : 400,
                        color: active ? "var(--ff-brand)" : done ? "#334155" : "#94a3b8",
                        whiteSpace: "nowrap",
                        letterSpacing: "0.01em",
                      }}>
                        {p.label}
                      </span>
                    </div>
                    {/* Línea conectora */}
                    {idx < PASOS.length - 1 && (
                      <div style={{
                        flex: 1,
                        height: "2px",
                        background: step > p.num ? "var(--ff-brand)" : "#e2e8f0",
                        margin: "0 6px",
                        marginBottom: "18px",
                        transition: "background 0.3s",
                        borderRadius: "1px",
                      }} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── CARD DEL PASO ACTUAL ── */}
          <div style={{
            background: "#ffffff",              /* SIEMPRE blanco */
            border: "1px solid #e2e8f0",
            borderRadius: "14px",
            padding: "36px 40px",
            boxShadow: "0 4px 12px rgba(15,23,42,0.08), 0 2px 4px rgba(15,23,42,0.05)",
          }} className="ff-fade-up" key={step}>

            {/* Encabezado del paso */}
            <div style={{ marginBottom: "28px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
                <span style={{
                  padding: "3px 10px",
                  background: "#eff6ff",
                  color: "#1d4ed8",
                  border: "1px solid #bfdbfe",
                  borderRadius: "99px",
                  fontSize: "11px",
                  fontWeight: 700,
                  letterSpacing: "0.04em",
                }}>
                  Paso {step} de {PASOS.length}
                </span>
              </div>
              <h1 style={{ fontSize: "20px", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.02em", marginBottom: "5px", lineHeight: 1.25 }}>
                {titulosPasos[step].titulo}
              </h1>
              <p style={{ fontSize: "13.5px", color: "#64748b", lineHeight: 1.6 }}>
                {titulosPasos[step].desc}
              </p>
            </div>

            {/* Error global */}
            {error && (
              <Alert status="danger" style={{ marginBottom: "20px" }}>
                <Alert.Indicator />
                <Alert.Content>
                  <Alert.Description>{error}</Alert.Description>
                </Alert.Content>
              </Alert>
            )}

            {/* ═══ FORMULARIOS POR PASO ═══ */}

            {/* PASO 1: Empresa */}
            {step === 1 && (
              <form onSubmit={step1} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>

                {/* RUC + Consultar */}
                <div>
                  <Label htmlFor="ob-ruc">RUC (13 dígitos) *</Label>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <input
                      id="ob-ruc"
                      type="text"
                      inputMode="numeric"
                      placeholder="0705871689001"
                      style={{ ...inputBase, flex: 1 }}
                      value={ruc}
                      onChange={(e) => setRuc(e.target.value.replace(/\D/g, "").slice(0, 13))}
                      onFocus={onFocusStyle}
                      onBlur={onBlurStyle}
                      maxLength={13}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onPress={consultarRuc}
                      isDisabled={buscandoRuc || ruc.length !== 13}
                      style={{
                        display: "flex", alignItems: "center", gap: "6px",
                        padding: "0 16px", height: "44px",
                        background: ruc.length === 13 ? "#eff6ff" : "#f8fafc",
                        border: `1.5px solid ${ruc.length === 13 ? "#bfdbfe" : "#e2e8f0"}`,
                        borderRadius: "8px", cursor: ruc.length === 13 ? "pointer" : "not-allowed",
                        fontSize: "13px", fontWeight: 600, color: ruc.length === 13 ? "#1d4ed8" : "#94a3b8",
                        whiteSpace: "nowrap", fontFamily: "inherit", transition: "all 0.15s",
                      }}
                    >
                      {buscandoRuc ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : <Search size={14} />}
                      Consultar SRI
                    </Button>
                  </div>
                  <p style={{ fontSize: "11.5px", color: "#94a3b8", marginTop: "5px" }}>
                    Consulta automática al SRI para autocompletar los datos de tu empresa
                  </p>
                </div>

                {/* Razón social */}
                <div>
                  <Label htmlFor="ob-razon">Razón social *</Label>
                  <input id="ob-razon" type="text" placeholder="MI EMPRESA S.A." style={inputBase}
                    value={razonSocial} onChange={(e) => setRazonSocial(e.target.value)} onFocus={onFocusStyle} onBlur={onBlurStyle} />
                </div>

                {/* Nombre comercial */}
                <div>
                  <Label htmlFor="ob-comercial">Nombre comercial</Label>
                  <input id="ob-comercial" type="text" placeholder="Mi Negocio" style={inputBase}
                    value={nombreComercial} onChange={(e) => setNombreComercial(e.target.value)} onFocus={onFocusStyle} onBlur={onBlurStyle} />
                  <p style={{ fontSize: "11.5px", color: "#94a3b8", marginTop: "4px" }}>Opcional — si es diferente a la razón social</p>
                </div>

                {/* Dirección */}
                <div>
                  <Label htmlFor="ob-dir">Dirección matriz *</Label>
                  <input id="ob-dir" type="text" placeholder="Av. Amazonas N24-123, Quito" style={inputBase}
                    value={direccionMatriz} onChange={(e) => setDireccionMatriz(e.target.value)} onFocus={onFocusStyle} onBlur={onBlurStyle} />
                </div>

                {/* Correo */}
                <div>
                  <Label htmlFor="ob-correo">Correo electrónico</Label>
                  <input id="ob-correo" type="email" placeholder="facturas@minegocio.com" style={inputBase}
                    value={correoEmpresa} onChange={(e) => setCorreoEmpresa(e.target.value)} onFocus={onFocusStyle} onBlur={onBlurStyle} />
                </div>

                <Button id="ob-paso1-submit" type="submit" variant="primary" isDisabled={loading} style={{ width: "100%", marginTop: "4px" }}>
                  {loading ? <><Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} /> Guardando...</>
                          : <>Guardar empresa <ChevronRight size={15} /></>}
                </Button>
              </form>
            )}

            {/* PASO 2: Sucursal */}
            {step === 2 && (
              <form onSubmit={step2} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                <div>
                  <Label htmlFor="ob-suc-cod">Código SRI (3 dígitos)</Label>
                  <input id="ob-suc-cod" type="text" placeholder="001" style={inputBase} value={sucursalCodigo}
                    onChange={(e) => setSucursalCodigo(e.target.value)} onFocus={onFocusStyle} onBlur={onBlurStyle} maxLength={3} />
                  <p style={{ fontSize: "11.5px", color: "#94a3b8", marginTop: "4px" }}>Código registrado en el SRI (ej: 001 para casa matriz)</p>
                </div>
                <div>
                  <Label htmlFor="ob-suc-nom">Nombre de la sucursal</Label>
                  <input id="ob-suc-nom" type="text" placeholder="Matriz Principal" style={inputBase} value={sucursalNombre}
                    onChange={(e) => setSucursalNombre(e.target.value)} onFocus={onFocusStyle} onBlur={onBlurStyle} />
                </div>
                <div>
                  <Label htmlFor="ob-suc-dir">Dirección</Label>
                  <input id="ob-suc-dir" type="text" placeholder="Av. Amazonas N24-123, Quito" style={inputBase} value={sucursalDireccion}
                    onChange={(e) => setSucursalDireccion(e.target.value)} onFocus={onFocusStyle} onBlur={onBlurStyle} />
                </div>
                <Button id="ob-paso2-submit" type="submit" variant="primary" isDisabled={loading} style={{ width: "100%", marginTop: "4px" }}>
                  {loading ? <><Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} /> Guardando...</>
                          : <>Crear sucursal <ChevronRight size={15} /></>}
                </Button>
              </form>
            )}

            {/* PASO 3: Punto de emisión */}
            {step === 3 && (
              <form onSubmit={step3} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                <div>
                  <Label htmlFor="ob-pto-cod">Código del punto (3 dígitos)</Label>
                  <input id="ob-pto-cod" type="text" placeholder="001" style={inputBase} value={puntoCodigo}
                    onChange={(e) => setPuntoCodigo(e.target.value)} onFocus={onFocusStyle} onBlur={onBlurStyle} maxLength={3} />
                  <p style={{ fontSize: "11.5px", color: "#94a3b8", marginTop: "4px" }}>El código del punto de emisión aparece en tus facturas: 001-001-000000001</p>
                </div>
                <div>
                  <Label htmlFor="ob-pto-nom">Nombre del punto</Label>
                  <input id="ob-pto-nom" type="text" placeholder="Punto de Emisión Matriz" style={inputBase} value={puntoNombre}
                    onChange={(e) => setPuntoNombre(e.target.value)} onFocus={onFocusStyle} onBlur={onBlurStyle} />
                </div>
                <Button id="ob-paso3-submit" type="submit" variant="primary" isDisabled={loading} style={{ width: "100%", marginTop: "4px" }}>
                  {loading ? <><Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} /> Guardando...</>
                          : <>Crear punto de emisión <ChevronRight size={15} /></>}
                </Button>
              </form>
            )}

            {/* PASO 4: Caja */}
            {step === 4 && (
              <form onSubmit={step4} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                <div>
                  <Label htmlFor="ob-caja-nom">Nombre de la caja</Label>
                  <input id="ob-caja-nom" type="text" placeholder="Caja Principal" style={inputBase} value={cajaNombre}
                    onChange={(e) => setCajaNombre(e.target.value)} onFocus={onFocusStyle} onBlur={onBlurStyle} />
                  <p style={{ fontSize: "11.5px", color: "#94a3b8", marginTop: "4px" }}>Puedes crear más cajas desde Configuración una vez que hayas iniciado</p>
                </div>
                <Button id="ob-paso4-submit" type="submit" variant="primary" isDisabled={loading} style={{ width: "100%", marginTop: "4px" }}>
                  {loading ? <><Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} /> Guardando...</>
                          : <>Crear caja <ChevronRight size={15} /></>}
                </Button>
              </form>
            )}

            {/* PASO 5: Bodega */}
            {step === 5 && (
              <form onSubmit={step5} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                <div>
                  <Label htmlFor="ob-bod-nom">Nombre de la bodega</Label>
                  <input id="ob-bod-nom" type="text" placeholder="Bodega General" style={inputBase} value={bodegaNombre}
                    onChange={(e) => setBodegaNombre(e.target.value)} onFocus={onFocusStyle} onBlur={onBlurStyle} />
                  <p style={{ fontSize: "11.5px", color: "#94a3b8", marginTop: "4px" }}>La bodega donde se descontará el stock al momento de vender</p>
                </div>

                {/* Bloque resumen antes de finalizar */}
                <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "16px 18px" }}>
                  <p style={{ fontSize: "12px", fontWeight: 700, color: "#64748b", letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: "10px" }}>Resumen de configuración</p>
                  {[
                    { label: "Empresa", val: ctx.empresaNombre || "—" },
                    { label: "Sucursal", val: ctx.sucursalNombre || "—" },
                    { label: "Caja", val: ctx.cajaNombre || "—" },
                  ].map((r) => (
                    <div key={r.label} style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", padding: "4px 0", borderBottom: "1px solid #f1f5f9" }}>
                      <span style={{ color: "#64748b" }}>{r.label}</span>
                      <span style={{ fontWeight: 600, color: "#0f172a" }}>{r.val}</span>
                    </div>
                  ))}
                </div>

                <Button id="ob-paso5-submit" type="submit" variant="primary" isDisabled={loading} style={{ width: "100%", marginTop: "4px", background: "#16a34a" }}>
                  {loading ? <><Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} /> Finalizando...</>
                          : <><CheckCircle2 size={16} /> Completar configuración</>}
                </Button>
              </form>
            )}
          </div>

          <p style={{ textAlign: "center", fontSize: "12px", color: "#94a3b8", marginTop: "16px" }}>
            Puedes modificar esta configuración en cualquier momento desde Configuración → Empresa.
          </p>
        </div>
      </div>
    </div>
  );
}
