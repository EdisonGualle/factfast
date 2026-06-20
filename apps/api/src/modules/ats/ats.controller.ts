import {
  Controller,
  Get,
  Param,
  Query,
  Res,
  ParseUUIDPipe,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
  ApiOkResponse,
} from '@nestjs/swagger';
import * as express from 'express';
import { AtsService } from './ats.service';
import { ApiAuthResponses } from '../../common/swagger/api-responses.decorator';

@ApiTags('ATS')
@ApiBearerAuth('access-token')
@ApiAuthResponses()
@Controller('empresas/:empresaId/ats')
export class AtsController {
  constructor(private readonly atsService: AtsService) {}

  @Get()
  @ApiOperation({
    summary: 'Generar XML del Anexo Transaccional Simplificado (ATS)',
    description:
      'Genera y descarga el archivo XML del ATS consolidando las compras y ventas del mes y año especificados.',
  })
  @ApiQuery({
    name: 'anio',
    type: Number,
    description: 'Año del periodo fiscal (ej. 2026)',
    required: true,
  })
  @ApiQuery({
    name: 'mes',
    type: Number,
    description: 'Mes del periodo fiscal (1 - 12)',
    required: true,
  })
  @ApiOkResponse({
    description: 'Archivo XML del ATS generado correctamente.',
    schema: {
      type: 'string',
      format: 'binary',
    },
  })
  async generarAts(
    @Param('empresaId', ParseUUIDPipe) empresaId: string,
    @Query('anio', ParseIntPipe) anio: number,
    @Query('mes', ParseIntPipe) mes: number,
    @Res() res: express.Response,
  ) {
    const atsXml = await this.atsService.generarAts(empresaId, anio, mes);
    const mesStr = String(mes).padStart(2, '0');

    res.set({
      'Content-Type': 'application/xml',
      'Content-Disposition': `attachment; filename="ATS-${anio}-${mesStr}.xml"`,
    });

    return res.send(atsXml);
  }
}
