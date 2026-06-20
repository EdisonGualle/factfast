"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { api, decodificarJwt } from "../../../lib/api";
import { useAppContext } from "../../../store/app-context.store";
import { Alert, Button, Card, Description, FieldError, InputGroup, Label, Separator, TextField } from "@heroui/react";
import { UserPlus, Eye, EyeOff, Loader2, Zap, CheckCircle2 } from "lucide-react";

// Esquema de validacion del formulario de registro
const schema = z.object({
  nombre: z.string().min(3, { message: "Minimo 3 caracteres" }),
  slug: z.string().min(3).regex(/^[a-z0-9-]+$/, { message: "Solo minusculas, numeros y guiones" }),
  nombreOwner: z.string().min(2, { message: "Ingresa tu nombre completo" }),
  correoOwner: z.string().email({ message: "Correo invalido" }),
  contrasenaOwner: z.string().min(8).regex(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, { message: "Requiere mayuscula, minuscula y numero" }),
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

  // Verifica la disponibilidad del identificador unico del negocio (slug)
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

  // Mutacion para el registro e inicio de sesion automatico
  const registroMutation = useMutation({
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
        if (payload.tenant_id) {
          setTenant(payload.tenant_id, payload.tenant_nombre || "Negocio");
        }
        setEmpresa("", "", "");
        router.push("/onboarding");
      }
    },

  });

  return (
    <div className="flex flex-col min-h-screen bg-[var(--ff-bg)]">
      {/* Barra de navegacion superior (Navbar) */}
      <nav className="flex items-center justify-between h-[60px] px-6 bg-white border-b border-slate-200">
        <Link href="/" className="flex items-center gap-2 no-underline">
          <div className="w-7.5 h-7.5 rounded-lg bg-[var(--ff-brand)] flex items-center justify-center">
            <Zap size={16} color="#fff" strokeWidth={2.5} />
          </div>
          <span className="text-[17px] font-black text-[#0b1f3b] tracking-tight">
            Fact<span className="text-[var(--ff-brand)]">Fast</span>
          </span>
        </Link>
        <span className="text-xs md:text-sm text-slate-500">
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="text-[var(--ff-brand)] font-semibold hover:underline no-underline">
            Inicia sesion
          </Link>
        </span>
      </nav>

      {/* Contenido principal */}
      <div className="flex-1 flex items-center justify-center p-8 md:p-12">
        <Card className="ff-fade-up w-full max-w-[720px] p-8 md:p-12 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-8">
          <Card.Header className="flex flex-col gap-1.5">
            <Card.Title className="text-xl md:text-2xl font-black text-[#0b1f3b] tracking-tight">
              Crea tu negocio en FactFast
            </Card.Title>
            <Card.Description className="text-sm text-slate-500">
              Comienza a facturar electronicamente en minutos -- 30 dias gratis
            </Card.Description>
          </Card.Header>



          <Card.Content className="p-0">
            <form
            onSubmit={handleSubmit((d) => {
              if (slugOk === false) {
                setError("slug", { type: "manual", message: "El identificador ya esta en uso" });
                return;
              }
              registroMutation.mutate(d);
            })}
              className="flex flex-col gap-8"
            >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Columna 1: Informacion de Negocio */}
              <div>
                <div className="border-b-2 border-[var(--ff-brand)] pb-2.5 mb-5">
                  <span className="text-xs font-bold text-[var(--ff-brand)] uppercase tracking-wider">
                    1. Datos del Negocio
                  </span>
                </div>
                <div className="flex flex-col gap-5">
                  <TextField fullWidth isRequired isInvalid={!!errors.nombre} className="flex flex-col gap-2">
                    <Label className="!mb-0 text-xs font-semibold text-slate-500 uppercase tracking-wider">Nombre comercial</Label>
                    <InputGroup className="h-11">
                      <InputGroup.Input
                      id="reg-nombre"
                      type="text"
                      placeholder="Mi Empresa S.A."
                      className="px-3"
                      {...register("nombre")}
                      />
                    </InputGroup>
                    {errors.nombre && (
                      <FieldError className="mt-1 text-xs">{errors.nombre.message}</FieldError>
                    )}
                  </TextField>

                  <TextField fullWidth isRequired isInvalid={!!errors.slug} className="flex flex-col gap-2">
                    <Label className="!mb-0 text-xs font-semibold text-slate-500 uppercase tracking-wider">Identificador unico (slug)</Label>
                    <InputGroup className="h-11">
                      <InputGroup.Input
                        id="reg-slug"
                        type="text"
                        placeholder="mi-empresa"
                        className="pl-3 pr-24"
                        {...register("slug")}
                        onBlur={(e) => {
                          register("slug").onBlur(e);
                          verificarSlug(e.target.value);
                        }}
                      />
                      {checkingSlug && (
                        <InputGroup.Suffix className="absolute right-3 text-[11px] text-slate-400">
                          Verificando...
                        </InputGroup.Suffix>
                      )}
                      {!checkingSlug && slugOk !== null && (
                        <InputGroup.Suffix
                          className={`absolute right-3 text-[11px] font-bold flex items-center gap-1 ${
                            slugOk ? "text-emerald-600" : "text-rose-600"
                          }`}
                        >
                          {slugOk ? (
                            <>
                              <CheckCircle2 size={12} /> Disponible
                            </>
                          ) : (
                            "x En uso"
                          )}
                        </InputGroup.Suffix>
                      )}
                    </InputGroup>
                    {errors.slug && (
                      <FieldError className="mt-1 text-xs">{errors.slug.message}</FieldError>
                    )}
                    <Description className="text-[11px] text-slate-400">
                      Solo minusculas, numeros y guiones (ej: mi-tienda)
                    </Description>
                  </TextField>
                </div>
              </div>

              {/* Columna 2: Cuenta del Administrador */}
              <div>
                <div className="border-b-2 border-[var(--ff-brand)] pb-2.5 mb-5">
                  <span className="text-xs font-bold text-[var(--ff-brand)] uppercase tracking-wider">
                    2. Cuenta de administrador
                  </span>
                </div>
                <div className="flex flex-col gap-5">
                  <TextField fullWidth isRequired isInvalid={!!errors.nombreOwner} className="flex flex-col gap-2">
                    <Label className="!mb-0 text-xs font-semibold text-slate-500 uppercase tracking-wider">Nombre completo</Label>
                    <InputGroup className="h-11">
                      <InputGroup.Input
                      id="reg-nombreOwner"
                      type="text"
                      placeholder="Juan Perez"
                      className="px-3"
                      {...register("nombreOwner")}
                      />
                    </InputGroup>
                    {errors.nombreOwner && (
                      <FieldError className="mt-1 text-xs">{errors.nombreOwner.message}</FieldError>
                    )}
                  </TextField>

                  <TextField fullWidth isRequired isInvalid={!!errors.correoOwner} className="flex flex-col gap-2">
                    <Label className="!mb-0 text-xs font-semibold text-slate-500 uppercase tracking-wider">Correo electronico</Label>
                    <InputGroup className="h-11">
                      <InputGroup.Input
                      id="reg-correo"
                      type="email"
                      placeholder="juan@empresa.com"
                      className="px-3"
                      {...register("correoOwner")}
                      />
                    </InputGroup>
                    {errors.correoOwner && (
                      <FieldError className="mt-1 text-xs">{errors.correoOwner.message}</FieldError>
                    )}
                  </TextField>

                  <TextField fullWidth isRequired isInvalid={!!errors.contrasenaOwner} className="flex flex-col gap-2">
                    <Label className="!mb-0 text-xs font-semibold text-slate-500 uppercase tracking-wider">Contrasena</Label>
                    <InputGroup className="h-11">
                      <InputGroup.Input
                        id="reg-contrasena"
                        type={verPass ? "text" : "password"}
                        placeholder="••••••••"
                        className="pl-3 pr-10"
                        {...register("contrasenaOwner")}
                      />
                      <InputGroup.Suffix className="absolute right-1">
                      <Button
                        type="button"
                        onPress={() => setVerPass(!verPass)}
                        variant="ghost"
                        isIconOnly
                        size="sm"
                        className="text-slate-400"
                        aria-label="Ver contrasena"
                      >
                        {verPass ? <EyeOff size={16} /> : <Eye size={16} />}
                      </Button>
                      </InputGroup.Suffix>
                    </InputGroup>
                    {errors.contrasenaOwner && (
                      <FieldError className="mt-1 text-xs">{errors.contrasenaOwner.message}</FieldError>
                    )}
                  </TextField>
                </div>
              </div>
            </div>

            <Button
              id="reg-submit"
              type="submit"
              variant="primary"
              fullWidth
              isDisabled={registroMutation.isPending}
              className="h-11"
            >
              {registroMutation.isPending ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> Creando tu cuenta...
                </>
              ) : (
                <>
                  <UserPlus size={15} /> Crear cuenta y comenzar
                </>
              )}
            </Button>
            </form>
          </Card.Content>

          <Separator />
          <Card.Footer className="p-0">
            <p className="w-full text-center text-xs md:text-sm text-slate-500">
            ¿Ya tienes cuenta?{" "}
            <Link
              href="/login"
              className="text-[var(--ff-brand)] font-semibold hover:underline no-underline"
            >
              Inicia sesion aqui
            </Link>
            </p>
          </Card.Footer>
        </Card>
      </div>
    </div>
  );
}
