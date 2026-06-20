import { Injectable, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { RolUsuario } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class TenantsService {
  constructor(private readonly prisma: PrismaService) {}

  async validateSlugAvailability(slug: string): Promise<{ disponible: boolean }> {
    const cleanSlug = slug.toLowerCase().trim();
    const existing = await this.prisma.tenant.findUnique({
      where: { slug: cleanSlug },
    });
    return { disponible: !existing };
  }

  async provisionTenant(dto: CreateTenantDto) {
    const slug = dto.slug.toLowerCase().trim();
    const email = dto.correoOwner.toLowerCase().trim();

    // 1. Validar disponibilidad del slug
    const { disponible } = await this.validateSlugAvailability(slug);
    if (!disponible) {
      throw new ConflictException(`El slug '${slug}' ya está en uso`);
    }

    // 2. Validar que el correo del fundador no esté registrado
    const existingUser = await this.prisma.usuario.findUnique({
      where: { correo: email },
    });
    if (existingUser) {
      throw new ConflictException('El correo del fundador ya está registrado en la plataforma');
    }

    // 3. Buscar el plan trial por defecto
    let planTrial = await this.prisma.plan.findUnique({
      where: { slug: 'trial' },
    });

    if (!planTrial) {
      // Si por alguna razón no existe, lo creamos dinámicamente
      planTrial = await this.prisma.plan.create({
        data: {
          nombre: 'Plan Trial (Prueba)',
          slug: 'trial',
          descripcion: 'Prueba de 30 días',
          precio_mensual: 0,
          max_empresas: 1,
          max_sucursales: 2,
          max_cajas: 2,
          max_usuarios: 3,
          max_comprobantes_mes: 50,
          max_productos: 100,
          max_bodegas: 2,
          activo: true,
        },
      });
    }

    // Hash de la contraseña del fundador
    const passwordHash = await bcrypt.hash(dto.contrasenaOwner, 12);

    // 4. Transacción atómica para aprovisionar el Tenant
    try {
      const result = await this.prisma.$transaction(async (tx) => {
        // A. Crear Tenant
        const tenant = await tx.tenant.create({
          data: {
            nombre: dto.nombre,
            slug: slug,
            activo: true,
          },
        });

        // B. Crear Usuario Fundador (OWNER_TENANT)
        const usuario = await tx.usuario.create({
          data: {
            tenant_id: tenant.id,
            correo: email,
            hash_contrasena: passwordHash,
            nombre_completo: dto.nombreOwner,
            rol: RolUsuario.OWNER_TENANT,
            activo: true,
          },
        });

        // C. Crear Suscripción Trial
        const fechaInicio = new Date();
        const fechaFin = new Date();
        fechaFin.setDate(fechaFin.getDate() + 30); // 30 días de prueba

        const suscripcion = await tx.suscripcion.create({
          data: {
            tenant_id: tenant.id,
            plan_id: planTrial.id,
            estado: 'TRIAL',
            fecha_inicio: fechaInicio,
            fecha_fin: fechaFin,
          },
        });

        return { tenant, usuario, suscripcion };
      });

      // No retornar el hash de la contraseña en la respuesta
      const { hash_contrasena, ...usuarioSinHash } = result.usuario;

      return {
        mensaje: 'Tenant aprovisionado correctamente',
        tenant: result.tenant,
        usuario: usuarioSinHash,
        suscripcion: result.suscripcion,
      };
    } catch (error) {
      throw new BadRequestException('Error en el aprovisionamiento del Tenant: ' + error.message);
    }
  }

  async findOne(id: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
      include: { suscripcion: { include: { plan: true } } },
    });
    if (!tenant) {
      throw new BadRequestException('Tenant no encontrado');
    }
    return tenant;
  }
}
