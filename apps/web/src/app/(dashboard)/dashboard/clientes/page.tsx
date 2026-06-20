"use client";

import React, { useState } from "react";
import { 
  Button, 
  Card, 
  TextField, 
  Label, 
  Input,
  InputGroup,
  Select,
  ListBox,
  Table,
  Modal,
  FieldError 
} from "@heroui/react";
import { useClientes, useCrearCliente } from "../../../../lib/hooks/use-clientes";
import { useAppContext } from "../../../../store/app-context.store";
import { Search, UserPlus, Mail, Phone, MapPin, Loader2, Check } from "lucide-react";

export default function ClientesPage() {
  const ctx = useAppContext();
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  // Formulario de creación
  const [tipoId, setTipoId] = useState("05"); // 05 = Cédula, 04 = RUC, 08 = Pasaporte, 07 = Consumidor Final
  const [identificacion, setIdentificacion] = useState("");
  const [razonSocial, setRazonSocial] = useState("");
  const [correo, setCorreo] = useState("");
  const [telefono, setTelefono] = useState("");
  const [direccion, setDireccion] = useState("");


  // Consulta de clientes mediante hook personalizado
  const { data: clientes = [], isLoading } = useClientes(ctx.empresaId);

  // Mutación de creación mediante hook personalizado
  const crearClienteMutation = useCrearCliente();

  const handleCrearCliente = (e: React.FormEvent) => {
    e.preventDefault();


    const payload = {
      empresa_id: ctx.empresaId,
      tipo_identificacion: tipoId,
      identificacion,
      razon_social: razonSocial,
      correo: correo || null,
      telefono: telefono || null,
      direccion: direccion || null,
    };

    crearClienteMutation.mutate(payload, {
      onSuccess: () => {
        setModalOpen(false);
        // Resetear campos
        setIdentificacion("");
        setRazonSocial("");
        setCorreo("");
        setTelefono("");
        setDireccion("");
      },
    });
  };

  // Filtrado de clientes en cliente
  const filtrados = clientes.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.razon_social.toLowerCase().includes(q) ||
      c.identificacion.includes(q)
    );
  });

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto p-4 md:p-6 ff-fade-in">
      
      {/* Encabezado */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Clientes</h1>
          <p className="text-sm text-slate-500 mt-1">
            Administra la cartera de clientes de tu empresa para la facturación electrónica.
          </p>
        </div>

        <Button
          variant="primary"
          onPress={() => setModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-[var(--ff-brand)] text-white hover:bg-[var(--ff-brand-dk)] transition-all font-semibold rounded-lg shadow-sm"
        >
          <UserPlus size={16} />
          Nuevo Cliente
        </Button>
      </div>

      {/* Buscador */}
      <Card className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
        <InputGroup className="px-1 border border-slate-200 rounded-lg flex items-center bg-white h-11 focus-within:border-[var(--ff-brand)] focus-within:ring-2 focus-within:ring-[var(--ff-brand)]/20 transition-all">
          <InputGroup.Prefix className="pl-3 pr-1.5 flex items-center justify-center shrink-0">
            <Search size={18} className="text-slate-400" />
          </InputGroup.Prefix>
          <InputGroup.Input
            type="text"
            placeholder="Buscar por Razón Social, Cédula o RUC..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-1 bg-transparent border-0 focus:outline-none focus:ring-0 outline-none text-sm text-slate-800 placeholder-slate-400"
          />
        </InputGroup>
      </Card>

      {/* Listado de Clientes */}
      <Card className="overflow-hidden border border-slate-200 rounded-xl shadow-sm bg-white">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-500">
            <Loader2 className="animate-spin text-[var(--ff-brand)]" size={32} />
            <span className="text-sm font-medium">Cargando clientes...</span>
          </div>
        ) : filtrados.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center text-slate-400">
            <UserPlus size={44} className="mb-4 text-slate-300" />
            <p className="text-base font-semibold text-slate-600">
              {search ? "No se encontraron clientes para tu búsqueda" : "Aún no tienes clientes registrados"}
            </p>
            <p className="text-sm text-slate-400 mt-1 max-w-sm">
              {search ? "Prueba ingresando otro término o limpia el buscador." : "Crea tu primer cliente haciendo clic en el botón de nuevo cliente."}
            </p>
          </div>
        ) : (
          <Table className="w-full border-collapse text-sm">
            <Table.ScrollContainer>
              <Table.Content aria-label="Listado de Clientes" className="min-w-[700px]">
                <Table.Header className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-100 text-left">
                  <Table.Column isRowHeader className="px-6 py-4">Identificación</Table.Column>
                  <Table.Column className="px-6 py-4">Nombre / Razón Social</Table.Column>
                  <Table.Column className="px-6 py-4">Contacto</Table.Column>
                  <Table.Column className="px-6 py-4">Dirección</Table.Column>
                </Table.Header>
                <Table.Body>
                  {filtrados.map((c) => (
                    <Table.Row 
                      key={c.id} 
                      className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors"
                    >
                      <Table.Cell className="px-6 py-4 text-slate-900 font-bold">
                        <div className="flex flex-col">
                          <span>{c.identificacion}</span>
                          <span className="text-xs text-slate-400 font-medium mt-0.5">
                            {c.tipo_identificacion === "04" ? "RUC" : c.tipo_identificacion === "05" ? "Cédula" : c.tipo_identificacion === "08" ? "Pasaporte" : "Consumidor Final"}
                          </span>
                        </div>
                      </Table.Cell>
                      <Table.Cell className="px-6 py-4 text-slate-800 font-semibold">
                        {c.razon_social}
                      </Table.Cell>
                      <Table.Cell className="px-6 py-4 text-slate-600">
                        <div className="flex flex-col gap-1 text-xs">
                          {c.correo && (
                            <span className="flex items-center gap-1.5 text-slate-500">
                              <Mail size={13} className="text-slate-400" /> {c.correo}
                            </span>
                          )}
                          {c.telefono && (
                            <span className="flex items-center gap-1.5 text-slate-500">
                              <Phone size={13} className="text-slate-400" /> {c.telefono}
                            </span>
                          )}
                          {!c.correo && !c.telefono && <span className="text-slate-400">—</span>}
                        </div>
                      </Table.Cell>
                      <Table.Cell className="px-6 py-4 text-slate-600">
                        {c.direccion ? (
                          <span className="flex items-center gap-1.5">
                            <MapPin size={14} className="text-slate-400 shrink-0" />
                            <span className="truncate max-w-[200px]">{c.direccion}</span>
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Content>
            </Table.ScrollContainer>
          </Table>
        )}
      </Card>

      {/* Modal para Registro de Clientes */}
      <Modal isOpen={modalOpen} onOpenChange={setModalOpen}>
        <Modal.Backdrop>
          <Modal.Container>
            <Modal.Dialog className="bg-white rounded-xl shadow-xl border border-slate-100 max-w-lg w-full">
            <Modal.CloseTrigger />
            
            <Modal.Header>
              <Modal.Heading className="text-lg font-bold text-slate-900">
                Registrar Nuevo Cliente
              </Modal.Heading>
            </Modal.Header>

            <Modal.Body className="p-6">


              <form onSubmit={handleCrearCliente} className="flex flex-col gap-4">
                
                {/* Tipo ID e Identificación */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tipo ID</Label>
                    <Select 
                      value={tipoId} 
                      onChange={(val) => setTipoId(val as string)}
                      className="w-full"
                    >
                      <Select.Trigger className="h-10 border border-slate-200 rounded-lg bg-white px-3 flex items-center justify-between text-sm">
                        <Select.Value />
                        <Select.Indicator />
                      </Select.Trigger>
                      <Select.Popover className="bg-white border border-slate-100 rounded-lg shadow-lg z-50">
                        <ListBox className="p-1">
                          <ListBox.Item id="05" textValue="Cédula" className="px-3 py-2 text-sm hover:bg-slate-50 rounded cursor-pointer">
                            Cédula
                          </ListBox.Item>
                          <ListBox.Item id="04" textValue="RUC" className="px-3 py-2 text-sm hover:bg-slate-50 rounded cursor-pointer">
                            RUC
                          </ListBox.Item>
                          <ListBox.Item id="08" textValue="Pasaporte" className="px-3 py-2 text-sm hover:bg-slate-50 rounded cursor-pointer">
                            Pasaporte
                          </ListBox.Item>
                          <ListBox.Item id="07" textValue="Consumidor Final" className="px-3 py-2 text-sm hover:bg-slate-50 rounded cursor-pointer">
                            Consumidor Final
                          </ListBox.Item>
                        </ListBox>
                      </Select.Popover>
                    </Select>
                  </div>

                  <TextField isRequired className="flex flex-col gap-1.5">
                    <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Identificación</Label>
                    <Input
                      type="text"
                      placeholder="9999999999"
                      value={identificacion}
                      onChange={(e) => setIdentificacion(e.target.value)}
                      className="h-10 px-3 border border-slate-200 rounded-lg text-sm focus-visible:border-[var(--ff-brand)] focus-visible:ring-2 focus-visible:ring-[var(--ff-brand)]/20 outline-none w-full"
                    />
                    <FieldError className="text-xs text-red-500" />
                  </TextField>
                </div>

                {/* Razón Social */}
                <TextField isRequired className="flex flex-col gap-1.5">
                  <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Nombre o Razón Social</Label>
                  <Input
                    type="text"
                    placeholder="Juan Pérez o Distribuidora S.A."
                    value={razonSocial}
                    onChange={(e) => setRazonSocial(e.target.value)}
                    className="h-10 px-3 border border-slate-200 rounded-lg text-sm focus-visible:border-[var(--ff-brand)] focus-visible:ring-2 focus-visible:ring-[var(--ff-brand)]/20 outline-none w-full"
                  />
                  <FieldError className="text-xs text-red-500" />
                </TextField>

                {/* Correo y Teléfono */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <TextField className="flex flex-col gap-1.5">
                    <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Correo Electrónico</Label>
                    <Input
                      type="email"
                      placeholder="cliente@correo.com"
                      value={correo}
                      onChange={(e) => setCorreo(e.target.value)}
                      className="h-10 px-3 border border-slate-200 rounded-lg text-sm focus-visible:border-[var(--ff-brand)] focus-visible:ring-2 focus-visible:ring-[var(--ff-brand)]/20 outline-none w-full"
                    />
                  </TextField>

                  <TextField className="flex flex-col gap-1.5">
                    <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Teléfono</Label>
                    <Input
                      type="text"
                      placeholder="0999999999"
                      value={telefono}
                      onChange={(e) => setTelefono(e.target.value)}
                      className="h-10 px-3 border border-slate-200 rounded-lg text-sm focus-visible:border-[var(--ff-brand)] focus-visible:ring-2 focus-visible:ring-[var(--ff-brand)]/20 outline-none w-full"
                    />
                  </TextField>
                </div>

                {/* Dirección */}
                <TextField className="flex flex-col gap-1.5">
                  <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Dirección</Label>
                  <Input
                    type="text"
                    placeholder="Av. 10 de Agosto, Quito"
                    value={direccion}
                    onChange={(e) => setDireccion(e.target.value)}
                    className="h-10 px-3 border border-slate-200 rounded-lg text-sm focus-visible:border-[var(--ff-brand)] focus-visible:ring-2 focus-visible:ring-[var(--ff-brand)]/20 outline-none w-full"
                  />
                </TextField>

                {/* Botones del pie de modal */}
                <Modal.Footer className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
                  <Button
                    type="button"
                    onPress={() => setModalOpen(false)}
                    className="h-10 px-4 border border-slate-200 rounded-lg text-sm font-semibold hover:bg-slate-50 text-slate-700 transition-colors"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    isDisabled={crearClienteMutation.isPending}
                    className="h-10 px-4 bg-[var(--ff-brand)] hover:bg-[var(--ff-brand-dk)] text-white rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                  >
                    {crearClienteMutation.isPending ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Check size={16} />
                    )}
                    Registrar
                  </Button>
                </Modal.Footer>

              </form>
            </Modal.Body>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  </div>
  );
}
