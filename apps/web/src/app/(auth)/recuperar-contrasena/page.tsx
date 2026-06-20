"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Button, Card, TextField, Label, InputGroup, Separator } from "@heroui/react";
import { ArrowLeft, Mail, Loader2, CheckCircle2, Zap } from "lucide-react";

export default function RecuperarContrasenaPage() {
  const [correo, setCorreo] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!correo) return;
    setLoading(true);
    // Simular el envío del correo de recuperación
    setTimeout(() => {
      setLoading(false);
      setEnviado(true);
    }, 1500);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[var(--ff-bg)]">
      {/* Barra de navegación superior (Navbar) */}
      <nav className="flex items-center h-[60px] px-6 bg-white border-b border-slate-200">
        <Link href="/" className="flex items-center gap-2 no-underline">
          <div className="w-7.5 h-7.5 rounded-lg bg-[var(--ff-brand)] flex items-center justify-center">
            <Zap size={16} color="#fff" strokeWidth={2.5} />
          </div>
          <span className="text-[17px] font-black text-[#0b1f3b] tracking-tight">
            Fact<span className="text-[var(--ff-brand)]">Fast</span>
          </span>
        </Link>
      </nav>

      {/* Contenido principal */}
      <div className="flex-1 flex items-center justify-center p-8 md:p-12">
        <Card className="ff-fade-up w-full max-w-[420px] p-8 md:p-12 rounded-2xl flex flex-col gap-8">
          {!enviado ? (
            <>
              <div className="flex flex-col gap-1.5">
                <h1 className="text-xl md:text-2xl font-black text-[#0b1f3b] tracking-tight">
                  Recuperar contraseña
                </h1>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Ingresa tu correo electrónico registrado y te enviaremos las instrucciones para restablecer tu contraseña.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                <TextField isRequired className="flex flex-col gap-2">
                  <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Correo electrónico
                  </Label>
                  <InputGroup className="px-1 border border-slate-200 rounded-lg flex items-center bg-white h-11 focus-within:border-[var(--ff-brand)] focus-within:ring-2 focus-within:ring-[var(--ff-brand)]/20 transition-all">
                    <InputGroup.Prefix className="pl-3 pr-1.5 flex items-center justify-center shrink-0">
                      <Mail size={16} className="text-slate-400" />
                    </InputGroup.Prefix>
                    <InputGroup.Input
                      type="email"
                      required
                      placeholder="correo@ejemplo.com"
                      className="w-full pl-1 bg-transparent border-0 focus:outline-none focus:ring-0 outline-none text-sm text-slate-800 placeholder-slate-400"
                      value={correo}
                      onChange={(e) => setCorreo(e.target.value)}
                    />
                  </InputGroup>
                </TextField>

                <Button
                  type="submit"
                  variant="primary"
                  isDisabled={loading || !correo}
                  className="w-full h-11 bg-[var(--ff-brand)] hover:bg-[var(--ff-brand-dk)] text-white font-semibold flex items-center justify-center gap-2 rounded-lg transition-colors"
                >
                  {loading ? (
                    <>
                      <Loader2 size={14} className="animate-spin" /> Enviando...
                    </>
                  ) : (
                    "Enviar instrucciones"
                  )}
                </Button>
              </form>
            </>
          ) : (
            <div className="ff-fade-in flex flex-col items-center gap-4 text-center">
              <div className="w-12 h-12 rounded-full bg-[var(--ff-success-bg)] text-[var(--ff-success)] flex items-center justify-center">
                <CheckCircle2 size={24} />
              </div>
              <div>
                <h2 className="text-lg font-black text-[#0b1f3b] tracking-tight">Correo enviado</h2>
                <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">
                  Hemos enviado un enlace de restauración a <strong>{correo}</strong>. Por favor revisa tu bandeja de entrada o spam.
                </p>
              </div>
            </div>
          )}

          <Separator className="bg-slate-200" />

          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-1.5 text-xs md:text-sm text-[var(--ff-brand)] font-semibold hover:underline no-underline w-full"
          >
            <ArrowLeft size={14} /> Volver a iniciar sesión
          </Link>
        </Card>
      </div>
    </div>
  );
}
