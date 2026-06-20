import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEmail,
  IsOptional,
  IsBoolean,
  IsEnum,
  Length,
  Matches,
  MaxLength,
} from 'class-validator';

export enum RegimenTributario {
  GENERAL = 'GENERAL',
  RIMPE_EMPRENDEDOR = 'RIMPE_EMPRENDEDOR',
  RIMPE_NEGOCIO_POPULAR = 'RIMPE_NEGOCIO_POPULAR',
  AGENTE_RETENCION = 'AGENTE_RETENCION',
}

export enum AmbienteSri {
  PRUEBAS = 'PRUEBAS',
  PRODUCCION = 'PRODUCCION',
}

export class CrearEmpresaDto {
  @ApiProperty({
    example: '0924383631001',
    description:
      'RUC de 13 digitos. Se valida con el algoritmo oficial Modulo 11 del SRI.',
  })
  @IsString()
  @Length(13, 13, { message: 'El RUC debe tener exactamente 13 digitos' })
  @Matches(/^\d{13}$/, { message: 'El RUC debe contener solo digitos' })
  ruc: string;

  @ApiProperty({
    example: 'MI EMPRESA S.A.',
    description: 'Razon social registrada en el SRI',
    maxLength: 300,
  })
  @IsString()
  @MaxLength(300)
  razon_social: string;

  @ApiPropertyOptional({
    example: 'COMERCIAL XYZ',
    description: 'Nombre comercial, si aplica',
    maxLength: 300,
  })
  @IsString()
  @MaxLength(300)
  @IsOptional()
  nombre_comercial?: string;

  @ApiPropertyOptional({
    enum: RegimenTributario,
    default: RegimenTributario.GENERAL,
    description: 'Regimen tributario del contribuyente',
  })
  @IsEnum(RegimenTributario)
  @IsOptional()
  regimen_tributario?: RegimenTributario;

  @ApiPropertyOptional({
    enum: AmbienteSri,
    default: AmbienteSri.PRUEBAS,
    description: 'Ambiente usado para emitir comprobantes SRI',
  })
  @IsEnum(AmbienteSri)
  @IsOptional()
  ambiente_sri?: AmbienteSri;

  @ApiPropertyOptional({
    example: 'Guayaquil, Av. Principal 123',
    maxLength: 300,
  })
  @IsString()
  @MaxLength(300)
  @IsOptional()
  direccion_matriz?: string;

  @ApiPropertyOptional({ example: '042345678', maxLength: 20 })
  @IsString()
  @MaxLength(20)
  @IsOptional()
  telefono?: string;

  @ApiPropertyOptional({ example: 'info@empresa.com', maxLength: 150 })
  @IsEmail()
  @MaxLength(150)
  @IsOptional()
  correo?: string;

  @ApiPropertyOptional({
    example: '001-456789012',
    description: 'Numero de resolucion para contribuyentes especiales',
    maxLength: 13,
  })
  @IsString()
  @MaxLength(13)
  @IsOptional()
  numero_resolucion?: string;

  @ApiPropertyOptional({
    default: false,
    description:
      'Indica si el contribuyente esta obligado a llevar contabilidad',
  })
  @IsBoolean()
  @IsOptional()
  obligado_contabilidad?: boolean;

  @ApiPropertyOptional({
    example: '0705871689001',
    description: 'Usuario de ingreso al portal del SRI (RUC/Cedula)',
    maxLength: 13,
  })
  @IsString()
  @Length(10, 13)
  @IsOptional()
  sri_usuario?: string;

  @ApiPropertyOptional({
    example: 'ClaveSRI123',
    description: 'Contrasena de ingreso al portal del SRI',
  })
  @IsString()
  @IsOptional()
  sri_contrasena?: string;
}
