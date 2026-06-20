import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length, Matches, MaxLength } from 'class-validator';

export class CrearSucursalDto {
  @ApiProperty({
    example: '001',
    description: 'Codigo de establecimiento SRI de exactamente 3 digitos',
  })
  @IsString()
  @Length(3, 3, {
    message: 'El codigo de sucursal debe tener exactamente 3 digitos',
  })
  @Matches(/^\d{3}$/, { message: 'El codigo de sucursal debe ser numerico' })
  codigo: string;

  @ApiProperty({
    example: 'Sucursal Centro',
    description: 'Nombre comercial de la sucursal',
    maxLength: 200,
  })
  @IsString()
  @MaxLength(200)
  nombre: string;

  @ApiProperty({
    example: 'Guayaquil, Av. 9 de Octubre 100',
    description: 'Direccion fisica de la sucursal (obligatoria por SRI)',
    maxLength: 300,
  })
  @IsString()
  @MaxLength(300)
  direccion: string;
}
