import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { readFile } from 'fs/promises';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { XmlBuilderService } from '../../infrastructure/xml-engine/xml-builder.service';
import { SriSoapService } from '../../infrastructure/queue/sri-soap.service';
import { SRI_QUEUE } from '../../common/constants/queues';
import { EnviarLoteDto } from './dto/enviar-lote.dto';
import * as crypto from 'crypto';

@Injectable()
export class LotesService {
  private readonly logger = new Logger(LotesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly xmlBuilder: XmlBuilderService,
    private readonly sriSoapService: SriSoapService,
    @InjectQueue(SRI_QUEUE) private readonly sriQueue: Queue,
  ) {}

  async procesarLote(empresaId: string, dto: EnviarLoteDto) {
    if (dto.comprobante_ids.length === 0) {
      throw new BadRequestException('El lote debe contener al menos un comprobante');
    }

    // 1. Obtener los comprobantes
    const comprobantes = await this.prisma.comprobante.findMany({
      where: {
        id: { in: dto.comprobante_ids },
        empresa_id: empresaId,
        estado: 'FIRMADO',
      },
      include: {
        empresa: true,
      },
    });

    if (comprobantes.length !== dto.comprobante_ids.length) {
      throw new BadRequestException(
        'Algunos comprobantes no fueron encontrados, no pertenecen a la empresa, o no están en estado FIRMADO.',
      );
    }

    const ruc = comprobantes[0].empresa.ruc;
    const environment = comprobantes[0].empresa.ambiente_sri === 'PRODUCCION' ? '2' : '1';

    // 2. Leer los XMLs firmados desde el disco
    const signedXmls: string[] = [];
    for (const comp of comprobantes) {
      if (!comp.url_xml) {
        throw new BadRequestException(`El comprobante ${comp.id} no tiene un XML firmado asociado.`);
      }
      try {
        const xml = await readFile(comp.url_xml, 'utf8');
        signedXmls.push(xml);
      } catch (err) {
        throw new BadRequestException(`No se pudo leer el archivo XML del comprobante ${comp.id}`);
      }
    }

    // 3. Generar la Clave de Acceso del Lote (49 dígitos válidos módulo 11)
    const claveAccesoLote = this.generarClaveAccesoLote(ruc, environment);

    // 4. Construir el XML maestro del lote
    const loteXml = this.xmlBuilder.buildLote(ruc, claveAccesoLote, signedXmls);

    // 5. Enviar el XML maestro a RecepcionComprobantesOffline
    this.logger.log(`Enviando Lote con clave: ${claveAccesoLote} y ${signedXmls.length} comprobantes`);
    const receptionResult = await this.sriSoapService.receive(loteXml, environment as '1' | '2');

    if (receptionResult.status === 'RECIBIDA') {
      // 6. Si fue recibido, actualizamos el estado en BD y encolamos para consultar Autorización de Lote
      await this.prisma.comprobante.updateMany({
        where: { id: { in: comprobantes.map((c) => c.id) } },
        data: { estado: 'ENVIADO' },
      });

      // Encolar job especial para lote
      await this.sriQueue.add(
        'check-lote-authorization',
        {
          claveAccesoLote,
          comprobanteIds: comprobantes.map((c) => c.id),
          environment,
        },
        {
          delay: 5000, // Esperar 5s antes de consultar el lote
          attempts: 10,
          backoff: { type: 'exponential', delay: 30000 },
        },
      );

      return {
        claveAccesoLote,
        estado: 'RECIBIDA',
        mensaje: 'Lote recibido por el SRI y encolado para consulta de autorización.',
      };
    } else {
      // 7. Si fue devuelto o error
      throw new BadRequestException({
        mensaje: 'El lote fue devuelto por el SRI',
        detalles: receptionResult.messages,
      });
    }
  }

  /**
   * Genera una clave de acceso de lote aleatoria (pero con formato válido de 49 dígitos y módulo 11).
   * Según manual SRI, los lotes pueden tener cualquier clave siempre que cumpla el módulo 11.
   */
  private generarClaveAccesoLote(ruc: string, environment: string): string {
    const fecha = new Date();
    const d = String(fecha.getDate()).padStart(2, '0');
    const m = String(fecha.getMonth() + 1).padStart(2, '0');
    const y = fecha.getFullYear();
    const dateStr = `${d}${m}${y}`;

    const tipoComprobante = '01'; // Por convención se suele usar 01 para lotes
    const rucStr = ruc.padEnd(13, '0');
    const envStr = environment;
    // Usamos una serie fija para lotes si es necesario o un random
    const serie = '999999';
    // Secuencial aleatorio de 9 dígitos
    const secuencial = crypto.randomInt(1, 999999999).toString().padStart(9, '0');
    const codigoNumerico = '12345678';
    const tipoEmision = '1';

    let key = `${dateStr}${tipoComprobante}${rucStr}${envStr}${serie}${secuencial}${codigoNumerico}${tipoEmision}`;

    // Calcular dígito verificador módulo 11
    const factor = [2, 3, 4, 5, 6, 7];
    let sum = 0;
    for (let i = key.length - 1; i >= 0; i--) {
      sum += parseInt(key[i], 10) * factor[(key.length - 1 - i) % 6];
    }
    const checkDigit = 11 - (sum % 11);
    const dv = checkDigit === 11 ? 0 : checkDigit === 10 ? 1 : checkDigit;

    key += dv.toString();
    return key;
  }
}
