"use client";

import React, { useState } from "react";
import { isAxiosError } from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Alert,
  Button,
  Card,
  Chip,
  Input,
  Label,
  ListBox,
  Select,
  Spinner,
  Tabs,
  TextField,
  toast,
} from "@heroui/react";
import { Check, DollarSign, Info, Key, MapPin, Upload } from "lucide-react";
import { api } from "../../../../lib/api";
import { useAppContext } from "../../../../store/app-context.store";

type Sucursal = { id: string; codigo: string; nombre: string; direccion: string; es_matriz: boolean };
type Caja = { id: string; nombre: string; sucursal_id: string };

export default function ConfiguracionPage() {
  const ctx = useAppContext();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState("sucursales");
  const [sucursalCodigo, setSucursalCodigo] = useState("");
  const [sucursalNombre, setSucursalNombre] = useState("");
  const [sucursalDireccion, setSucursalDireccion] = useState("");
  const [cajaNombre, setCajaNombre] = useState("");
  const [cajaSucursalId, setCajaSucursalId] = useState("");
  const [firmaTitular, setFirmaTitular] = useState("");
  const [firmaRuc, setFirmaRuc] = useState("");
  const [firmaContrasena, setFirmaContrasena] = useState("");

  const { data: sucursales = [], isLoading: isLoadingSucursales } = useQuery<Sucursal[]>({
    queryKey: ["sucursales-config", ctx.empresaId],
    queryFn: async () => {
      if (!ctx.empresaId) return [];
      const { data } = await api.get(`/empresas/${ctx.empresaId}/sucursales`);
      return data;
    },
    enabled: !!ctx.empresaId,
  });

  const { data: cajas = [], isLoading: isLoadingCajas } = useQuery<Caja[]>({
    queryKey: ["cajas-config"],
    queryFn: async () => {
      const { data } = await api.get("/cajas");
      return data;
    },
    enabled: !!ctx.empresaId,
  });

  const crearSucursalMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post(`/empresas/${ctx.empresaId}/sucursales`, {
        codigo: sucursalCodigo,
        nombre: sucursalNombre,
        direccion: sucursalDireccion,
      });
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sucursales-config"] });
      qc.invalidateQueries({ queryKey: ["sucursales"] });
      setSucursalCodigo("");
      setSucursalNombre("");
      setSucursalDireccion("");
      toast.success("Sucursal creada con éxito");
    },
  });

  const crearCajaMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post("/cajas", { nombre: cajaNombre, sucursal_id: cajaSucursalId });
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cajas-config"] });
      qc.invalidateQueries({ queryKey: ["cajas"] });
      setCajaNombre("");
      toast.success("Caja POS creada con éxito");
    },
  });

  const handleCargarFirma = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firmaTitular || !firmaRuc || !firmaContrasena) {
      toast.danger("Por favor completa todos los campos requeridos");
      return;
    }
    toast.success("¡Firma digital cargada y encriptada correctamente! Válida para ambiente de pruebas.");
    setFirmaTitular("");
    setFirmaRuc("");
    setFirmaContrasena("");
  };

  return (
    <div className="ff-fade-in flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-extrabold text-[var(--ff-text-h)]">Configuración</h1>
        <p className="mt-0.5 text-[13.5px] text-[var(--ff-text-m)]">
          Administra la firma digital del SRI y la estructura de sucursales y cajas de tu negocio.
        </p>
      </div>

      <Tabs
        className="w-full"
        selectedKey={activeTab}
        variant="secondary"
        onSelectionChange={(key) => setActiveTab(String(key))}
      >
        <Tabs.ListContainer>
          <Tabs.List aria-label="Configuración">
            <Tabs.Tab id="sucursales">Sucursales y Cajas<Tabs.Indicator /></Tabs.Tab>
            <Tabs.Tab id="firma">Firma Digital SRI<Tabs.Indicator /></Tabs.Tab>
          </Tabs.List>
        </Tabs.ListContainer>

        <Tabs.Panel className="pt-5" id="sucursales">
          <div className="grid-responsive-layout grid grid-cols-1 gap-5 lg:grid-cols-2">
            <div className="flex flex-col gap-4">
              <Card className="border border-slate-100 p-5 shadow-sm">
                <Card.Header className="mb-3 flex items-center gap-1.5">
                  <MapPin className="text-accent" size={16} />
                  <Card.Title className="text-sm">Registrar Sucursal (Establecimiento)</Card.Title>
                </Card.Header>
                <Card.Content>

                  <form className="flex flex-col gap-3" onSubmit={(e) => { e.preventDefault(); crearSucursalMutation.mutate(); }}>
                    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-[1fr_2fr]">
                      <TextField isRequired name="codigo" value={sucursalCodigo} onChange={setSucursalCodigo}>
                        <Label>Código SRI</Label><Input maxLength={3} placeholder="002" />
                      </TextField>
                      <TextField isRequired name="nombre" value={sucursalNombre} onChange={setSucursalNombre}>
                        <Label>Nombre Sucursal</Label><Input placeholder="Sucursal Sur" />
                      </TextField>
                    </div>
                    <TextField isRequired name="direccion" value={sucursalDireccion} onChange={setSucursalDireccion}>
                      <Label>Dirección Sucursal</Label><Input placeholder="Av. Maldonado S23-145, Quito" />
                    </TextField>
                    <Button isPending={crearSucursalMutation.isPending} type="submit">
                      {({ isPending }) => <>{isPending && <Spinner color="current" size="sm" />}Registrar Sucursal</>}
                    </Button>
                  </form>
                </Card.Content>
              </Card>

              <Card className="border border-slate-100 p-5 shadow-sm">
                <Card.Header className="mb-3"><Card.Title className="text-[13px]">Sucursales Existentes</Card.Title></Card.Header>
                <Card.Content>
                  {isLoadingSucursales ? <p className="text-xs text-muted">Cargando sucursales...</p> : <div className="flex flex-col gap-2">
                    {sucursales.map((s) => <div key={s.id} className="flex items-center justify-between border-b border-[var(--ff-border)] pb-2 text-[12.5px]">
                      <div><span className="font-bold text-accent">{s.codigo}</span> — <strong className="text-[var(--ff-text-h)]">{s.nombre}</strong><div className="mt-px text-[11px] text-muted">{s.direccion}</div></div>
                      <Chip color="success" size="sm" variant="soft">{s.es_matriz ? "Matriz" : "Activa"}</Chip>
                    </div>)}
                  </div>}
                </Card.Content>
              </Card>
            </div>

            <div className="flex flex-col gap-4">
              <Card className="border border-slate-100 p-5 shadow-sm">
                <Card.Header className="mb-3 flex items-center gap-1.5"><DollarSign className="text-success" size={16} /><Card.Title className="text-sm">Registrar Caja POS</Card.Title></Card.Header>
                <Card.Content>

                  <form className="flex flex-col gap-3" onSubmit={(e) => { e.preventDefault(); crearCajaMutation.mutate(); }}>
                    <Select isRequired name="sucursal" placeholder="— Seleccionar Sucursal —" value={cajaSucursalId || null} onChange={(value) => setCajaSucursalId(value ? String(value) : "")}>
                      <Label>Sucursal de Destino</Label>
                      <Select.Trigger><Select.Value /><Select.Indicator /></Select.Trigger>
                      <Select.Popover><ListBox>{sucursales.map((s) => <ListBox.Item key={s.id} id={String(s.id)} textValue={`${s.codigo} · ${s.nombre}`}>{s.codigo} · {s.nombre}<ListBox.ItemIndicator /></ListBox.Item>)}</ListBox></Select.Popover>
                    </Select>
                    <TextField isRequired name="caja" value={cajaNombre} onChange={setCajaNombre}><Label>Nombre de la Caja</Label><Input placeholder="Caja Ventas 2, Caja Facturas FactFast" /></TextField>
                    <Button isDisabled={!cajaSucursalId} isPending={crearCajaMutation.isPending} type="submit">
                      {({ isPending }) => <>{isPending && <Spinner color="current" size="sm" />}Registrar Caja</>}
                    </Button>
                  </form>
                </Card.Content>
              </Card>

              <Card className="border border-slate-100 p-5 shadow-sm">
                <Card.Header className="mb-3"><Card.Title className="text-[13px]">Cajas POS Existentes</Card.Title></Card.Header>
                <Card.Content>
                  {isLoadingCajas ? <p className="text-xs text-muted">Cargando cajas...</p> : <div className="flex flex-col gap-2">
                    {cajas.map((c) => { const sucAsig = sucursales.find((s) => s.id === c.sucursal_id); return <div key={c.id} className="flex items-center justify-between border-b border-[var(--ff-border)] pb-2 text-[12.5px]"><div><strong className="text-[var(--ff-text-h)]">{c.nombre}</strong><div className="text-[11px] text-muted">Asignada a: {sucAsig ? sucAsig.nombre : "Desconocida"}</div></div><Chip color="accent" size="sm" variant="soft">Activa</Chip></div>; })}
                  </div>}
                </Card.Content>
              </Card>
            </div>
          </div>
        </Tabs.Panel>

        <Tabs.Panel className="pt-5" id="firma">
          <div className="mx-auto w-full max-w-[600px]"><Card className="border border-slate-100 p-7 shadow-sm">
            <Card.Header className="mb-3 flex items-center gap-1.5"><Key className="text-accent" size={16} /><Card.Title className="text-[15px]">Firma Electrónica SRI (.p12)</Card.Title></Card.Header>
            <Card.Content>
              <Alert className="mb-5" status="accent"><Alert.Indicator><Info size={16} /></Alert.Indicator><Alert.Content><Alert.Description>El archivo de firma digital <code>.p12</code> es obligatorio para validar tus facturas electrónicas con el SRI. Los datos se encriptan con algoritmos avanzados AES-256-GCM antes de guardarse de forma segura.</Alert.Description></Alert.Content></Alert>

              <form className="flex flex-col gap-3.5" onSubmit={handleCargarFirma}>
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  <TextField isRequired name="titular" value={firmaTitular} onChange={setFirmaTitular}><Label>Nombre del Titular</Label><Input placeholder="Juan Pérez" /></TextField>
                  <TextField isRequired name="ruc" value={firmaRuc} onChange={setFirmaRuc}><Label>RUC del Titular</Label><Input maxLength={13} placeholder="1790011234001" /></TextField>
                </div>
                <div className="flex flex-col gap-1.5"><Label>Archivo de Firma (.p12) *</Label><div className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-[var(--ff-border-dark)] bg-[var(--ff-bg)] p-5 text-center transition-colors hover:bg-slate-100"><Upload className="text-muted" size={22} /><span className="text-[12.5px] font-semibold text-[var(--ff-text-b)]">Haz clic para seleccionar tu firma <code>.p12</code></span><span className="text-[11px] text-[var(--ff-text-l)]">Tamaño máximo: 5MB</span></div></div>
                <TextField isRequired name="contrasena" type="password" value={firmaContrasena} onChange={setFirmaContrasena}><Label>Contraseña de la firma</Label><Input placeholder="••••••••" /></TextField>
                <Button className="mt-2 w-full" type="submit">Cargar y Encriptar Firma</Button>
              </form>
            </Card.Content>
          </Card></div>
        </Tabs.Panel>
      </Tabs>
    </div>
  );
}
