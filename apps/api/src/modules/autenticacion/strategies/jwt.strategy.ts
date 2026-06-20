import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../infrastructure/database/prisma.service';

export interface PayloadJwt {
  sub: string;
  correo: string;
  rol: string;
  empresa_id: string | null;
  tenant_id: string | null;
  iat?: number;
  exp?: number;
}

export interface UsuarioAutenticado {
  id: string;
  correo: string;
  rol: string;
  empresa_id: string | null;
  tenant_id: string | null;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const secretoAcceso = config.get<string>('app.jwt.accessSecret');
    if (!secretoAcceso) {
      throw new Error('JWT_ACCESS_SECRET no esta configurado');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secretoAcceso,
    });
  }

  async validate(payload: PayloadJwt): Promise<UsuarioAutenticado> {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: payload.sub, activo: true, deleted_at: null },
      select: { id: true, correo: true, rol: true, empresa_id: true, tenant_id: true },
    });

    if (!usuario) {
      throw new UnauthorizedException('Usuario no encontrado o inactivo');
    }

    return {
      id: usuario.id,
      correo: usuario.correo,
      rol: usuario.rol,
      empresa_id: usuario.empresa_id,
      tenant_id: usuario.tenant_id,
    };
  }
}
