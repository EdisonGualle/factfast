import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AmbienteSri, RegimenTributario } from './dto/crear-empresa.dto';
import { RespuestaConsultaContribuyenteDto } from './dto/consulta-contribuyente-sri.dto';

interface RespuestaApiSri {
  numeroRuc?: string;
  razonSocial?: string;
  estadoContribuyenteRuc?: string;
  actividadEconomicaPrincipal?: string | null;
  tipoContribuyente?: string | null;
  regimen?: string | null;
  categoria?: string | null;
  obligadoLlevarContabilidad?: string | null;
  agenteRetencion?: string | null;
  contribuyenteEspecial?: string | null;
}

const URL_CATASTRO_SRI =
  'https://srienlinea.sri.gob.ec/sri-catastro-sujeto-servicio-internet/rest/ConsolidadoContribuyente/obtenerPorNumerosRuc';

const TIEMPO_LIMITE_MS = 10_000;

@Injectable()
export class ContribuyenteSriService {
  async consultarPorRuc(
    ruc: string,
  ): Promise<RespuestaConsultaContribuyenteDto> {
    this.validarFormatoRuc(ruc);

    const url = `${URL_CATASTRO_SRI}?&ruc=${encodeURIComponent(ruc)}`;
    let respuesta: Response;

    try {
      respuesta = await fetch(url, {
        method: 'GET',
        headers: { accept: 'application/json' },
        signal: AbortSignal.timeout(TIEMPO_LIMITE_MS),
      });
    } catch {
      throw new BadGatewayException('No se pudo consultar el servicio del SRI');
    }

    if (!respuesta.ok) {
      throw new BadGatewayException(
        `El SRI respondio con estado ${respuesta.status}`,
      );
    }

    const datos = await this.leerJson(respuesta);
    const contribuyente = Array.isArray(datos)
      ? (datos[0] as RespuestaApiSri | undefined)
      : undefined;

    if (!contribuyente?.numeroRuc || !contribuyente.razonSocial) {
      throw new NotFoundException(
        `No se encontro informacion del RUC ${ruc} en el SRI`,
      );
    }

    return this.mapearRespuesta(contribuyente);
  }

  private async leerJson(respuesta: Response): Promise<unknown> {
    try {
      return await respuesta.json();
    } catch {
      throw new BadGatewayException('El SRI devolvio una respuesta invalida');
    }
  }

  private mapearRespuesta(
    contribuyente: RespuestaApiSri,
  ): RespuestaConsultaContribuyenteDto {
    const ruc = contribuyente.numeroRuc ?? '';
    const razonSocial = contribuyente.razonSocial ?? '';
    const obligadoContabilidad = this.esSi(
      contribuyente.obligadoLlevarContabilidad,
    );
    const agenteRetencion = this.esSi(contribuyente.agenteRetencion);
    const contribuyenteEspecial = this.esSi(
      contribuyente.contribuyenteEspecial,
    );
    const regimenTributario = agenteRetencion
      ? RegimenTributario.AGENTE_RETENCION
      : this.mapearRegimenTributario(
          contribuyente.regimen,
          contribuyente.categoria,
        );

    return {
      numeroRuc: ruc,
      razonSocial: razonSocial,
      estadoContribuyenteRuc: contribuyente.estadoContribuyenteRuc ?? '',
      actividadEconomicaPrincipal:
        contribuyente.actividadEconomicaPrincipal ?? null,
      tipoContribuyente: contribuyente.tipoContribuyente ?? null,
      regimen: contribuyente.regimen ?? null,
      categoria: contribuyente.categoria ?? null,
      obligadoLlevarContabilidad: obligadoContabilidad,
      agenteRetencion,
      contribuyenteEspecial,
      empresa_sugerida: {
        ruc,
        razon_social: razonSocial,
        nombre_comercial: razonSocial,
        regimen_tributario: regimenTributario,
        ambiente_sri: AmbienteSri.PRUEBAS,
        direccion_matriz: null,
        telefono: null,
        correo: null,
        numero_resolucion: null,
        obligado_contabilidad: obligadoContabilidad,
      },
    };
  }

  private mapearRegimenTributario(
    regimen?: string | null,
    categoria?: string | null,
  ): RegimenTributario {
    const regimenNorm = this.normalizar(regimen);
    const categoriaNorm = this.normalizar(categoria);

    if (
      categoriaNorm.includes('NEGOCIO POPULAR') ||
      regimenNorm.includes('NEGOCIO POPULAR')
    ) {
      return RegimenTributario.RIMPE_NEGOCIO_POPULAR;
    }
    if (regimenNorm.includes('RIMPE'))
      return RegimenTributario.RIMPE_EMPRENDEDOR;

    return RegimenTributario.GENERAL;
  }

  private esSi(valor?: string | null): boolean {
    return this.normalizar(valor) === 'SI';
  }

  private normalizar(valor?: string | null): string {
    return (valor ?? '')
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .trim()
      .toUpperCase();
  }

  private validarFormatoRuc(ruc: string): void {
    if (!/^\d{13}$/.test(ruc)) {
      throw new BadRequestException('El RUC debe tener 13 digitos numericos');
    }
  }
}
