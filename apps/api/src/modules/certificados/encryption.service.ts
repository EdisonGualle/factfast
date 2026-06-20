import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITMO = 'aes-256-gcm';
const LONGITUD_IV = 16;

@Injectable()
export class EncryptionService {
  private readonly llave: Buffer;

  constructor(config: ConfigService) {
    const llaveMaestra = config.get<string>('app.encryption.masterKey');
    if (!llaveMaestra) {
      throw new Error('La llave maestra de cifrado no esta configurada');
    }

    this.llave = Buffer.from(llaveMaestra, 'utf8');
  }

  encrypt(datos: Buffer): { encrypted: Buffer; iv: string; tag: string } {
    const iv = randomBytes(LONGITUD_IV);
    const cipher = createCipheriv(ALGORITMO, this.llave, iv);

    const encrypted = Buffer.concat([cipher.update(datos), cipher.final()]);
    const tag = cipher.getAuthTag();

    return {
      encrypted,
      iv: iv.toString('hex'),
      tag: tag.toString('hex'),
    };
  }

  decrypt(encrypted: Buffer, ivHex: string, tagHex: string): Buffer {
    const iv = Buffer.from(ivHex, 'hex');
    const tag = Buffer.from(tagHex, 'hex');

    const decipher = createDecipheriv(ALGORITMO, this.llave, iv);
    decipher.setAuthTag(tag);

    return Buffer.concat([decipher.update(encrypted), decipher.final()]);
  }

  encryptString(texto: string): string {
    const { encrypted, iv, tag } = this.encrypt(Buffer.from(texto, 'utf8'));
    return `${iv}:${tag}:${encrypted.toString('hex')}`;
  }

  decryptString(codificado: string): string {
    const [iv, tag, hex] = codificado.split(':');
    const descifrado = this.decrypt(Buffer.from(hex, 'hex'), iv, tag);
    return descifrado.toString('utf8');
  }
}
