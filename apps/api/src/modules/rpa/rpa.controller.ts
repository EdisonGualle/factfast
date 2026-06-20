import {
  Controller,
  Post,
  Get,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
  ApiOkResponse,
} from '@nestjs/swagger';
import { InjectQueue } from '@nestjs/bull';
import * as Bull from 'bull';
import { RPA_QUEUE } from '../../common/constants/queues';
import { ApiAuthResponses } from '../../common/swagger/api-responses.decorator';
import { RpaService } from './rpa.service';

@ApiTags('RPA Compras')
@ApiBearerAuth('access-token')
@ApiAuthResponses()
@Controller('empresas/:empresaId/rpa')
export class RpaController {
  constructor(
    @InjectQueue(RPA_QUEUE) private readonly rpaQueue: Bull.Queue,
    private readonly rpaService: RpaService,
  ) {}

  @Post('sincronizar')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Sincronizar compras desde el SRI mediante Robot RPA',
    description:
      'Encola una tarea en segundo plano para que el bot RPA ingrese al portal de SRI en línea, resuelva el captcha y sincronice las facturas del periodo.',
  })
  @ApiQuery({
    name: 'anio',
    type: Number,
    description: 'Año a sincronizar (ej. 2026)',
    required: true,
  })
  @ApiQuery({
    name: 'mes',
    type: Number,
    description: 'Mes a sincronizar (1 - 12)',
    required: true,
  })
  @ApiOkResponse({
    description: 'Sincronización encolada correctamente.',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        jobId: { type: 'string' },
      },
    },
  })
  async sincronizar(
    @Param('empresaId', ParseUUIDPipe) empresaId: string,
    @Query('anio', ParseIntPipe) anio: number,
    @Query('mes', ParseIntPipe) mes: number,
  ) {
    const job = await this.rpaQueue.add(
      'sincronizar-compras',
      {
        empresaId,
        anio,
        mes,
      },
      {
        attempts: 3,
        backoff: 5000,
        removeOnComplete: true,
      },
    );

    return {
      success: true,
      message: 'Sincronización iniciada en segundo plano.',
      jobId: job.id,
    };
  }

  @Get('comprobantes')
  @ApiOperation({
    summary: 'Obtener listado de comprobantes electrónicos recibidos',
    description:
      'Devuelve los comprobantes de compras sincronizados desde el SRI.',
  })
  @ApiQuery({
    name: 'page',
    type: Number,
    description: 'Número de página (default: 1)',
    required: false,
  })
  @ApiQuery({
    name: 'limit',
    type: Number,
    description: 'Cantidad de registros por página (default: 20)',
    required: false,
  })
  async listarComprobantes(
    @Param('empresaId', ParseUUIDPipe) empresaId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.rpaService.listarRecibidos(empresaId, page, limit);
  }
}
