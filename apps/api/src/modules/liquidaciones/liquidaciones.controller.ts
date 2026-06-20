import { Controller, Get, Post, Param, Body, UseGuards, Request, ParseUUIDPipe, Query, ParseIntPipe, DefaultValuePipe, Res, StreamableFile } from '@nestjs/common';
import type { Response } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { LiquidacionesService } from './liquidaciones.service';
import { CrearLiquidacionCompraDto } from './dto/crear-liquidacion.dto';
import { AnularLiquidacionDto } from './dto/anular-liquidacion.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Liquidaciones de Compra')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('liquidaciones')
export class LiquidacionesController {
  constructor(private readonly liquidacionesService: LiquidacionesService) {}

  @Post()
  @ApiOperation({ summary: 'Emitir Liquidación de Compra (Soporta Flujo Automático de Retención)' })
  @ApiResponse({ status: 201, description: 'Liquidación firmada y encolada para el SRI.' })
  crear(@Request() req: any, @Body() dto: CrearLiquidacionCompraDto) {
    return this.liquidacionesService.crear(req.user.empresa_id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar liquidaciones de una empresa' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  listar(
    @Request() req: any,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.liquidacionesService.listar(req.user.empresa_id, page, limit);
  }

  @Get(':id/xml')
  @ApiOperation({ summary: 'Descargar XML de la liquidación' })
  @ApiQuery({ name: 'type', required: false, enum: ['signed', 'unsigned'], example: 'signed' })
  async descargarXml(
    @Request() req: any,
    @Param('id', ParseUUIDPipe) id: string,
    @Query('type') type: 'signed' | 'unsigned' = 'signed',
    @Res({ passthrough: true }) response: Response,
  ) {
    const xml = await this.liquidacionesService.obtenerArchivoXml(req.user.empresa_id, id, type);
    response.set({
      'Content-Type': 'application/xml; charset=utf-8',
      'Content-Disposition': `attachment; filename="${xml.filename}"`,
    });
    return new StreamableFile(xml.buffer);
  }

  @Get(':id/pdf')
  @ApiOperation({ summary: 'Descargar RIDE/PDF de la liquidación' })
  async descargarPdf(
    @Request() req: any,
    @Param('id', ParseUUIDPipe) id: string,
    @Res({ passthrough: true }) response: Response,
  ) {
    const pdf = await this.liquidacionesService.obtenerArchivoPdf(req.user.empresa_id, id);
    response.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${pdf.filename}"`,
    });
    return new StreamableFile(pdf.buffer);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalle de la liquidación' })
  obtenerUno(@Request() req: any, @Param('id', ParseUUIDPipe) id: string) {
    return this.liquidacionesService.obtenerUno(req.user.empresa_id, id);
  }

  @Post(':id/anular')
  @ApiOperation({ summary: 'Anular liquidación (Genera Nota de Crédito)' })
  anular(
    @Request() req: any,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AnularLiquidacionDto,
  ) {
    return this.liquidacionesService.anular(req.user.empresa_id, id, dto);
  }
}
