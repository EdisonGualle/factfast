"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation } from "@tanstack/react-query";
import { Button, InputGroup, toast } from "@heroui/react";
import { api, decodificarJwt } from "../../../lib/api";
import { useAppContext } from "../../../store/app-context.store";
import { LogIn, Eye, EyeOff, Loader2, Mail, Lock } from "lucide-react";

const loginSchema = z.object({
  correo: z.string().email({ message: "Ingresa un correo válido" }),
  contrasena: z.string().min(8, { message: "Al menos 8 caracteres" }),
});
type LoginInput = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const setTenant = useAppContext((s) => s.setTenant);
  const setEmpresa = useAppContext((s) => s.setEmpresa);
  const setSucursal = useAppContext((s) => s.setSucursal);
  const setCaja = useAppContext((s) => s.setCaja);
  const setSesionCaja = useAppContext((s) => s.setSesionCaja);
  const setBodega = useAppContext((s) => s.setBodega);
  const setPuntoEmision = useAppContext((s) => s.setPuntoEmision);

  const [verPass, setVerPass] = useState(false);
  const [recordarme, setRecordarme] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const loginMutation = useMutation({
    meta: { skipErrorToast: true },
    mutationFn: async (data: LoginInput) => {
      const r = await api.post("/autenticacion/iniciar-sesion", { correo: data.correo, contrasena: data.contrasena });
      return r.data;
    },
    onSuccess: (data) => {
      localStorage.setItem("factfast_token", data.token_acceso);
      localStorage.setItem("factfast_refresh", data.token_refresh);
      document.cookie = `token=${data.token_acceso}; path=/; max-age=604800; SameSite=Lax`;
      const payload = decodificarJwt(data.token_acceso);
      if (payload) {
        if (payload.tenant_id) setTenant(payload.tenant_id, payload.tenant_nombre || "Negocio");
        if (payload.empresa_id) setEmpresa(payload.empresa_id, payload.empresa_nombre || "", payload.empresa_ruc || "");
        setSucursal("", ""); setCaja("", ""); setSesionCaja(null); setBodega("", ""); setPuntoEmision("");
        router.push(payload.empresa_id ? "/dashboard" : "/onboarding");
      }
    },
    onError: (error: unknown) => {
      const e = error as { response?: { data?: { message?: string }; status?: number }; message?: string };
      const status = e?.response?.status;
      if (status === 401) {
        toast.danger("Credenciales inválidas", { description: "Verifica tu correo y contraseña e inténtalo de nuevo.", timeout: 5000 });
      } else if (!status) {
        toast.danger("Sin conexión", { description: "No se pudo conectar con el servidor.", timeout: 5000 });
      } else {
        const descripcion = e?.response?.data?.message || e?.message || "Ocurrió un error inesperado.";
        toast.danger("Error al iniciar sesión", { description: descripcion, timeout: 5000 });
      }
    },
  });

  const onSubmit = (data: LoginInput) => {
    loginMutation.mutate(data);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 min-h-screen bg-white">
      {/* ── SECCIÓN IZQUIERDA: DISEÑO PREMIUM Y MOCKUP GENERADO (Solo desktop) ── */}
      <div className="hidden md:flex flex-col justify-center items-center p-12 bg-gradient-to-br from-indigo-50 via-purple-50 to-emerald-50 relative overflow-hidden select-none min-h-screen">
        
        {/* Adornos de fondo */}
        <div className="absolute -top-[10%] -left-[10%] w-[300px] h-[300px] rounded-full bg-[radial-gradient(circle,rgba(99,102,241,0.15)_0%,transparent_70%)] z-10" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[400px] h-[400px] rounded-full bg-[radial-gradient(circle,rgba(16,185,129,0.1)_0%,transparent_70%)] z-10" />

        {/* Contenedor principal alineado y centrado */}
        <div className="w-full max-w-[420px] flex flex-col justify-center z-10 relative gap-8">
          
          {/* Slogan */}
          <div className="w-full text-left">
            <h2 className="text-2xl md:text-3xl font-extrabold text-[#0b1f3b] leading-tight tracking-tight">
              Controla tu facturación electrónica en un solo lugar.
            </h2>
            <p className="text-sm md:text-base text-slate-500 mt-3 leading-relaxed">
              Emite facturas al SRI en segundos, gestiona cobros, controla el stock de tus bodegas y realiza cierres de caja sin contratiempos.
            </p>
          </div>

          {/* Captura de pantalla / Dashboard Mockup */}
          <div className="w-full aspect-[4/3] rounded-2xl overflow-hidden shadow-lg border border-slate-200/80 bg-white">
            <img 
              src="/dashboard-mockup.png" 
              alt="Dashboard de Facturación FactFast" 
              className="w-full h-full object-cover object-left-top select-none pointer-events-none"
            />
          </div>
        </div>
      </div>

      {/* ── SECCIÓN DERECHA: FORMULARIO DE INICIO DE SESIÓN ── */}
      <div className="flex flex-col justify-center items-center p-8 md:p-12 bg-white relative">
        <div className="w-full max-w-[420px] flex flex-col gap-8">
          
          {/* Header móvil / desktop */}
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl md:text-3xl font-extrabold text-[#0b1f3b] tracking-tight">
              Bienvenido de vuelta
            </h1>
            <p className="text-sm text-slate-500">
              ¿No tienes una cuenta?{" "}
              <Link href="/registro" className="text-(--ff-brand) font-semibold hover:underline no-underline">
                Regístrate gratis
              </Link>
            </p>
          </div>



          {/* Formulario */}
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
            
            {/* Correo Electrónico */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="login-correo" className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Correo Electrónico <span aria-hidden="true" className="text-red-400">*</span>
              </label>
              <InputGroup className={`px-1 border rounded-lg flex items-center bg-white h-11 transition-all focus-within:ring-2 focus-within:ring-(--ff-brand)/20 ${errors.correo ? "border-red-400" : "border-slate-200 focus-within:border-(--ff-brand)"}`}>
                <InputGroup.Prefix className="pl-3 pr-1.5 flex items-center shrink-0">
                  <Mail size={16} className="text-slate-400" />
                </InputGroup.Prefix>
                <input
                  id="login-correo"
                  type="email"
                  autoComplete="email"
                  placeholder="ejemplo@empresa.com"
                  className="w-full pl-1 bg-transparent border-0 focus:outline-none focus:ring-0 outline-none text-sm text-slate-800 placeholder-slate-400"
                  {...register("correo")}
                />
              </InputGroup>
              {errors.correo?.message && (
                <p className="text-xs text-red-500">{errors.correo.message}</p>
              )}
            </div>

            {/* Contraseña */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="login-contrasena" className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Contraseña <span aria-hidden="true" className="text-red-400">*</span>
              </label>
              <InputGroup className={`px-1 border rounded-lg flex items-center bg-white h-11 transition-all focus-within:ring-2 focus-within:ring-(--ff-brand)/20 ${errors.contrasena ? "border-red-400" : "border-slate-200 focus-within:border-(--ff-brand)"}`}>
                <InputGroup.Prefix className="pl-3 pr-1.5 flex items-center shrink-0">
                  <Lock size={16} className="text-slate-400" />
                </InputGroup.Prefix>
                <input
                  id="login-contrasena"
                  type={verPass ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="w-full pl-1 bg-transparent border-0 focus:outline-none focus:ring-0 outline-none text-sm text-slate-800 placeholder-slate-400"
                  {...register("contrasena")}
                />
                <InputGroup.Suffix className="pl-1.5 pr-3 flex items-center shrink-0">
                  <button
                    type="button"
                    onClick={() => setVerPass(!verPass)}
                    className="text-slate-400 hover:text-slate-600 p-1 rounded transition-colors"
                    aria-label={verPass ? "Ocultar contraseña" : "Mostrar contraseña"}
                  >
                    {verPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </InputGroup.Suffix>
              </InputGroup>
              {errors.contrasena?.message && (
                <p className="text-xs text-red-500">{errors.contrasena.message}</p>
              )}
            </div>

            {/* Fila Recordarme / Olvidaste Contraseña */}
            <div className="flex justify-between items-center text-xs md:text-sm">
              <label className="flex items-center gap-1.5 text-slate-500 cursor-pointer">
                <input
                  type="checkbox"
                  checked={recordarme}
                  onChange={(e) => setRecordarme(e.target.checked)}
                  className="cursor-pointer w-3.5 h-3.5 accent-[var(--ff-brand)]"
                />
                Recordarme
              </label>
              <Link href="/recuperar-contrasena" className="text-(--ff-brand) font-semibold hover:underline no-underline">
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

            {/* Botón de Enviar */}
            <Button 
              type="submit" 
              variant="primary"
              isDisabled={loginMutation.isPending} 
              className="w-full h-11 bg-(--ff-brand) hover:bg-(--ff-brand-dk) text-white font-semibold flex items-center justify-center gap-2 rounded-lg transition-colors"
            >
              {loginMutation.isPending ? (
                <><Loader2 size={15} className="animate-spin" /> Iniciando sesión...</>
              ) : (
                <><LogIn size={15} /> Iniciar Sesión</>
              )}
            </Button>
          </form>

          {/* Divisor "O" */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-[1px] bg-slate-200" />
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">o</span>
            <div className="flex-1 h-[1px] bg-slate-200" />
          </div>

          {/* Botón Stripe/Google (OAuth Mock) */}
          <Button
            type="button"
            variant="secondary"
            onPress={() => alert("Inicio de sesión corporativo integrado en producción.")}
            className="w-full h-11 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold flex items-center justify-center gap-2 rounded-lg transition-colors"
          >
            <div className="w-4.5 h-4.5 rounded bg-[#635bff] text-white text-xs font-black flex items-center justify-center">S</div>
            Iniciar sesión con Stripe
          </Button>

          {/* Botón Desbloquear Cuenta */}
          <div className="text-center">
            <Button
              onPress={() => alert("El servicio de desbloqueo de cuentas se ha enviado a tu administrador.")}
              className="bg-transparent border-none text-slate-400 text-xs cursor-pointer hover:text-slate-600 hover:underline p-1"
            >
              Desbloquear cuenta corporativa
            </Button>
          </div>

        </div>
      </div>
    </div>
  );
}
