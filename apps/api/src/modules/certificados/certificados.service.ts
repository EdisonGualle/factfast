import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import * as forge from 'node-forge';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { EncryptionService } from './encryption.service';

interface InfoP12 {
  titular: string;
  ruc: string;
  fechaVencimiento: Date;
}

@Injectable()
export class CertificadosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cifrado: EncryptionService,
  ) {}

  async subir(
    empresaId: string,
    archivo: Express.Multer.File,
    contrasena: string,
  ) {
    // Validar el .p12 y extraer metadata via node-forge
    const infoP12 = this.analizarP12(archivo.buffer, contrasena);

    // Cifrar el binario .p12 con AES-256-GCM
    const { encrypted, iv, tag } = this.cifrado.encrypt(archivo.buffer);

    // Cifrar la contrasena por separado
    const contrasenaCifrada = this.cifrado.encryptString(contrasena);

    // Desactivar cualquier certificado activo previo de esta empresa
    await this.prisma.certificadoDigital.updateMany({
      where: { empresa_id: empresaId, activo: true },
      data: { activo: false },
    });

    return this.prisma.certificadoDigital.create({
      data: {
        empresa_id: empresaId,
        nombre_titular: infoP12.titular,
        ruc_titular: infoP12.ruc,
        datos_encriptados: Uint8Array.from(encrypted),
        iv_encriptacion: iv,
        tag_autenticacion: tag,
        contrasena_encriptada: contrasenaCifrada,
        fecha_vencimiento: infoP12.fechaVencimiento,
      },
      select: {
        id: true,
        nombre_titular: true,
        ruc_titular: true,
        fecha_vencimiento: true,
        activo: true,
        created_at: true,
      },
    });
  }

  async listar(empresaId: string) {
    return this.prisma.certificadoDigital.findMany({
      where: { empresa_id: empresaId },
      select: {
        id: true,
        nombre_titular: true,
        ruc_titular: true,
        fecha_vencimiento: true,
        activo: true,
        created_at: true,
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async obtenerActivo(empresaId: string) {
    const certificado = await this.prisma.certificadoDigital.findFirst({
      where: { empresa_id: empresaId, activo: true },
    });
    if (!certificado) {
      throw new NotFoundException(
        'No existe un certificado activo para esta empresa',
      );
    }
    return certificado;
  }

  /**
   * Devuelve el .p12 descifrado y la contrasena en texto plano.
   * Usado internamente por el servicio de firma XML (motor-xml).
   */
  async obtenerCertificadoDescifrado(
    empresaId: string,
  ): Promise<{ p12Buffer: Buffer; password: string }> {
    const certificado = await this.obtenerActivo(empresaId);
    const p12Buffer = this.cifrado.decrypt(
      Buffer.from(certificado.datos_encriptados),
      certificado.iv_encriptacion,
      certificado.tag_autenticacion,
    );
    const contrasena = this.cifrado.decryptString(
      certificado.contrasena_encriptada,
    );
    return { p12Buffer, password: contrasena };
  }

  async eliminar(empresaId: string, certificadoId: string) {
    const certificado = await this.prisma.certificadoDigital.findFirst({
      where: { id: certificadoId, empresa_id: empresaId },
    });
    if (!certificado) {
      throw new NotFoundException(`Certificado ${certificadoId} no encontrado`);
    }

    return this.prisma.certificadoDigital.update({
      where: { id: certificadoId },
      data: { activo: false },
    });
  }

  private analizarP12(buffer: Buffer, contrasena: string): InfoP12 {
    let p12: forge.pkcs12.Pkcs12Pfx;

    try {
      const der = forge.util.createBuffer(buffer.toString('binary'));
      const asn1 = forge.asn1.fromDer(der);
      p12 = forge.pkcs12.pkcs12FromAsn1(asn1, contrasena);
    } catch {
      throw new BadRequestException(
        'Archivo .p12 invalido o contrasena incorrecta',
      );
    }

    const certBags = p12.getBags({ bagType: forge.pki.oids.certBag });
    const bags = certBags[forge.pki.oids.certBag];

    if (!bags || bags.length === 0) {
      throw new BadRequestException(
        'No se encontro un certificado dentro del archivo .p12',
      );
    }

    const cert = bags[0].cert;
    if (!cert) {
      throw new BadRequestException(
        'No se pudo leer el certificado desde el archivo .p12',
      );
    }

    const fechaVencimiento = cert.validity.notAfter;
    if (fechaVencimiento < new Date()) {
      throw new BadRequestException(
        `El certificado expiro el ${fechaVencimiento.toISOString()}`,
      );
    }

    const titular =
      (cert.subject.getField('CN')?.value as string) ?? 'Desconocido';
    const numeroSerie = cert.serialNumber ?? '';
    const campoOu = (cert.subject.getField('OU')?.value as string) ?? '';
    const coincidenciaRuc = (titular + campoOu + numeroSerie).match(/\d{13}/);
    const ruc = coincidenciaRuc ? coincidenciaRuc[0] : '0000000000001';

    return { titular, ruc, fechaVencimiento };
  }
}
