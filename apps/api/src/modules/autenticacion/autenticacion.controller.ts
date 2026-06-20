import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiNoContentResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiConflictResponse,
} from '@nestjs/swagger';
import { AutenticacionService } from './autenticacion.service';
import { IniciarSesionDto } from './dto/iniciar-sesion.dto';
import { RegistroDto } from './dto/registro.dto';
import { RefrescarTokenDto } from './dto/refrescar-token.dto';
import {
  RespuestaRegistroDto,
  RespuestaTokensDto,
} from './dto/respuestas-autenticacion.dto';
import { Publico } from '../../common/decorators/publico.decorator';

@ApiTags('Autenticacion')
@Controller('autenticacion')
export class AutenticacionController {
  constructor(private readonly autenticacion: AutenticacionService) {}

  @Publico()
  @Post('registro')
  @ApiOperation({
    summary: 'Registrar un nuevo usuario administrador',
    description:
      'Crea un usuario con rol ADMIN. Posteriormente un SUPERADMIN puede asignarle una empresa.',
  })
  @ApiCreatedResponse({
    type: RespuestaRegistroDto,
    description: 'Usuario creado correctamente',
  })
  @ApiConflictResponse({ description: 'El correo ya esta registrado' })
  @ApiBadRequestResponse({
    description: 'Error de validacion en los campos enviados',
  })
  registrar(@Body() dto: RegistroDto): Promise<RespuestaRegistroDto> {
    return this.autenticacion.registrar(dto);
  }

  @Publico()
  @Post('iniciar-sesion')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Iniciar sesion con correo y contrasena',
    description:
      'Retorna un token de acceso (15 min) y un token de refresco (7 dias). El token de refresco debe almacenarse de forma segura.',
  })
  @ApiOkResponse({
    type: RespuestaTokensDto,
    description: 'Inicio de sesion correcto',
  })
  @ApiUnauthorizedResponse({ description: 'Correo o contrasena invalidos' })
  @ApiBadRequestResponse({ description: 'Error de validacion' })
  iniciarSesion(@Body() dto: IniciarSesionDto): Promise<RespuestaTokensDto> {
    return this.autenticacion.iniciarSesion(dto);
  }

  @Publico()
  @Post('refrescar')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Renovar token de acceso',
    description:
      'Intercambia un token de refresco valido por un nuevo par de tokens. El token de refresco anterior queda revocado (rotacion).',
  })
  @ApiOkResponse({
    type: RespuestaTokensDto,
    description: 'Nuevo par de tokens emitido',
  })
  @ApiUnauthorizedResponse({
    description: 'Token de refresco invalido, expirado o revocado',
  })
  refrescar(@Body() dto: RefrescarTokenDto): Promise<RespuestaTokensDto> {
    return this.autenticacion.refrescar(dto.token_refresh);
  }

  @Post('cerrar-sesion')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Cerrar sesion y revocar token de refresco',
    description:
      'Revoca el token de refresco enviado. El token de acceso expira de forma natural.',
  })
  @ApiNoContentResponse({ description: 'Token revocado correctamente' })
  @ApiUnauthorizedResponse({
    description: 'Token de acceso ausente o invalido',
  })
  cerrarSesion(@Body() dto: RefrescarTokenDto): Promise<void> {
    return this.autenticacion.cerrarSesion(dto.token_refresh);
  }
}
