import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UploadedFile,
  UseInterceptors,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import { CertificadosService } from './certificados.service';
import { SubirCertificadoDto } from './dto/subir-certificado.dto';
import { RespuestaCertificadoDto } from './dto/respuesta-certificado.dto';
import { ApiAuthResponses } from '../../common/swagger/api-responses.decorator';

@ApiTags('Certificados')
@ApiBearerAuth('access-token')
@ApiAuthResponses()
@Controller('empresas/:empresaId/certificados')
export class CertificadosController {
  constructor(private readonly certificados: CertificadosService) {}

  @Post()
  @ApiOperation({
    summary: 'Subir certificado digital (.p12)',
    description:
      'Carga y almacena un certificado .p12 cifrado con AES-256-GCM. ' +
      'El archivo y la contrasena nunca se almacenan en texto plano. ' +
      'Al subir un nuevo certificado, el anterior se desactiva automaticamente. ' +
      'El certificado no debe estar expirado.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['archivo', 'contrasena'],
      properties: {
        archivo: {
          type: 'string',
          format: 'binary',
          description: 'Archivo de certificado .p12 (maximo 1 MB)',
        },
        contrasena: {
          type: 'string',
          description: 'Contrasena del certificado',
        },
      },
    },
  })
  @ApiCreatedResponse({
    type: RespuestaCertificadoDto,
    description: 'Certificado cargado y cifrado correctamente',
  })
  @ApiBadRequestResponse({
    description:
      'Archivo .p12 invalido, contrasena incorrecta o certificado expirado',
  })
  @UseInterceptors(
    FileInterceptor('archivo', {
      storage: memoryStorage(),
      limits: { fileSize: 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        if (!file.originalname.toLowerCase().endsWith('.p12')) {
          return cb(new Error('Solo se aceptan archivos .p12'), false);
        }
        cb(null, true);
      },
    }),
  )
  subir(
    @Param('empresaId', ParseUUIDPipe) empresaId: string,
    @UploadedFile() archivo: Express.Multer.File,
    @Body() dto: SubirCertificadoDto,
  ) {
    return this.certificados.subir(empresaId, archivo, dto.contrasena);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar certificados de una empresa',
    description:
      'Retorna todos los certificados activos e inactivos. El contenido .p12 nunca se expone.',
  })
  @ApiOkResponse({
    type: [RespuestaCertificadoDto],
    description: 'Listado de certificados',
  })
  listar(@Param('empresaId', ParseUUIDPipe) empresaId: string) {
    return this.certificados.listar(empresaId);
  }

  @Delete(':certificadoId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Desactivar certificado',
    description:
      'Marca el certificado como inactivo. Ya no sera usado para firmar comprobantes.',
  })
  @ApiNoContentResponse({ description: 'Certificado desactivado' })
  @ApiNotFoundResponse({ description: 'Certificado no encontrado' })
  eliminar(
    @Param('empresaId', ParseUUIDPipe) empresaId: string,
    @Param('certificadoId', ParseUUIDPipe) certificadoId: string,
  ) {
    return this.certificados.eliminar(empresaId, certificadoId);
  }
}
