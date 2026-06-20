import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as https from 'https';
import * as http from 'http';

interface SriReceptionResult {
  status: 'RECIBIDA' | 'DEVUELTA' | 'ERROR';
  messages: string[];
  rawResponse: string;
}

interface SriAuthorizationResult {
  status: 'AUTORIZADO' | 'NO_AUTORIZADO' | 'ERROR';
  authorizationNumber?: string;
  authorizationDate?: Date;
  messages: string[];
  rawResponse: string;
}

export interface SriLoteAuthorization {
  accessKey: string;
  status: 'AUTORIZADO' | 'NO_AUTORIZADO' | 'ERROR';
  authorizationNumber?: string;
  authorizationDate?: Date;
  messages: string[];
}

export interface SriLoteAuthorizationResult {
  rawResponse: string;
  authorizations: SriLoteAuthorization[];
}

@Injectable()
export class SriSoapService {
  private readonly logger = new Logger(SriSoapService.name);

  constructor(private readonly config: ConfigService) {}

  async receive(
    signedXml: string,
    environment: '1' | '2',
  ): Promise<SriReceptionResult> {
    const wsdl =
      environment === '2'
        ? this.config.get<string>('app.sri.wsdlReceptionProd')
        : this.config.get<string>('app.sri.wsdlReceptionTest');
    this.ensureWsdlConfigured(wsdl, 'recepcion', environment);

    const xmlBase64 = Buffer.from(signedXml, 'utf8').toString('base64');

    const soapBody = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
                  xmlns:ec="http://ec.gob.sri.ws.recepcion">
  <soapenv:Header/>
  <soapenv:Body>
    <ec:validarComprobante>
      <xml>${xmlBase64}</xml>
    </ec:validarComprobante>
  </soapenv:Body>
</soapenv:Envelope>`;

    try {
      const response = await this.postSoap(wsdl, soapBody);
      return this.parseReceptionResponse(response);
    } catch (err) {
      this.logger.error(`SRI reception error: ${(err as Error).message}`);
      return {
        status: 'ERROR',
        messages: [(err as Error).message],
        rawResponse: '',
      };
    }
  }

  async authorize(
    accessKey: string,
    environment: '1' | '2',
  ): Promise<SriAuthorizationResult> {
    const wsdl =
      environment === '2'
        ? this.config.get<string>('app.sri.wsdlAuthorizationProd')
        : this.config.get<string>('app.sri.wsdlAuthorizationTest');
    this.ensureWsdlConfigured(wsdl, 'autorizacion', environment);

    const soapBody = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
                  xmlns:ec="http://ec.gob.sri.ws.autorizacion">
  <soapenv:Header/>
  <soapenv:Body>
    <ec:autorizacionComprobante>
      <claveAccesoComprobante>${accessKey}</claveAccesoComprobante>
    </ec:autorizacionComprobante>
  </soapenv:Body>
</soapenv:Envelope>`;

    try {
      const response = await this.postSoap(wsdl, soapBody);
      return this.parseAuthorizationResponse(response, accessKey);
    } catch (err) {
      this.logger.error(`SRI authorization error: ${(err as Error).message}`);
      return {
        status: 'ERROR',
        messages: [(err as Error).message],
        rawResponse: '',
      };
    }
  }

  async authorizeLote(
    claveAccesoLote: string,
    environment: '1' | '2',
  ): Promise<SriLoteAuthorizationResult> {
    const wsdl =
      environment === '2'
        ? this.config.get<string>('app.sri.wsdlAuthorizationProd')
        : this.config.get<string>('app.sri.wsdlAuthorizationTest');
    this.ensureWsdlConfigured(wsdl, 'autorizacion', environment);

    const soapBody = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
                  xmlns:ec="http://ec.gob.sri.ws.autorizacion">
  <soapenv:Header/>
  <soapenv:Body>
    <ec:autorizacionComprobanteLote>
      <claveAccesoLote>${claveAccesoLote}</claveAccesoLote>
    </ec:autorizacionComprobanteLote>
  </soapenv:Body>
</soapenv:Envelope>`;

    try {
      const response = await this.postSoap(wsdl, soapBody);
      return this.parseLoteAuthorizationResponse(response);
    } catch (err) {
      this.logger.error(`SRI lote authorization error: ${(err as Error).message}`);
      return {
        rawResponse: '',
        authorizations: [],
      };
    }
  }

  private postSoap(wsdlUrl: string, body: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const url = new URL(wsdlUrl);
      if (url.search.toLowerCase() === '?wsdl') {
        url.search = '';
      }
      const isHttps = url.protocol === 'https:';
      const options = {
        hostname: url.hostname,
        port: url.port || (isHttps ? 443 : 80),
        path: url.pathname + url.search,
        method: 'POST',
        headers: {
          'Content-Type': 'text/xml;charset=UTF-8',
          'Content-Length': Buffer.byteLength(body, 'utf8'),
          SOAPAction: '""',
        },
        timeout: 30_000,
      };

      const req = (isHttps ? https : http).request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => resolve(data));
      });

      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('SRI SOAP request timed out'));
      });
      req.write(body);
      req.end();
    });
  }

  private ensureWsdlConfigured(
    wsdl: string | undefined,
    operation: 'recepcion' | 'autorizacion',
    environment: '1' | '2',
  ): asserts wsdl is string {
    if (!wsdl) {
      const envName = environment === '2' ? 'produccion' : 'pruebas';
      throw new ServiceUnavailableException(
        `WSDL de ${operation} SRI no configurado para ambiente ${envName}`,
      );
    }
  }

  private parseReceptionResponse(xml: string): SriReceptionResult {
    if (xml.includes('<estado>RECIBIDA</estado>')) {
      return { status: 'RECIBIDA', messages: [], rawResponse: xml };
    }

    const messages = this.parseSriMessages(xml);
    return { status: 'DEVUELTA', messages, rawResponse: xml };
  }

  private parseAuthorizationResponse(
    xml: string,
    accessKey: string,
  ): SriAuthorizationResult {
    const rawResponse = xml;

    if (!xml.includes('<autorizacion>')) {
      return {
        status: 'ERROR',
        messages: ['No authorization element in response'],
        rawResponse,
      };
    }

    const estado = xml.match(/<estado>(.*?)<\/estado>/s)?.[1]?.trim();
    const numAuth = xml
      .match(/<numeroAutorizacion>(.*?)<\/numeroAutorizacion>/s)?.[1]
      ?.trim();
    const fechaAuth = xml
      .match(/<fechaAutorizacion>(.*?)<\/fechaAutorizacion>/s)?.[1]
      ?.trim();

    const messages = this.parseSriMessages(xml);

    if (estado === 'AUTORIZADO') {
      return {
        status: 'AUTORIZADO',
        authorizationNumber: numAuth ?? accessKey,
        authorizationDate: fechaAuth ? new Date(fechaAuth) : new Date(),
        messages,
        rawResponse,
      };
    }

    return { status: 'NO_AUTORIZADO', messages, rawResponse };
  }

  private parseLoteAuthorizationResponse(xml: string): SriLoteAuthorizationResult {
    const rawResponse = xml;
    const authorizations: SriLoteAuthorization[] = [];

    // Buscar todos los bloques <autorizacion>
    const authBlocks = Array.from(xml.matchAll(/<autorizacion>([\s\S]*?)<\/autorizacion>/g));
    
    for (const block of authBlocks) {
      const content = block[1];
      const estado = content.match(/<estado>(.*?)<\/estado>/s)?.[1]?.trim() as 'AUTORIZADO' | 'NO_AUTORIZADO' | 'ERROR';
      const numAuth = content.match(/<numeroAutorizacion>(.*?)<\/numeroAutorizacion>/s)?.[1]?.trim();
      const fechaAuth = content.match(/<fechaAutorizacion>(.*?)<\/fechaAutorizacion>/s)?.[1]?.trim();
      
      // La clave de acceso del comprobante individual viene dentro del XML en el CDATA de <comprobante>, 
      // pero a veces el SRI responde con un tag en la autorización.
      // Buscamos la clave de acceso de 49 digitos dentro de todo este bloque de autorizacion (usualmente está en el comprobante).
      const claveMatch = content.match(/<claveAcceso>(\d{49})<\/claveAcceso>/);
      const accessKey = claveMatch ? claveMatch[1] : (numAuth ?? 'DESCONOCIDA');

      const messages = this.parseSriMessages(content);

      authorizations.push({
        accessKey,
        status: estado ?? 'ERROR',
        authorizationNumber: numAuth,
        authorizationDate: fechaAuth ? new Date(fechaAuth) : new Date(),
        messages,
      });
    }

    return { rawResponse, authorizations };
  }

  private parseSriMessages(xml: string): string[] {
    const messages: string[] = [];
    const messageContainers = Array.from(
      xml.matchAll(
        /<mensajes>\s*<mensaje>([\s\S]*?)<\/mensaje>\s*<\/mensajes>/g,
      ),
    );

    for (const block of messageContainers) {
      const content = block[1];
      messages.push(this.formatSriMessage(content));
    }

    if (messages.length > 0) {
      return messages;
    }

    const identifiers = Array.from(
      xml.matchAll(/<identificador>([\s\S]*?)<\/identificador>/g),
    ).map((match) => match[1]);
    const messageTexts = Array.from(
      xml.matchAll(/<mensaje>([\s\S]*?)<\/mensaje>/g),
    )
      .map((match) => match[1])
      .filter((value) => !value.includes('<identificador>'));
    const additionalTexts = Array.from(
      xml.matchAll(/<informacionAdicional>([\s\S]*?)<\/informacionAdicional>/g),
    ).map((match) => match[1]);
    const maxLength = Math.max(
      identifiers.length,
      messageTexts.length,
      additionalTexts.length,
    );

    for (let index = 0; index < maxLength; index += 1) {
      messages.push(
        this.formatSriParts(
          identifiers[index],
          messageTexts[index],
          additionalTexts[index],
        ),
      );
    }

    return messages.length > 0
      ? messages
      : ['Respuesta SRI sin detalle de mensajes'];
  }

  private formatSriMessage(content: string): string {
    const identifier = content.match(
      /<identificador>([\s\S]*?)<\/identificador>/,
    )?.[1];
    const message = content.match(/<mensaje>([\s\S]*?)<\/mensaje>/)?.[1];
    const additional = content.match(
      /<informacionAdicional>([\s\S]*?)<\/informacionAdicional>/,
    )?.[1];

    return this.formatSriParts(identifier, message, additional);
  }

  private formatSriParts(
    identifier?: string,
    message?: string,
    additional?: string,
  ): string {
    return [identifier, message, additional]
      .map((value) => value?.trim())
      .filter((value): value is string => Boolean(value))
      .join(' - ');
  }
}
