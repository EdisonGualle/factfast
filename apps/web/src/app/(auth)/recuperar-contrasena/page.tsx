"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation } from "@tanstack/react-query";
import { Button, InputGroup, toast } from "@heroui/react";
import { api } from "../../../lib/api";
import { ArrowLeft, Mail, Loader2, CheckCircle2, ShieldCheck, KeyRound, RefreshCw } from "lucide-react";

const schema = z.object({
  correo: z.string().email({ message: "Ingresa un correo válido" }),
});
type Input = z.infer<typeof schema>;

export default function RecuperarContrasenaPage() {
  const [enviado, setEnviado] = useState(false);
  const [correoEnviado, setCorreoEnviado] = useState("");

  const { register, handleSubmit, getValues, formState: { errors } } = useForm<Input>({
    resolver: zodResolver(schema),
  });

  const recuperarMutation = useMutation({
    meta: { skipErrorToast: true },
    mutationFn: async (data: Input) => {
      await api.post("/autenticacion/recuperar-contrasena", { correo: data.correo });
      return data.correo;
    },
    onSuccess: (correo) => {
      setCorreoEnviado(correo);
      setEnviado(true);
    },
    onError: (error: unknown) => {
      const e = error as { response?: { data?: { message?: string }; status?: number }; message?: string };
      const status = e?.response?.status;
      if (!status) {
        toast.danger("Sin conexión", { description: "No se pudo conectar con el servidor.", timeout: 5000 });
      } else {
        const descripcion = e?.response?.data?.message || "Ocurrió un error inesperado.";
        toast.danger("Error", { description: descripcion, timeout: 5000 });
      }
    },
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 min-h-screen bg-white">

      {/* ── Izquierda: decorativa (igual que login) ── */}
      <div className="hidden md:flex flex-col justify-center items-center p-12 bg-linear-to-br from-indigo-50 via-purple-50 to-emerald-50 relative overflow-hidden select-none min-h-screen">
        <div className="absolute top-[-10%] left-[-10%] w-75 h-75 rounded-full bg-[radial-gradient(circle,rgba(99,102,241,0.15)_0%,transparent_70%)] z-10" />
        <div className="absolute bottom-[-10%] right-[-10%] w-100 h-100 rounded-full bg-[radial-gradient(circle,rgba(16,185,129,0.1)_0%,transparent_70%)] z-10" />

        <div className="w-full max-w-95 flex flex-col gap-10 z-10 relative">
          <div className="flex flex-col gap-4">
            <h2 className="text-2xl md:text-3xl font-extrabold text-(--ff-text-h) leading-tight tracking-tight">
              Recupera el acceso a tu cuenta en segundos.
            </h2>
            <p className="text-sm text-slate-500 leading-relaxed">
              Te enviaremos un enlace seguro a tu correo para restablecer tu contraseña sin perder ningún dato.
            </p>
          </div>

          {/* Pasos visuales */}
          <div className="flex flex-col gap-4">
            {[
              { icon: Mail, text: "Ingresa tu correo registrado" },
              { icon: ShieldCheck, text: "Recibe el enlace seguro en tu bandeja" },
              { icon: KeyRound, text: "Crea una nueva contraseña" },
            ].map(({ icon: Icon, text }, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white shadow-sm border border-slate-100 flex items-center justify-center shrink-0">
                  <Icon size={16} className="text-(--ff-brand)" />
                </div>
                <span className="text-sm text-slate-600">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Derecha: formulario ── */}
      <div className="flex flex-col justify-center items-center p-8 md:p-12 bg-white">
        <div className="w-full max-w-105 flex flex-col gap-8">

          {!enviado ? (
            <>
              {/* Header */}
              <div className="flex flex-col gap-2">
                <h1 className="text-2xl md:text-3xl font-extrabold text-(--ff-text-h) tracking-tight">
                  Recuperar contraseña
                </h1>
                <p className="text-sm text-slate-500">
                  ¿Recordaste tu contraseña?{" "}
                  <Link href="/login" className="text-(--ff-brand) font-semibold hover:underline no-underline">
                    Inicia sesión
                  </Link>
                </p>
              </div>

              {/* Formulario */}
              <form onSubmit={handleSubmit((d) => recuperarMutation.mutate(d))} className="flex flex-col gap-5">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="rec-correo" className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Correo electrónico <span aria-hidden="true" className="text-red-400">*</span>
                  </label>
                  <InputGroup className={`px-1 border rounded-lg flex items-center bg-white h-11 transition-all focus-within:ring-2 focus-within:ring-(--ff-brand)/20 ${errors.correo ? "border-red-400" : "border-slate-200 focus-within:border-(--ff-brand)"}`}>
                    <InputGroup.Prefix className="pl-3 pr-1.5 flex items-center shrink-0">
                      <Mail size={16} className="text-slate-400" />
                    </InputGroup.Prefix>
                    <input
                      id="rec-correo"
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

                <Button
                  type="submit"
                  variant="primary"
                  isDisabled={recuperarMutation.isPending}
                  className="w-full h-11 bg-(--ff-brand) hover:bg-(--ff-brand-dk) text-white font-semibold flex items-center justify-center gap-2 rounded-lg transition-colors"
                >
                  {recuperarMutation.isPending ? (
                    <><Loader2 size={14} className="animate-spin" /> Enviando...</>
                  ) : (
                    "Enviar instrucciones"
                  )}
                </Button>
              </form>

              {/* Footer */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-slate-200" />
                <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">o</span>
                <div className="flex-1 h-px bg-slate-200" />
              </div>

              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 font-medium no-underline transition-colors"
              >
                <ArrowLeft size={14} /> Volver a iniciar sesión
              </Link>
            </>
          ) : (
            /* Estado: correo enviado */
            <div className="ff-fade-in flex flex-col gap-8">
              <div className="flex flex-col gap-2">
                <h1 className="text-2xl md:text-3xl font-extrabold text-(--ff-text-h) tracking-tight">
                  Revisa tu correo
                </h1>
                <p className="text-sm text-slate-500">
                  Enviamos el enlace de recuperación a tu bandeja.
                </p>
              </div>

              <div className="flex flex-col items-center gap-6 py-4">
                <div className="w-16 h-16 rounded-2xl bg-(--ff-success-bg) flex items-center justify-center">
                  <CheckCircle2 size={32} className="text-(--ff-success)" />
                </div>
                <div className="text-center flex flex-col gap-1.5">
                  <p className="text-sm font-semibold text-(--ff-text-b)">
                    Enlace enviado a
                  </p>
                  <p className="text-sm text-(--ff-brand) font-bold">{correoEnviado}</p>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Si no aparece en unos minutos, revisa tu carpeta de spam.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => recuperarMutation.mutate({ correo: getValues("correo") })}
                disabled={recuperarMutation.isPending}
                className="inline-flex items-center justify-center gap-1.5 text-sm text-(--ff-brand) font-semibold hover:underline disabled:opacity-50 transition-opacity"
              >
                <RefreshCw size={13} className={recuperarMutation.isPending ? "animate-spin" : ""} />
                Reenviar correo
              </button>

              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-slate-200" />
              </div>

              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 font-medium no-underline transition-colors"
              >
                <ArrowLeft size={14} /> Volver a iniciar sesión
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
