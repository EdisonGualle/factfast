import { applyDecorators, Type } from '@nestjs/common';
import {
  ApiResponse,
  ApiProperty,
  ApiPropertyOptional,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
  ApiConflictResponse,
  getSchemaPath,
  ApiExtraModels,
} from '@nestjs/swagger';

// ── Respuestas de error estándar ────────────────────────────────────────────

export class ErrorResponseDto {
  @ApiProperty({ example: 400 })
  statusCode: number;

  @ApiProperty({ example: 'Error de validacion' })
  message: string;

  @ApiPropertyOptional({ example: ['ruc debe tener 13 digitos'] })
  details?: string[];

  @ApiProperty({ example: '/v1/companies' })
  path: string;

  @ApiProperty({ example: '2026-05-05T20:15:30.000Z' })
  timestamp: string;
}

export class PaginatedResponseDto<T> {
  @ApiProperty({ isArray: true })
  items: T[];

  @ApiProperty({ example: 100 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 20 })
  limit: number;

  @ApiProperty({ example: 5 })
  pages: number;
}

// ── Decoradores reutilizables ───────────────────────────────────────────────

export const ApiAuthResponses = () =>
  applyDecorators(
    ApiUnauthorizedResponse({ description: 'Token JWT ausente o invalido' }),
    ApiForbiddenResponse({
      description: 'Permisos insuficientes para el rol del usuario',
    }),
  );

export const ApiNotFound = (entity: string) =>
  ApiNotFoundResponse({ description: `${entity} no encontrado` });

export const ApiValidationError = () =>
  ApiBadRequestResponse({
    description: 'Error de validacion - revise el cuerpo de la solicitud',
  });

export const ApiConflictError = (msg: string) =>
  ApiConflictResponse({ description: msg });

export const ApiPaginatedResponse = <T extends Type<unknown>>(model: T) =>
  applyDecorators(
    ApiExtraModels(model),
    ApiResponse({
      status: 200,
      description: 'Listado paginado',
      schema: {
        properties: {
          items: { type: 'array', items: { $ref: getSchemaPath(model) } },
          total: { type: 'number', example: 100 },
          page: { type: 'number', example: 1 },
          limit: { type: 'number', example: 20 },
          pages: { type: 'number', example: 5 },
        },
      },
    }),
  );
