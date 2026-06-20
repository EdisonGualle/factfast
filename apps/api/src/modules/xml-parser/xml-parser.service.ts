import { Injectable, Logger } from '@nestjs/common';
import { create } from 'xmlbuilder2';

@Injectable()
export class XmlParserService {
  private readonly logger = new Logger(XmlParserService.name);

  /**
   * Extrae los datos principales de cualquier comprobante electrónico SRI (Factura, Retención, Liquidación, etc.)
   */
  parsearComprobanteRecibido(xmlContent: string): any {
    try {
      // 1. Manejar caso donde el XML está envuelto en un nodo <autorizacion> del SRI
      let cleanXml = xmlContent;
      const isAutorizacion = xmlContent.includes('<autorizacion>');
      let autorizacionInfo: any = {};

      if (isAutorizacion) {
        const docObj: any = create(xmlContent).toObject();
        const auth = docObj.autorizacion;
        if (auth) {
          autorizacionInfo = {
            estado: auth.estado,
            numeroAutorizacion: auth.numeroAutorizacion,
            fechaAutorizacion: auth.fechaAutorizacion,
          };
          // Extraer el CDATA interno (el comprobante original firmado)
          if (auth.comprobante) {
            cleanXml = auth.comprobante;
          }
        }
      }

      // Si el comprobante dentro del CDATA sigue siendo un string XML (como suele pasar)
      if (typeof cleanXml === 'string' && cleanXml.trim().startsWith('<')) {
        // Ya es un string válido XML
      }

      const root: any = create(cleanXml).toObject();
      const documentType = Object.keys(root)[0]; // e.g., 'factura', 'comprobanteRetencion', 'liquidacionCompra'
      const data = root[documentType];

      if (!data) {
        throw new Error('Formato XML no reconocido o vacío.');
      }

      const infoTributaria = data.infoTributaria || {};
      const infoEspecifica =
        data.infoFactura ||
        data.infoCompRetencion ||
        data.infoLiquidacionCompra ||
        data.infoNotaCredito ||
        data.infoNotaDebito ||
        {};

      const res = {
        documentType,
        ...autorizacionInfo,
        rucEmisor: infoTributaria.ruc,
        razonSocialEmisor: infoTributaria.razonSocial,
        claveAcceso: infoTributaria.claveAcceso,
        codDoc: infoTributaria.codDoc,
        estab: infoTributaria.estab,
        ptoEmi: infoTributaria.ptoEmi,
        secuencialFormat: `${infoTributaria.estab}-${infoTributaria.ptoEmi}-${infoTributaria.secuencial}`,
        fechaEmision: infoEspecifica.fechaEmision,
        importeTotal: parseFloat(
          infoEspecifica.importeTotal || infoEspecifica.valorRetenido || '0',
        ),
        detalles: this.extraerDetalles(data.detalles),
      };

      return res;
    } catch (error) {
      this.logger.error(`Error al parsear XML: ${(error as Error).message}`);
      throw error;
    }
  }

  private extraerDetalles(detallesNode: any): any[] {
    if (!detallesNode || !detallesNode.detalle) return [];

    // Si hay un solo detalle, xmlbuilder2 lo parsea como objeto, si hay varios, como array
    const detalles = Array.isArray(detallesNode.detalle)
      ? detallesNode.detalle
      : [detallesNode.detalle];

    return detalles.map((d: any) => ({
      codigoPrincipal: d.codigoPrincipal || '',
      descripcion: d.descripcion || '',
      cantidad: parseFloat(d.cantidad || '0'),
      precioUnitario: parseFloat(d.precioUnitario || '0'),
      descuento: parseFloat(d.descuento || '0'),
      precioTotalSinImpuesto: parseFloat(d.precioTotalSinImpuesto || '0'),
    }));
  }
}
