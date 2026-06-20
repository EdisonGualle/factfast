import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { LotesService } from './lotes.service';
import { EnviarLoteDto } from './dto/enviar-lote.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Lotes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('lotes')
export class LotesController {
  constructor(private readonly lotesService: LotesService) {}

  @Post()
  @ApiOperation({ summary: 'Enviar múltiples comprobantes firmados como un Lote al SRI' })
  @ApiResponse({ status: 201, description: 'Lote recibido por el SRI y encolado para autorización.' })
  enviarLote(@Request() req: any, @Body() dto: EnviarLoteDto) {
    return this.lotesService.procesarLote(req.user.empresa_id, dto);
  }
}
