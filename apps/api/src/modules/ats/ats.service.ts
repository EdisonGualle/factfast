import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import {
  AtsBuilderService,
  AtsXmlData,
  AtsCompraData,
  AtsVentaData,
  AtsEstablecimientoData,
} from './ats-builder.service';
import { DOMParser } from '@xmldom/xmldom';
import { readFile } from 'fs/promises';

@Injectable()
export class AtsService {
  private readonly logger = new Logger(AtsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly atsBuilder: AtsBuilderService,
  ) {}

  async generarAts(
    empresaId: string,
    anio: number,
    mes: number,
  ): Promise<string> {
    const empresa = await this.prisma.empresa.findUnique({
      where: { id: empresaId },
      include: { sucursales: { where: { activo: true } } },
    });

    if (!empresa) {
      throw new NotFoundException('La empresa especificada no existe');
    }

    const mesStr = String(mes).padStart(2, '0');

    // Rango de fechas para el mes
    const fechaInicio = new Date(anio, mes - 1, 1);
    const fechaFin = new Date(anio, mes, 1); // Exclusivo

    // 1. Obtener VENTAS (Comprobantes emitidos en estado AUTORIZADO)
    const comprobantesEmitidos = await this.prisma.comprobante.findMany({
      where: {
        empresa_id: empresaId,
        estado: 'AUTORIZADO',
        fecha_emision: {
          gte: fechaInicio,
          lt: fechaFin,
        },
      },
      include: {
        formas_pago: true,
      },
    });

    // 2. Obtener COMPRAS (Comprobantes recibidos)
    const comprobantesRecibidos =
      await this.prisma.comprobanteRecibido.findMany({
        where: {
          empresa_id: empresaId,
          fecha_emision: {
            gte: fechaInicio,
            lt: fechaFin,
          },
        },
      });

    // 3. Procesar COMPRAS
    const comprasProcesadas: AtsCompraData[] = [];
    for (const comp of comprobantesRecibidos) {
      const baseNoObjIva = 0;
      let baseImponible = 0; // Tarifa 0%
      let baseImpGrav = 0; // Tarifa diferente de 0%
      let baseImpExe = 0;
      let montoIce = 0;
      let montoIva = 0;
      let formasPago: string[] = ['20']; // Por defecto 'otros con uso del sistema financiero'

      let parsedOk = false;

      // Si hay archivo XML físico local, intentar parsearlo para obtener valores exactos
      if (comp.url_xml) {
        try {
          const xmlContent = await readFile(comp.url_xml, 'utf8');
          const parser = new DOMParser();
          const xmlDoc = parser.parseFromString(xmlContent, 'text/xml');

          if (xmlDoc) {
            // Extraer formas de pago
            const pagosNodes = xmlDoc.getElementsByTagName('pago');
            if (pagosNodes.length > 0) {
              formasPago = [];
              for (let i = 0; i < pagosNodes.length; i++) {
                const formaNode = pagosNodes
                  .item(i)
                  ?.getElementsByTagName('formaPago')
                  .item(0);
                if (formaNode?.textContent) {
                  formasPago.push(formaNode.textContent.trim());
                }
              }
            }

            // Extraer impuestos de infoFactura / totalConImpuestos
            const totalImpuestoNodes =
              xmlDoc.getElementsByTagName('totalImpuesto');
            for (let i = 0; i < totalImpuestoNodes.length; i++) {
              const node = totalImpuestoNodes.item(i);
              const codigo = node
                ?.getElementsByTagName('codigo')
                .item(0)
                ?.textContent?.trim();
              const codigoPorcentaje = node
                ?.getElementsByTagName('codigoPorcentaje')
                .item(0)
                ?.textContent?.trim();
              const baseImponibleVal = Number(
                node?.getElementsByTagName('baseImponible').item(0)
                  ?.textContent || 0,
              );
              const valorVal = Number(
                node?.getElementsByTagName('valor').item(0)?.textContent || 0,
              );

              if (codigo === '2') {
                // IVA
                if (codigoPorcentaje === '0') {
                  baseImponible += baseImponibleVal;
                } else if (
                  ['2', '4', '5', '6', '7', '8', '10'].includes(
                    codigoPorcentaje || '',
                  )
                ) {
                  baseImpGrav += baseImponibleVal;
                  montoIva += valorVal;
                } else if (codigoPorcentaje === '3') {
                  baseImpExe += baseImponibleVal;
                }
              } else if (codigo === '3') {
                // ICE
                montoIce += valorVal;
              }
            }
            parsedOk = true;
          }
        } catch (err) {
          this.logger.warn(
            `Error al leer o parsear XML de compra recibida (${comp.clave_acceso}): ${(err as Error).message}`,
          );
        }
      }

      // Fallback si no hay XML o falló el parseo
      if (!parsedOk) {
        const total = Number(comp.importe_total);
        // Asumir que la compra fue con IVA 15% por defecto si no es nota de venta
        const esFactura = comp.tipo_comprobante === 'FACTURA';
        if (esFactura) {
          baseImpGrav = Number((total / 1.15).toFixed(2));
          montoIva = Number((total - baseImpGrav).toFixed(2));
        } else {
          baseImponible = total;
        }
      }

      // Mapeo de tipo de comprobante SRI (Tabla 4)
      const codComprobante = this.mapTipoComprobanteSri(comp.tipo_comprobante);

      // Tipo de identificación del proveedor (Tabla 5)
      let tpIdProv = '03'; // Pasaporte/Otros
      if (comp.ruc_emisor.length === 13) {
        tpIdProv = '01'; // RUC
      } else if (comp.ruc_emisor.length === 10) {
        tpIdProv = '02'; // Cédula
      }

      // Desarmar serie y secuencial de la clave de acceso de 49 dígitos si no están guardados
      // Clave: fecha(8) + tipo(2) + ruc(13) + ambiente(1) + serie(6) + secuencial(9) + codigo(8) + digito(1)
      let estab = '001';
      let ptoEmi = '001';
      let secuencial = '000000001';
      if (comp.clave_acceso.length === 49) {
        estab = comp.clave_acceso.substring(24, 27);
        ptoEmi = comp.clave_acceso.substring(27, 30);
        secuencial = comp.clave_acceso.substring(30, 39);
      }

      comprasProcesadas.push({
        codSustento: '01', // Por defecto crédito tributario
        tpIdProv,
        idProv: comp.ruc_emisor,
        tipoComprobante: codComprobante,
        fechaRegistro: this.formatDate(comp.fecha_emision),
        establecimiento: estab,
        puntoEmision: ptoEmi,
        secuencial,
        fechaEmision: this.formatDate(comp.fecha_emision),
        autorizacion: comp.numero_autorizacion || comp.clave_acceso,
        baseNoObjIva,
        baseImponible,
        baseImpGrav,
        baseImpExe,
        montoIce,
        montoIva,
        pagoLocExt: '01',
        formasPago: formasPago.length > 0 ? formasPago : ['20'],
      });
    }

    // 4. Procesar VENTAS (Agrupar por cliente, tipo de identificación, tipo de comprobante)
    const ventasAgrupadasMap = new Map<
      string,
      {
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
        formasPagoSet: Set<string>;
      }
    >();

    let totalVentasGlobal = 0;

    for (const comp of comprobantesEmitidos) {
      const codComprobante = this.mapTipoComprobanteSri(comp.tipo_comprobante);
      // Evitar procesar retenciones o guías emitidas como ventas en esta sección
      if (!['01', '04', '05'].includes(codComprobante)) continue;

      const key = `${comp.tipo_identificacion_comprador}-${comp.identificacion_comprador}-${codComprobante}`;

      const totalSinImp = Number(comp.subtotal_sin_impuestos);
      const subIva0 = Number(comp.subtotal_iva_0);
      const subIvaExento = Number(comp.subtotal_exento);
      const subIvaNoObjeto = Number(comp.subtotal_no_objeto);
      const subGravado =
        Number(comp.subtotal_iva_12) +
        Number(comp.subtotal_iva_15) +
        Number(comp.subtotal_iva_5);
      const valIva = Number(comp.total_iva);
      const valIce = Number(comp.total_ice);

      totalVentasGlobal += totalSinImp;

      let group = ventasAgrupadasMap.get(key);
      if (!group) {
        group = {
          tpIdCliente: comp.tipo_identificacion_comprador,
          idCliente: comp.identificacion_comprador,
          tipoComprobante: codComprobante,
          numeroComprobantes: 0,
          baseNoObjIva: 0,
          baseImponible: 0,
          baseImpGrav: 0,
          montoIva: 0,
          montoIce: 0,
          valorRetIva: 0,
          valorRetRenta: 0,
          formasPagoSet: new Set<string>(),
        };
        ventasAgrupadasMap.set(key, group);
      }

      group.numeroComprobantes += 1;
      group.baseNoObjIva += subIvaNoObjeto;
      group.baseImponible += subIva0 + subIvaExento;
      group.baseImpGrav += subGravado;
      group.montoIva += valIva;
      group.montoIce += valIce;

      for (const fp of comp.formas_pago) {
        group.formasPagoSet.add(fp.forma_pago);
      }
    }

    const ventasProcesadas: AtsVentaData[] = Array.from(
      ventasAgrupadasMap.values(),
    ).map((g) => ({
      tpIdCliente: g.tpIdCliente,
      idCliente: g.idCliente,
      tipoComprobante: g.tipoComprobante,
      numeroComprobantes: g.numeroComprobantes,
      baseNoObjIva: Number(g.baseNoObjIva.toFixed(2)),
      baseImponible: Number(g.baseImponible.toFixed(2)),
      baseImpGrav: Number(g.baseImpGrav.toFixed(2)),
      montoIva: Number(g.montoIva.toFixed(2)),
      montoIce: Number(g.montoIce.toFixed(2)),
      valorRetIva: Number(g.valorRetIva.toFixed(2)),
      valorRetRenta: Number(g.valorRetRenta.toFixed(2)),
      formasPago:
        g.formasPagoSet.size > 0 ? Array.from(g.formasPagoSet) : ['20'],
    }));

    // 5. Agrupar VENTAS POR ESTABLECIMIENTO
    const ventasEstablecimientoMap = new Map<string, number>();
    for (const comp of comprobantesEmitidos) {
      const codComprobante = this.mapTipoComprobanteSri(comp.tipo_comprobante);
      if (!['01', '04', '05'].includes(codComprobante)) continue;

      const estab = comp.serie.substring(0, 3);
      const totalSinImp = Number(comp.subtotal_sin_impuestos);

      const current = ventasEstablecimientoMap.get(estab) || 0;
      ventasEstablecimientoMap.set(estab, current + totalSinImp);
    }

    // Asegurar que al menos se reporte el establecimiento principal si no hay ventas
    if (ventasEstablecimientoMap.size === 0 && empresa.sucursales.length > 0) {
      ventasEstablecimientoMap.set(empresa.sucursales[0].codigo, 0);
    }

    const establecimientosProcesados: AtsEstablecimientoData[] = Array.from(
      ventasEstablecimientoMap.entries(),
    ).map(([codEstab, ventasEstab]) => ({
      codEstab,
      ventasEstab: Number(ventasEstab.toFixed(2)),
      ivaComp: 0,
    }));

    // 6. Comprobantes ANULADOS
    // Buscamos comprobantes emitidos en estado ANULADO en el mes
    const comprobantesAnulados = await this.prisma.comprobante.findMany({
      where: {
        empresa_id: empresaId,
        estado: 'ANULADO',
        fecha_emision: {
          gte: fechaInicio,
          lt: fechaFin,
        },
      },
    });

    const anuladosProcesados = comprobantesAnulados.map((a) => ({
      tipoComprobante: this.mapTipoComprobanteSri(a.tipo_comprobante),
      establecimiento: a.serie.substring(0, 3),
      puntoEmision: a.serie.substring(3, 6),
      secuencialInicio: a.numero_secuencial,
      secuencialFin: a.numero_secuencial,
      autorizacion: a.numero_autorizacion || a.clave_acceso,
    }));

    // Consolidar data
    const numEstab =
      empresa.sucursales.length > 0 ? empresa.sucursales.length : 1;
    const atsData: AtsXmlData = {
      informante: {
        ruc: empresa.ruc,
        razonSocial: empresa.razon_social,
        anio,
        mes: mesStr,
        numEstabRuc: String(numEstab).padStart(3, '0'),
        totalVentas: Number(totalVentasGlobal.toFixed(2)),
      },
      compras: comprasProcesadas,
      ventas: ventasProcesadas,
      establecimientos: establecimientosProcesados,
      anulados: anuladosProcesados,
    };

    return this.atsBuilder.build(atsData);
  }

  private mapTipoComprobanteSri(tipo: string): string {
    const map: Record<string, string> = {
      FACTURA: '01',
      LIQUIDACION_COMPRA: '03',
      NOTA_CREDITO: '04',
      NOTA_DEBITO: '05',
      GUIA_REMISION: '06',
      RETENCION: '07',
    };
    return map[tipo] || '01';
  }

  private formatDate(date: Date): string {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }
}
