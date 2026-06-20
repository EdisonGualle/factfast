import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { CrearEmpresaDto } from './dto/crear-empresa.dto';
import { ActualizarEmpresaDto } from './dto/actualizar-empresa.dto';
import { EncryptionService } from '../certificados/encryption.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class EmpresasService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cifrado: EncryptionService,
  ) {}

  async crear(dto: CrearEmpresaDto, tenantId: string) {
    this.validarRuc(dto.ruc);

    try {
      return await this.prisma.$transaction(async (tx) => {
        const existente = await tx.empresa.findUnique({
          where: {
            tenant_id_ruc: {
              tenant_id: tenantId,
              ruc: dto.ruc,
            },
          },
        });
        if (existente) {
          throw new ConflictException(`El RUC ${dto.ruc} ya esta registrado en este tenant`);
        }

        const contrasenaCifrada = dto.sri_contrasena
          ? this.cifrado.encryptString(dto.sri_contrasena)
          : null;

        const nuevaEmpresa = await tx.empresa.create({
          data: {
            tenant_id: tenantId,
            ruc: dto.ruc,
            razon_social: dto.razon_social,
            nombre_comercial: dto.nombre_comercial,
            regimen_tributario: dto.regimen_tributario ?? 'GENERAL',
            ambiente_sri: dto.ambiente_sri ?? 'PRUEBAS',
            direccion_matriz: dto.direccion_matriz,
            telefono: dto.telefono,
            correo: dto.correo,
            numero_resolucion: dto.numero_resolucion,
            obligado_contabilidad: dto.obligado_contabilidad ?? false,
            sri_usuario: dto.sri_usuario,
            sri_contrasena_encriptada: contrasenaCifrada,
          },
        });

        // Vincular al usuario OWNER_TENANT fundador si no tiene empresa asignada
        const owner = await tx.usuario.findFirst({
          where: { tenant_id: tenantId, rol: 'OWNER_TENANT', empresa_id: null },
        });

        if (owner) {
          await tx.usuario.update({
            where: { id: owner.id },
            data: { empresa_id: nuevaEmpresa.id },
          });
        }

        return nuevaEmpresa;
      });
    } catch (error) {
      if (
        error instanceof ConflictException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      // P2002 = violación de unique constraint (RUC duplicado)
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException(`El RUC ${dto.ruc} ya está registrado. Inicia sesión con tu cuenta existente.`);
      }
      // Otros errores de Prisma — limpiar mensaje técnico
      const msg = error instanceof Error ? error.message : 'Error desconocido';
      const lines = msg.split('\n').map(l => l.trim()).filter(Boolean);
      const clean = lines[0] ? lines[0].replace(/\s+/g, ' ').slice(0, 200) : 'Error de base de datos';
      throw new BadRequestException(`Error al registrar la empresa: ${clean}`);
    }
  }

  async listar() {
    return this.prisma.empresa.findMany({
      where: { activo: true, deleted_at: null },
      orderBy: { razon_social: 'asc' },
    });
  }

  async obtenerUna(id: string) {
    const empresa = await this.prisma.empresa.findFirst({
      where: { id, activo: true, deleted_at: null },
      include: {
        sucursales: { where: { activo: true, deleted_at: null } },
      },
    });
    if (!empresa) {
      throw new NotFoundException(`Empresa ${id} no encontrada`);
    }
    return empresa;
  }

  async actualizar(id: string, dto: ActualizarEmpresaDto) {
    await this.obtenerUna(id);

    const data: any = {
      razon_social: dto.razon_social,
      nombre_comercial: dto.nombre_comercial,
      regimen_tributario: dto.regimen_tributario,
      ambiente_sri: dto.ambiente_sri,
      direccion_matriz: dto.direccion_matriz,
      telefono: dto.telefono,
      correo: dto.correo,
      numero_resolucion: dto.numero_resolucion,
      obligado_contabilidad: dto.obligado_contabilidad,
    };

    if (dto.sri_usuario !== undefined) {
      data.sri_usuario = dto.sri_usuario;
    }

    if (dto.sri_contrasena !== undefined) {
      data.sri_contrasena_encriptada = dto.sri_contrasena
        ? this.cifrado.encryptString(dto.sri_contrasena)
        : null;
    }

    return this.prisma.empresa.update({
      where: { id },
      data,
    });
  }

  async eliminar(id: string) {
    await this.obtenerUna(id);
    return this.prisma.empresa.update({
      where: { id },
      data: { activo: false, deleted_at: new Date() },
    });
  }

  /**
   * Validacion oficial de RUC ecuatoriano (Modulo 11).
   * Verifica codigo de provincia, tipo de contribuyente y digito verificador.
   */
  private validarRuc(ruc: string): void {
    if (!/^\d{13}$/.test(ruc)) {
      throw new BadRequestException('El RUC debe tener 13 digitos');
    }

    const provincia = parseInt(ruc.substring(0, 2), 10);
    if (provincia < 1 || provincia > 24) {
      throw new BadRequestException(
        'RUC invalido: codigo de provincia fuera de rango (01-24)',
      );
    }

    const tercerDigito = parseInt(ruc[2], 10);
    if (tercerDigito === 6) {
      this.validarRucPublico(ruc);
    } else if (tercerDigito === 9) {
      this.validarRucPrivado(ruc);
    } else if (tercerDigito >= 0 && tercerDigito <= 5) {
      this.validarRucPersonaNatural(ruc);
    } else {
      throw new BadRequestException('RUC invalido: tercer digito invalido');
    }

    if (!ruc.endsWith('001')) {
      throw new BadRequestException('El RUC debe terminar en 001');
    }
  }

  private validarRucPersonaNatural(ruc: string): void {
    const coeficientes = [2, 1, 2, 1, 2, 1, 2, 1, 2];
    const digitos = ruc.split('').map(Number);
    let suma = 0;
    for (let i = 0; i < 9; i++) {
      let val = digitos[i] * coeficientes[i];
      if (val >= 10) val -= 9;
      suma += val;
    }
    const verificador = suma % 10 === 0 ? 0 : 10 - (suma % 10);
    if (verificador !== digitos[9]) {
      throw new BadRequestException(
        'RUC invalido: digito verificador incorrecto para persona natural',
      );
    }
  }

  private validarRucPrivado(ruc: string): void {
    const coeficientes = [4, 3, 2, 7, 6, 5, 4, 3, 2];
    const digitos = ruc.split('').map(Number);
    const suma = digitos
      .slice(0, 9)
      .reduce((acc, d, i) => acc + d * coeficientes[i], 0);
    const residuo = suma % 11;
    const verificador = residuo === 0 ? 0 : 11 - residuo;
    if (verificador !== digitos[9]) {
      throw new BadRequestException(
        'RUC invalido: digito verificador incorrecto para sociedad privada',
      );
    }
  }

  private validarRucPublico(ruc: string): void {
    const coeficientes = [3, 2, 7, 6, 5, 4, 3, 2];
    const digitos = ruc.split('').map(Number);
    const suma = digitos
      .slice(0, 8)
      .reduce((acc, d, i) => acc + d * coeficientes[i], 0);
    const residuo = suma % 11;
    const verificador = residuo === 0 ? 0 : 11 - residuo;
    if (verificador !== digitos[8]) {
      throw new BadRequestException(
        'RUC invalido: digito verificador incorrecto para entidad publica',
      );
    }
  }
}
