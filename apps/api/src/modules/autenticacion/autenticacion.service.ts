import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'crypto';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { IniciarSesionDto } from './dto/iniciar-sesion.dto';
import { RegistroDto } from './dto/registro.dto';
import {
  RespuestaRegistroDto,
  RespuestaTokensDto,
} from './dto/respuestas-autenticacion.dto';

const RONDAS_BCRYPT = 12;
const DIAS_VIGENCIA_REFRESH = 7;
const MENSAJE_CREDENCIALES_INVALIDAS = 'Credenciales invalidas';

@Injectable()
export class AutenticacionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async registrar(dto: RegistroDto): Promise<RespuestaRegistroDto> {
    const existente = await this.prisma.usuario.findUnique({
      where: { correo: dto.correo },
      select: { id: true },
    });
    if (existente) {
      throw new ConflictException('El correo ya esta registrado');
    }

    const hash = await bcrypt.hash(dto.contrasena, RONDAS_BCRYPT);

    return this.prisma.usuario.create({
      data: {
        correo: dto.correo,
        hash_contrasena: hash,
        nombre_completo: dto.nombre_completo,
        rol: 'OWNER_TENANT',
      },
      select: { id: true, correo: true, nombre_completo: true, rol: true },
    });
  }

  async iniciarSesion(dto: IniciarSesionDto): Promise<RespuestaTokensDto> {
    const usuario = await this.prisma.usuario.findUnique({
      where: { correo: dto.correo, activo: true, deleted_at: null },
      select: {
        id: true,
        correo: true,
        rol: true,
        empresa_id: true,
        tenant_id: true,
        hash_contrasena: true,
      },
    });

    if (!usuario) {
      // No revelar si existe el correo (anti enumeracion)
      throw new UnauthorizedException(MENSAJE_CREDENCIALES_INVALIDAS);
    }

    const contrasenaValida = await bcrypt.compare(
      dto.contrasena,
      usuario.hash_contrasena,
    );
    if (!contrasenaValida) {
      throw new UnauthorizedException(MENSAJE_CREDENCIALES_INVALIDAS);
    }

    return this.emitirTokens(
      usuario.id,
      usuario.correo,
      usuario.rol,
      usuario.empresa_id,
      usuario.tenant_id,
    );
  }

  async refrescar(tokenRefreshCrudo: string): Promise<RespuestaTokensDto> {
    const hashToken = createHash('sha256')
      .update(tokenRefreshCrudo)
      .digest('hex');

    const almacenado = await this.prisma.tokenRefresh.findUnique({
      where: { hash_token: hashToken },
      include: { usuario: true },
    });

    if (
      !almacenado ||
      almacenado.revocado_en ||
      almacenado.expira_en < new Date()
    ) {
      throw new UnauthorizedException('Token de refresco invalido o expirado');
    }

    if (!almacenado.usuario.activo || almacenado.usuario.deleted_at) {
      throw new UnauthorizedException('Usuario inactivo');
    }

    // Rotacion: revocar el token anterior y emitir un nuevo par
    await this.prisma.tokenRefresh.update({
      where: { id: almacenado.id },
      data: { revocado_en: new Date() },
    });

    return this.emitirTokens(
      almacenado.usuario.id,
      almacenado.usuario.correo,
      almacenado.usuario.rol,
      almacenado.usuario.empresa_id,
      almacenado.usuario.tenant_id,
    );
  }

  async cerrarSesion(tokenRefreshCrudo: string): Promise<void> {
    const hashToken = createHash('sha256')
      .update(tokenRefreshCrudo)
      .digest('hex');
    await this.prisma.tokenRefresh.updateMany({
      where: { hash_token: hashToken, revocado_en: null },
      data: { revocado_en: new Date() },
    });
  }

  private async emitirTokens(
    usuarioId: string,
    correo: string,
    rol: string,
    empresaId: string | null,
    tenantId: string | null,
  ): Promise<RespuestaTokensDto> {
    const payload = {
      sub: usuarioId,
      correo,
      rol,
      empresa_id: empresaId,
      tenant_id: tenantId,
    };

    const tokenAcceso = this.jwt.sign(payload, {
      secret: this.config.get('app.jwt.accessSecret'),
      expiresIn: this.config.get('app.jwt.accessExpiresIn'),
    });

    const tokenRefreshCrudo = this.jwt.sign(payload, {
      secret: this.config.get('app.jwt.refreshSecret'),
      expiresIn: this.config.get('app.jwt.refreshExpiresIn'),
    });

    const hashToken = createHash('sha256')
      .update(tokenRefreshCrudo)
      .digest('hex');
    const expiraEn = new Date();
    expiraEn.setDate(expiraEn.getDate() + DIAS_VIGENCIA_REFRESH);

    await this.prisma.tokenRefresh.create({
      data: {
        usuario_id: usuarioId,
        hash_token: hashToken,
        expira_en: expiraEn,
      },
    });

    return {
      token_acceso: tokenAcceso,
      token_refresh: tokenRefreshCrudo,
    };
  }
}
