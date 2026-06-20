import { Controller, Get } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiProperty,
  ApiTags,
} from '@nestjs/swagger';
import {
  HealthCheck,
  HealthCheckService,
  HealthCheckResult,
  HealthIndicatorResult,
} from '@nestjs/terminus';
import { PrismaService } from '../../infrastructure/database/prisma.service';

class HealthDatabaseDto {
  @ApiProperty({ example: 'up' })
  status: string;
}

class HealthInfoDto {
  @ApiProperty({ type: HealthDatabaseDto })
  database: HealthDatabaseDto;
}

class HealthResponseDto {
  @ApiProperty({ example: 'ok' })
  status: string;

  @ApiProperty({ type: HealthInfoDto })
  info: HealthInfoDto;

  @ApiProperty({ type: Object, example: {} })
  error: Record<string, unknown>;

  @ApiProperty({ type: HealthInfoDto })
  details: HealthInfoDto;
}

@ApiTags('Salud')
@Controller('status')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  @HealthCheck()
  @ApiOperation({ summary: 'Consultar estado del sistema' })
  @ApiOkResponse({
    type: HealthResponseDto,
    description: 'Estado de salud de las dependencias de la aplicacion',
  })
  check(): Promise<HealthCheckResult> {
    return this.health.check([
      (): Promise<HealthIndicatorResult> => this.checkDatabase(),
    ]);
  }

  private async checkDatabase(): Promise<HealthIndicatorResult> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { database: { status: 'up' } };
    } catch {
      return { database: { status: 'down' } };
    }
  }
}
