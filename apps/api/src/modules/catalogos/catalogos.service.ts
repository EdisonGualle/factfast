import { Injectable } from '@nestjs/common';
import { TIPOS_IDENTIFICACION } from './constants/tipos-identificacion';
import { TIPOS_COMPROBANTE } from './constants/tipos-comprobante';
import { FORMAS_PAGO } from './constants/formas-pago';
import { TARIFAS_IVA, CODIGOS_IMPUESTO } from './constants/tarifas-impuestos';
import {
  RETENCIONES_RENTA,
  RETENCIONES_IVA,
} from './constants/tarifas-retencion';
import {
  MOTIVOS_TRASLADO,
  TIPOS_TRANSPORTE,
} from './constants/guias-remision-catalogos';
import { MOTIVOS_NOTA_CREDITO } from './constants/motivos-nota-credito';
import {
  REGIMENES_TRIBUTARIOS,
  AMBIENTES_SRI,
  TIPOS_EMISION,
} from './constants/regimenes-tributarios';

@Injectable()
export class CatalogosService {
  obtenerTiposIdentificacion() {
    return TIPOS_IDENTIFICACION;
  }
  obtenerTiposComprobante() {
    return TIPOS_COMPROBANTE;
  }
  obtenerFormasPago() {
    return FORMAS_PAGO;
  }
  obtenerTarifasIva() {
    return TARIFAS_IVA;
  }
  obtenerCodigosImpuesto() {
    return CODIGOS_IMPUESTO;
  }
  obtenerRetencionesRenta() {
    return RETENCIONES_RENTA;
  }
  obtenerRetencionesIva() {
    return RETENCIONES_IVA;
  }
  obtenerMotivosTraslado() {
    return MOTIVOS_TRASLADO;
  }
  obtenerTiposTransporte() {
    return TIPOS_TRANSPORTE;
  }
  obtenerMotivosNotaCredito() {
    return MOTIVOS_NOTA_CREDITO;
  }
  obtenerRegimenesTributarios() {
    return REGIMENES_TRIBUTARIOS;
  }
  obtenerAmbientesSri() {
    return AMBIENTES_SRI;
  }
  obtenerTiposEmision() {
    return TIPOS_EMISION;
  }
}
