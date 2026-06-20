import { SetMetadata } from '@nestjs/common';

export const CLAVE_RUTA_PUBLICA = 'esRutaPublica';

/**
 * Marca un endpoint como publico, omitiendo el JwtAuthGuard global.
 */
export const Publico = () => SetMetadata(CLAVE_RUTA_PUBLICA, true);
