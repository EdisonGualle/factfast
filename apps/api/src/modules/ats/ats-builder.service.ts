import { Injectable } from '@nestjs/common';
import { create } from 'xmlbuilder2';

export interface AtsInformanteData {
  ruc: string;
  razonSocial: string;
  anio: number;
  mes: string;
  numEstabRuc: string;
  totalVentas: number;
}

export interface AtsCompraData {
  codSustento: string;
  tpIdProv: string;
  idProv: string;
  tipoComprobante: string;
  fechaRegistro: string;
  establecimiento: string;
  puntoEmision: string;
  secuencial: string;
  fechaEmision: string;
  autorizacion: string;
  baseNoObjIva: number;
  baseImponible: number;
  baseImpGrav: number;
  baseImpExe: number;
  montoIce: number;
  montoIva: number;
  valRetBien10?: number;
  valRetServ20?: number;
  valorRetBienes?: number;
  valRetServ50?: number;
  valorRetServicios?: number;
  valRetServ100?: number;
  pagoLocExt: '01' | '02';
  paisEfecPago?: string;
  aplicConvDobTrib?: string;
  pagExtSujRetNorLeg?: string;
  formasPago: string[];
}

export interface AtsVentaData {
  tpIdCliente: string;
  idCliente: string;
  tipoComprobante: string;
  numeroComprobantes: number;
  baseNoObjIva: number;
  baseImponible: number;
  baseImpGrav: number;
  montoIva: number;
  montoIce: number;
  valorRetIva: number;
  valorRetRenta: number;
  formasPago: string[];
}

export interface AtsEstablecimientoData {
  codEstab: string;
  ventasEstab: number;
  ivaComp: number;
}

export interface AtsAnuladoData {
  tipoComprobante: string;
  establecimiento: string;
  puntoEmision: string;
  secuencialInicio: string;
  secuencialFin: string;
  autorizacion: string;
}

export interface AtsXmlData {
  informante: AtsInformanteData;
  compras: AtsCompraData[];
  ventas: AtsVentaData[];
  establecimientos: AtsEstablecimientoData[];
  anulados: AtsAnuladoData[];
}

@Injectable()
export class AtsBuilderService {
  build(data: AtsXmlData): string {
    const doc = create({ version: '1.0', encoding: 'UTF-8' }).ele(
      'AnexoTransaccionalID',
    );

    // Informante
    doc.ele('IdProv').txt(data.informante.ruc);
    doc.ele('RazonSocial').txt(data.informante.razonSocial);
    doc.ele('Anio').txt(String(data.informante.anio));
    doc.ele('Mes').txt(data.informante.mes);
    doc.ele('numEstabRuc').txt(data.informante.numEstabRuc);
    doc.ele('totalVentas').txt(data.informante.totalVentas.toFixed(2));
    doc.ele('codigoOperativo').txt('IVA');

    // Compras
    if (data.compras.length > 0) {
      const comprasNode = doc.ele('compras');
      for (const comp of data.compras) {
        const det = comprasNode.ele('detalleCompras');
        det.ele('codSustento').txt(comp.codSustento);
        det.ele('tpIdProv').txt(comp.tpIdProv);
        det.ele('idProv').txt(comp.idProv);
        det.ele('tipoComprobante').txt(comp.tipoComprobante);
        det.ele('fechaRegistro').txt(comp.fechaRegistro);
        det.ele('establecimiento').txt(comp.establecimiento);
        det.ele('puntoEmision').txt(comp.puntoEmision);
        det.ele('secuencial').txt(comp.secuencial);
        det.ele('fechaEmision').txt(comp.fechaEmision);
        det.ele('autorizacion').txt(comp.autorizacion);
        det.ele('baseNoObjIva').txt(comp.baseNoObjIva.toFixed(2));
        det.ele('baseImponible').txt(comp.baseImponible.toFixed(2));
        det.ele('baseImpGrav').txt(comp.baseImpGrav.toFixed(2));
        det.ele('baseImpExe').txt(comp.baseImpExe.toFixed(2));
        det.ele('montoIce').txt(comp.montoIce.toFixed(2));
        det.ele('montoIva').txt(comp.montoIva.toFixed(2));

        // Retenciones de IVA (opcionales)
        det.ele('valRetBien10').txt((comp.valRetBien10 ?? 0).toFixed(2));
        det.ele('valRetServ20').txt((comp.valRetServ20 ?? 0).toFixed(2));
        det.ele('valorRetBienes').txt((comp.valorRetBienes ?? 0).toFixed(2));
        det.ele('valRetServ50').txt((comp.valRetServ50 ?? 0).toFixed(2));
        det
          .ele('valorRetServicios')
          .txt((comp.valorRetServicios ?? 0).toFixed(2));
        det.ele('valRetServ100').txt((comp.valRetServ100 ?? 0).toFixed(2));

        // Pago Exterior
        const pagoExt = det.ele('pagoExterior');
        pagoExt.ele('pagoLocExt').txt(comp.pagoLocExt);
        pagoExt.ele('paisEfecPago').txt(comp.paisEfecPago ?? 'NA');
        pagoExt.ele('aplicConvDobTrib').txt(comp.aplicConvDobTrib ?? 'NA');
        pagoExt.ele('pagExtSujRetNorLeg').txt(comp.pagExtSujRetNorLeg ?? 'NA');

        // Formas de pago
        if (comp.formasPago && comp.formasPago.length > 0) {
          const formasNode = det.ele('formasDePago');
          for (const forma of comp.formasPago) {
            formasNode.ele('formaPago').txt(forma);
          }
        }
      }
    }

    // Ventas
    if (data.ventas.length > 0) {
      const ventasNode = doc.ele('ventas');
      for (const v of data.ventas) {
        const det = ventasNode.ele('detalleVentas');
        det.ele('tpIdCliente').txt(v.tpIdCliente);
        det.ele('idCliente').txt(v.idCliente);
        det.ele('parteRel').txt('NO');
        det.ele('tipoComprobante').txt(v.tipoComprobante);
        det.ele('tipoEmision').txt('E');
        det.ele('numeroComprobantes').txt(String(v.numeroComprobantes));
        det.ele('baseNoObjIva').txt(v.baseNoObjIva.toFixed(2));
        det.ele('baseImponible').txt(v.baseImponible.toFixed(2));
        det.ele('baseImpGrav').txt(v.baseImpGrav.toFixed(2));
        det.ele('montoIva').txt(v.montoIva.toFixed(2));
        det.ele('montoIce').txt(v.montoIce.toFixed(2));
        det.ele('valorRetIva').txt(v.valorRetIva.toFixed(2));
        det.ele('valorRetRenta').txt(v.valorRetRenta.toFixed(2));

        // Formas de pago
        if (v.formasPago && v.formasPago.length > 0) {
          const formasNode = det.ele('formasDePago');
          for (const forma of v.formasPago) {
            formasNode.ele('formaPago').txt(forma);
          }
        }
      }
    }

    // Ventas Establecimiento
    if (data.establecimientos.length > 0) {
      const estNode = doc.ele('ventasEstablecimiento');
      for (const est of data.establecimientos) {
        const vEst = estNode.ele('ventaEstablecimiento');
        vEst.ele('codEstab').txt(est.codEstab);
        vEst.ele('ventasEstab').txt(est.ventasEstab.toFixed(2));
        vEst.ele('ivaComp').txt(est.ivaComp.toFixed(2));
      }
    }

    // Anulados
    if (data.anulados.length > 0) {
      const anulNode = doc.ele('anulados');
      for (const a of data.anulados) {
        const det = anulNode.ele('detalleAnulados');
        det.ele('tipoComprobante').txt(a.tipoComprobante);
        det.ele('establecimiento').txt(a.establecimiento);
        det.ele('puntoEmision').txt(a.puntoEmision);
        det.ele('secuencialInicio').txt(a.secuencialInicio);
        det.ele('secuencialFin').txt(a.secuencialFin);
        det.ele('autorizacion').txt(a.autorizacion);
      }
    }

    return doc.end({ prettyPrint: true, indent: '  ' });
  }
}
