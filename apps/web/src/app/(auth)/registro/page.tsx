"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation } from "@tanstack/react-query";
import { Button, InputGroup, Separator, toast } from "@heroui/react";
import { api, decodificarJwt } from "../../../lib/api";
import { useAppContext } from "../../../store/app-context.store";
import { UserPlus, Eye, EyeOff, Loader2, Zap, CheckCircle2 } from "lucide-react";

const schema = z.object({
  nombre: z.string().min(3, { message: "Mínimo 3 caracteres" }),
  slug: z.string().min(3).regex(/^[a-z0-9-]+$/, { message: "Solo minúsculas, números y guiones" }),
  nombreOwner: z.string().min(2, { message: "Ingresa tu nombre completo" }),
  correoOwner: z.string().email({ message: "Correo inválido" }),
  contrasenaOwner: z.string().min(8).regex(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: "Requiere mayúscula, minúscula y número",
  }),
});
type Input = z.infer<typeof schema>;

export default function RegistroPage() {
  const router = useRouter();
  const setTenant = useAppContext((s) => s.setTenant);
  const setEmpresa = useAppContext((s) => s.setEmpresa);
  const [verPass, setVerPass] = useState(false);
  const [slugOk, setSlugOk] = useState<boolean | null>(null);
  const [checkingSlug, setCheckingSlug] = useState(false);

  const { register, handleSubmit, setError, formState: { errors } } = useForm<Input>({
    resolver: zodResolver(schema),
  });

  const verificarSlug = async (slug: string) => {
    if (!slug || slug.length < 3 || !/^[a-z0-9-]+$/.test(slug)) {
      setSlugOk(null);
      return;
    }
    setCheckingSlug(true);
    try {
      const { data } = await api.get(`/tenants/validar-slug?slug=${slug}`);
      setSlugOk(data.disponible);
    } catch {
      setSlugOk(null);
    } finally {
      setCheckingSlug(false);
    }
  };

  const registroMutation = useMutation({
    meta: { skipErrorToast: true },
    mutationFn: async (data: Input) => {
      await api.post("/tenants/registro", {
        nombre: data.nombre,
        slug: data.slug,
        correoOwner: data.correoOwner,
        nombreOwner: data.nombreOwner,
        contrasenaOwner: data.contrasenaOwner,
      });
      const r = await api.post("/autenticacion/iniciar-sesion", {
        correo: data.correoOwner,
        contrasena: data.contrasenaOwner,
      });
      return r.data;
    },
    onSuccess: (data) => {
      localStorage.setItem("factfast_token", data.token_acceso);
      localStorage.setItem("factfast_refresh", data.token_refresh);
      document.cookie = `token=${data.token_acceso}; path=/; max-age=604800; SameSite=Lax`;
      const payload = decodificarJwt(data.token_acceso);
      if (payload) {
        if (payload.tenant_id) setTenant(payload.tenant_id, payload.tenant_nombre || "Negocio");
        setEmpresa("", "", "");
        router.push("/onboarding");
      }
    },
    onError: (error: unknown) => {
      const e = error as { response?: { data?: { message?: string }; status?: number }; message?: string };
      const status = e?.response?.status;
      const descripcion = e?.response?.data?.message || e?.message || "Ocurrió un error inesperado.";
      if (!status) {
        toast.danger("Sin conexión", { description: "No se pudo conectar con el servidor.", timeout: 5000 });
      } else if (status === 409) {
        toast.danger("Negocio ya registrado", { description: descripcion, timeout: 5000 });
      } else {
        toast.danger("Error al crear cuenta", { description: descripcion, timeout: 5000 });
      }
    },
  });

  const Field = ({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) => (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
        {label} <span aria-hidden="true" className="text-red-400">*</span>
      </label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-(--ff-bg)">
      <nav className="flex items-center justify-between h-[60px] px-6 bg-white border-b border-(--ff-border)">
        <Link href="/" className="flex items-center gap-2 no-underline">
          <div className="w-8 h-8 rounded-lg bg-(--ff-brand) flex items-center justify-center">
            <Zap size={16} color="#fff" strokeWidth={2.5} />
          </div>
          <span className="text-[17px] font-black text-(--ff-text-h) tracking-tight">
            Fact<span className="text-(--ff-brand)">Fast</span>
          </span>
        </Link>
        <span className="text-sm text-slate-500">
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="text-(--ff-brand) font-semibold hover:underline no-underline">
            Inicia sesión
          </Link>
        </span>
      </nav>

      <div className="flex-1 flex items-center justify-center p-8">
        <div className="ff-fade-up w-full max-w-[760px] bg-white rounded-2xl border border-(--ff-border) shadow-sm p-8 md:p-12 flex flex-col gap-8">

          <div className="flex flex-col gap-1.5">
            <h1 className="text-2xl font-extrabold text-(--ff-text-h) tracking-tight">
              Crea tu negocio en FactFast
            </h1>
            <p className="text-sm text-slate-500">
              Comienza a facturar electrónicamente en minutos — 30 días gratis
            </p>
          </div>

          <form
            onSubmit={handleSubmit((d) => {
              if (slugOk === false) {
                setError("slug", { type: "manual", message: "El identificador ya está en uso" });
                return;
              }
              registroMutation.mutate(d);
            })}
            className="flex flex-col gap-8"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

              {/* Columna 1 — Datos del negocio */}
              <div className="flex flex-col gap-5">
                <div className="border-b-2 border-(--ff-brand) pb-2">
                  <span className="text-xs font-bold text-(--ff-brand) uppercase tracking-wider">
                    1. Datos del negocio
                  </span>
                </div>

                <Field label="Nombre comercial" error={errors.nombre?.message}>
                  <InputGroup className={`px-1 border rounded-lg flex items-center bg-white h-11 transition-all focus-within:ring-2 focus-within:ring-(--ff-brand)/20 ${errors.nombre ? "border-red-400" : "border-(--ff-border) focus-within:border-(--ff-brand)"}`}>
                    <input
                      type="text"
                      placeholder="Mi Empresa S.A."
                      className="w-full px-3 bg-transparent border-0 focus:outline-none focus:ring-0 outline-none text-sm text-slate-800 placeholder-slate-400"
                      {...register("nombre")}
                    />
                  </InputGroup>
                </Field>

                <Field label="Identificador único (slug)" error={errors.slug?.message}>
                  <InputGroup className={`px-1 border rounded-lg flex items-center bg-white h-11 transition-all focus-within:ring-2 focus-within:ring-(--ff-brand)/20 ${errors.slug ? "border-red-400" : "border-(--ff-border) focus-within:border-(--ff-brand)"}`}>
                    <input
                      type="text"
                      placeholder="mi-empresa"
                      className="w-full pl-3 pr-24 bg-transparent border-0 focus:outline-none focus:ring-0 outline-none text-sm text-slate-800 placeholder-slate-400"
                      {...register("slug")}
                      onBlur={(e) => {
                        register("slug").onBlur(e);
                        verificarSlug(e.target.value);
                      }}
                    />
                    {checkingSlug && (
                      <InputGroup.Suffix className="pr-3 text-[11px] text-slate-400 shrink-0">
                        Verificando...
                      </InputGroup.Suffix>
                    )}
                    {!checkingSlug && slugOk !== null && (
                      <InputGroup.Suffix className={`pr-3 text-[11px] font-bold flex items-center gap-1 shrink-0 ${slugOk ? "text-emerald-600" : "text-rose-600"}`}>
                        {slugOk ? <><CheckCircle2 size={12} /> Disponible</> : "✕ En uso"}
                      </InputGroup.Suffix>
                    )}
                  </InputGroup>
                  <p className="text-[11px] text-slate-400 mt-0.5">Solo minúsculas, números y guiones (ej: mi-tienda)</p>
                </Field>
              </div>

              {/* Columna 2 — Cuenta de administrador */}
              <div className="flex flex-col gap-5">
                <div className="border-b-2 border-(--ff-brand) pb-2">
                  <span className="text-xs font-bold text-(--ff-brand) uppercase tracking-wider">
                    2. Cuenta de administrador
                  </span>
                </div>

                <Field label="Nombre completo" error={errors.nombreOwner?.message}>
                  <InputGroup className={`px-1 border rounded-lg flex items-center bg-white h-11 transition-all focus-within:ring-2 focus-within:ring-(--ff-brand)/20 ${errors.nombreOwner ? "border-red-400" : "border-(--ff-border) focus-within:border-(--ff-brand)"}`}>
                    <input
                      type="text"
                      placeholder="Juan Pérez"
                      className="w-full px-3 bg-transparent border-0 focus:outline-none focus:ring-0 outline-none text-sm text-slate-800 placeholder-slate-400"
                      {...register("nombreOwner")}
                    />
                  </InputGroup>
                </Field>

                <Field label="Correo electrónico" error={errors.correoOwner?.message}>
                  <InputGroup className={`px-1 border rounded-lg flex items-center bg-white h-11 transition-all focus-within:ring-2 focus-within:ring-(--ff-brand)/20 ${errors.correoOwner ? "border-red-400" : "border-(--ff-border) focus-within:border-(--ff-brand)"}`}>
                    <input
                      type="email"
                      autoComplete="email"
                      placeholder="juan@empresa.com"
                      className="w-full px-3 bg-transparent border-0 focus:outline-none focus:ring-0 outline-none text-sm text-slate-800 placeholder-slate-400"
                      {...register("correoOwner")}
                    />
                  </InputGroup>
                </Field>

                <Field label="Contraseña" error={errors.contrasenaOwner?.message}>
                  <InputGroup className={`px-1 border rounded-lg flex items-center bg-white h-11 transition-all focus-within:ring-2 focus-within:ring-(--ff-brand)/20 ${errors.contrasenaOwner ? "border-red-400" : "border-(--ff-border) focus-within:border-(--ff-brand)"}`}>
                    <input
                      type={verPass ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="••••••••"
                      className="w-full pl-3 pr-1 bg-transparent border-0 focus:outline-none focus:ring-0 outline-none text-sm text-slate-800 placeholder-slate-400"
                      {...register("contrasenaOwner")}
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
                </Field>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              isDisabled={registroMutation.isPending}
              className="w-full h-11 bg-(--ff-brand) hover:bg-(--ff-brand-dk) text-white font-semibold flex items-center justify-center gap-2 rounded-lg transition-colors"
            >
              {registroMutation.isPending ? (
                <><Loader2 size={14} className="animate-spin" /> Creando tu cuenta...</>
              ) : (
                <><UserPlus size={15} /> Crear cuenta y comenzar</>
              )}
            </Button>
          </form>

          <Separator />

          <p className="text-center text-sm text-slate-500">
            ¿Ya tienes cuenta?{" "}
            <Link href="/login" className="text-(--ff-brand) font-semibold hover:underline no-underline">
              Inicia sesión aquí
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
