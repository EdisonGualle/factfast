import Link from "next/link";
import { Card, Chip } from "@heroui/react";
import { Zap, ShieldCheck, BarChart3, FileText, Store, Globe, ArrowRight, CheckCircle2 } from "lucide-react";

export const metadata = {
  title: "FactFast — Facturación Electrónica Ecuador",
  description: "Sistema SaaS ERP/POS de facturación electrónica para Ecuador. Emite comprobantes con el SRI en segundos, controla tu inventario y gestiona tus ventas.",
};

const features = [
  { icon: Zap,         title: "Factura en segundos",   desc: "Emite facturas electrónicas válidas para el SRI directamente desde tu POS sin complicaciones." },
  { icon: ShieldCheck, title: "Cumplimiento SRI",       desc: "Firma digital integrada, generación de XML y envío automático al Sistema de Rentas Internas." },
  { icon: BarChart3,   title: "Control de inventario", desc: "Gestión de bodegas, ajustes de stock, kardex y movimientos por sucursal en tiempo real." },
  { icon: Store,       title: "POS multisucursal",     desc: "Abre cajas, atiende clientes y cierra turnos con apertura y cierre de caja integrados." },
  { icon: Globe,       title: "Multi-empresa SaaS",    desc: "Cada negocio opera en su propio espacio aislado con Row-Level Security en PostgreSQL." },
  { icon: FileText,    title: "Catálogos completos",   desc: "Clientes, proveedores, productos, tarifas de IVA y puntos de emisión centralizados." },
];

const benefits = [
  "Sin instalación de software en equipos locales",
  "Actualización automática con nuevas resoluciones del SRI",
  "Acceso desde cualquier dispositivo con navegador",
  "Soporte para personas naturales y sociedades",
  "Exportación de documentos XML y PDF",
  "Plan trial 30 días sin tarjeta de crédito",
];

export default function HomePage() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#f1f5f9" }}>

      {/* ── Navbar ── */}
      <nav style={{ background: "#ffffff", borderBottom: "1px solid #e2e8f0", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 24px", height: "64px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: "34px", height: "34px", borderRadius: "8px", background: "#1a56db", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Zap size={18} color="#fff" strokeWidth={2.5} />
            </div>
            <span style={{ fontSize: "20px", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.02em" }}>
              Fact<span style={{ color: "#1a56db" }}>Fast</span>
            </span>
          </div>
          {/* Links */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Link href="/login" style={{ padding: "8px 14px", borderRadius: "8px", fontSize: "14px", fontWeight: 600, color: "#334155", textDecoration: "none" }}>
              Iniciar sesión
            </Link>
            <Link href="/registro" className="button button--primary button--sm" style={{ textDecoration: "none", height: "36px", padding: "0 16px", fontSize: "13px" }}>
              Comenzar gratis
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section style={{ background: "#ffffff", borderBottom: "1px solid #e2e8f0", padding: "80px 24px" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto", textAlign: "center" }}>
          <Chip
            color="accent"
            className="ff-fade-up"
            style={{ marginBottom: "20px", padding: "5px 14px", fontSize: "12px" }}
          >
            ⚡ Integrado con el SRI — Ecuador
          </Chip>

          <h1
            className="ff-fade-up-d1"
            style={{ fontSize: "clamp(36px, 6vw, 60px)", fontWeight: 900, lineHeight: 1.1, letterSpacing: "-0.03em", color: "#0f172a", marginBottom: "20px" }}
          >
            Facturación electrónica{" "}
            <span style={{ color: "#1a56db" }}>sin complicaciones</span>
          </h1>

          <p
            className="ff-fade-up-d2"
            style={{ fontSize: "18px", color: "#475569", maxWidth: "560px", margin: "0 auto 36px", lineHeight: 1.7 }}
          >
            Sistema SaaS ERP + POS diseñado para pymes ecuatorianas. Emite facturas
            válidas para el SRI en segundos, gestiona tu inventario y controla tus
            ventas desde cualquier dispositivo.
          </p>

          <div className="ff-fade-up-d3" style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/registro" className="button button--primary button--lg" style={{ textDecoration: "none", height: "48px", padding: "0 28px", fontSize: "15px" }}>
              Crear cuenta gratis <ArrowRight size={16} />
            </Link>
            <Link href="/login" className="button button--outline button--lg" style={{ textDecoration: "none", height: "48px", padding: "0 28px", fontSize: "15px" }}>
              Ya tengo cuenta
            </Link>
          </div>

          {/* Stats */}
          <div className="ff-fade-up-d3" style={{ display: "flex", gap: "48px", justifyContent: "center", marginTop: "56px", flexWrap: "wrap" }}>
            {[{ val: "< 3 seg", label: "por factura" }, { val: "100%", label: "SRI válido" }, { val: "Multi", label: "sucursal" }].map((s) => (
              <div key={s.label} style={{ textAlign: "center" }}>
                <div style={{ fontSize: "26px", fontWeight: 800, color: "#1a56db", letterSpacing: "-0.02em" }}>{s.val}</div>
                <div style={{ fontSize: "13px", color: "#64748b", marginTop: "2px" }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section style={{ maxWidth: "1200px", margin: "0 auto", padding: "64px 24px" }}>
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <h2 style={{ fontSize: "clamp(26px, 4vw, 36px)", fontWeight: 800, letterSpacing: "-0.02em", color: "#0f172a", marginBottom: "12px" }}>
            Todo lo que necesitas en un solo sistema
          </h2>
          <p style={{ color: "#64748b", fontSize: "16px", maxWidth: "480px", margin: "0 auto" }}>
            Desde la emisión de facturas hasta el control de tu bodega.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px" }}>
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <Card key={f.title} className="border border-slate-100 shadow-sm" style={{ padding: "28px" }}>
                <div style={{ width: "44px", height: "44px", borderRadius: "10px", background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "16px" }}>
                  <Icon size={20} color="#1a56db" strokeWidth={2} />
                </div>
                <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#0f172a", marginBottom: "8px" }}>{f.title}</h3>
                <p style={{ fontSize: "14px", color: "#64748b", lineHeight: 1.6 }}>{f.desc}</p>
              </Card>
            );
          })}
        </div>
      </section>

      {/* ── Benefits ── */}
      <section style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 24px 64px" }}>
        <Card className="border border-slate-100 shadow-sm" style={{ padding: "48px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "40px", alignItems: "center" }}>
          <div>
            <Chip color="accent" style={{ marginBottom: "16px" }}>Por qué FactFast</Chip>
            <h2 style={{ fontSize: "clamp(22px, 3vw, 30px)", fontWeight: 800, letterSpacing: "-0.02em", color: "#0f172a", marginBottom: "14px", lineHeight: 1.2 }}>
              Pensado para negocios ecuatorianos modernos
            </h2>
            <p style={{ color: "#64748b", fontSize: "15px", lineHeight: 1.7 }}>
              Sin configuraciones complicadas. Registra tu empresa con el RUC, configura tu sucursal y empieza a facturar en menos de 10 minutos.
            </p>
          </div>
          <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "12px" }}>
            {benefits.map((b) => (
              <li key={b} style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "14px", color: "#334155" }}>
                <CheckCircle2 size={17} color="#16a34a" strokeWidth={2.5} style={{ flexShrink: 0 }} />
                {b}
              </li>
            ))}
          </ul>
        </Card>
      </section>

      {/* ── CTA ── */}
      <section style={{ maxWidth: "1200px", margin: "0 auto 64px", padding: "0 24px", textAlign: "center" }}>
        <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "16px", padding: "56px 40px" }}>
          <h2 style={{ fontSize: "clamp(22px, 4vw, 36px)", fontWeight: 900, letterSpacing: "-0.03em", color: "#0f172a", marginBottom: "14px" }}>
            Comienza hoy sin compromiso
          </h2>
          <p style={{ fontSize: "16px", color: "#475569", marginBottom: "28px", maxWidth: "440px", margin: "0 auto 28px" }}>
            30 días de prueba gratis. Sin tarjeta de crédito.
          </p>
          <Link href="/registro" className="button button--primary button--lg" style={{ textDecoration: "none", height: "48px", padding: "0 32px", fontSize: "15px" }}>
            Crear mi cuenta gratis <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ background: "#ffffff", borderTop: "1px solid #e2e8f0", padding: "24px", textAlign: "center", color: "#94a3b8", fontSize: "13px" }}>
        © {new Date().getFullYear()} FactFast — Facturación electrónica para Ecuador. Cumplimiento SRI.
      </footer>
    </div>
  );
}
