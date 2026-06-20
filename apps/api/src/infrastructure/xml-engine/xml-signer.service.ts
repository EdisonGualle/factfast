import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as forge from 'node-forge';
import { createHash } from 'crypto';
import { DOMParser } from '@xmldom/xmldom';
import { C14nCanonicalization } from 'xml-crypto/lib/c14n-canonicalization';

type AncestorNamespace = { prefix: string; namespaceURI: string };

// XAdES-BES digital signature for SRI Ecuador
// SRI requires a specific XAdES-BES profile embedded in the XML
@Injectable()
export class XmlSignerService {
  sign(xmlString: string, p12Buffer: Buffer, p12Password: string): string {
    const { privateKey, certificate } = this.extractFromP12(
      p12Buffer,
      p12Password,
    );

    const signatureId = `Signature-${this.randomNumber()}`;
    const signedPropertiesId = `${signatureId}-SignedProperties-${this.randomNumber()}`;
    const keyInfoId = `Certificate-${this.randomNumber()}`;
    const signedPropertiesReferenceId = `Reference-SP-${this.randomNumber()}`;
    const keyInfoReferenceId = `Reference-KI-${this.randomNumber()}`;
    const documentReferenceId = `Reference-Doc-${this.randomNumber()}`;

    // Certificate info
    const certDer = forge.asn1
      .toDer(forge.pki.certificateToAsn1(certificate))
      .getBytes();
    const certDigest = this.sha1Base64(Buffer.from(certDer, 'binary'));
    const certSerial = this.hexToDecimal(certificate.serialNumber);
    const issuerDN = this.formatIssuerName(certificate);
    const certB64 = forge.util.encode64(certDer);

    const now = this.formatSigningTime(new Date());
    const keyInfoXml = this.buildKeyInfo(
      keyInfoId,
      certB64,
      issuerDN,
      certSerial,
    );
    const signedPropertiesXml = this.buildSignedProperties(
      signedPropertiesId,
      signatureId,
      now,
      certDigest,
      certSerial,
      issuerDN,
      documentReferenceId,
    );

    const documentDigest = this.sha1CanonicalXml(
      this.withoutXmlDeclaration(xmlString),
    );
    const signatureSkeleton = this.buildSignatureXml(
      signatureId,
      '',
      '',
      keyInfoXml,
      signedPropertiesXml,
    );
    const skeletonXml = this.injectSignature(xmlString, signatureSkeleton);
    const signedPropertiesDigest = this.sha1CanonicalNode(
      skeletonXml,
      'http://uri.etsi.org/01903/v1.3.2#',
      'SignedProperties',
    );
    const keyInfoDigest = this.sha1CanonicalNode(
      skeletonXml,
      'http://www.w3.org/2000/09/xmldsig#',
      'KeyInfo',
    );

    const signedInfo = this.buildSignedInfo({
      signedPropertiesReferenceId,
      keyInfoReferenceId,
      documentReferenceId,
      signedPropertiesId,
      keyInfoId,
      signedPropertiesDigest,
      keyInfoDigest,
      documentDigest,
    });

    const unsignedSignatureXml = this.buildSignatureXml(
      signatureId,
      signedInfo,
      '',
      keyInfoXml,
      signedPropertiesXml,
    );
    const xmlForSigning = this.injectSignature(xmlString, unsignedSignatureXml);
    const canonicalSignedInfo = this.canonicalizeNode(
      xmlForSigning,
      'http://www.w3.org/2000/09/xmldsig#',
      'SignedInfo',
    );

    const md = forge.md.sha1.create();
    md.update(canonicalSignedInfo, 'utf8');
    const signatureValueBytes = privateKey.sign(md);
    const signatureValue = forge.util.encode64(signatureValueBytes);

    const signatureXml = this.buildSignatureXml(
      signatureId,
      signedInfo,
      signatureValue,
      keyInfoXml,
      signedPropertiesXml,
    );

    return this.injectSignature(xmlString, signatureXml);
  }

  private buildSignatureXml(
    signatureId: string,
    signedInfoXml: string,
    signatureValue: string,
    keyInfoXml: string,
    signedPropertiesXml: string,
  ): string {
    const signatureValueXml = signatureValue
      ? `<ds:SignatureValue Id="${signatureId}-SigValue-${this.randomNumber()}">${signatureValue}</ds:SignatureValue>`
      : '';

    return [
      `<ds:Signature xmlns:ds="http://www.w3.org/2000/09/xmldsig#" xmlns:etsi="http://uri.etsi.org/01903/v1.3.2#" Id="${signatureId}">`,
      signedInfoXml,
      signatureValueXml,
      keyInfoXml,
      `<ds:Object Id="${signatureId}-Object-${this.randomNumber()}">`,
      `<etsi:QualifyingProperties Target="#${signatureId}">`,
      signedPropertiesXml,
      '</etsi:QualifyingProperties>',
      '</ds:Object>',
      '</ds:Signature>',
    ].join('');
  }

  private buildSignedInfo(data: {
    signedPropertiesReferenceId: string;
    keyInfoReferenceId: string;
    documentReferenceId: string;
    signedPropertiesId: string;
    keyInfoId: string;
    signedPropertiesDigest: string;
    keyInfoDigest: string;
    documentDigest: string;
  }): string {
    return [
      '<ds:SignedInfo>',
      '<ds:CanonicalizationMethod Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315"/>',
      '<ds:SignatureMethod Algorithm="http://www.w3.org/2000/09/xmldsig#rsa-sha1"/>',
      `<ds:Reference Id="${data.signedPropertiesReferenceId}" Type="http://uri.etsi.org/01903#SignedProperties" URI="#${data.signedPropertiesId}">`,
      '<ds:DigestMethod Algorithm="http://www.w3.org/2000/09/xmldsig#sha1"/>',
      `<ds:DigestValue>${data.signedPropertiesDigest}</ds:DigestValue>`,
      '</ds:Reference>',
      `<ds:Reference Id="${data.keyInfoReferenceId}" URI="#${data.keyInfoId}">`,
      '<ds:DigestMethod Algorithm="http://www.w3.org/2000/09/xmldsig#sha1"/>',
      `<ds:DigestValue>${data.keyInfoDigest}</ds:DigestValue>`,
      '</ds:Reference>',
      `<ds:Reference Id="${data.documentReferenceId}" URI="#comprobante">`,
      '<ds:Transforms><ds:Transform Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature"/></ds:Transforms>',
      '<ds:DigestMethod Algorithm="http://www.w3.org/2000/09/xmldsig#sha1"/>',
      `<ds:DigestValue>${data.documentDigest}</ds:DigestValue>`,
      '</ds:Reference>',
      '</ds:SignedInfo>',
    ].join('');
  }

  private buildKeyInfo(
    id: string,
    certB64: string,
    issuerDN: string,
    certSerial: string,
  ): string {
    return [
      `<ds:KeyInfo Id="${id}">`,
      '<ds:X509Data>',
      `<ds:X509Certificate>${certB64}</ds:X509Certificate>`,
      '<ds:X509IssuerSerial>',
      `<ds:X509IssuerName>${issuerDN}</ds:X509IssuerName>`,
      `<ds:X509SerialNumber>${certSerial}</ds:X509SerialNumber>`,
      '</ds:X509IssuerSerial>',
      '</ds:X509Data>',
      '</ds:KeyInfo>',
    ].join('');
  }

  private buildSignedProperties(
    id: string,
    sigId: string,
    signingTime: string,
    certDigest: string,
    certSerial: string,
    issuerDN: string,
    documentReferenceId: string,
  ): string {
    return [
      `<etsi:SignedProperties Id="${id}">`,
      '<etsi:SignedSignatureProperties>',
      `<etsi:SigningTime>${signingTime}</etsi:SigningTime>`,
      '<etsi:SigningCertificate>',
      '<etsi:Cert>',
      '<etsi:CertDigest>',
      '<ds:DigestMethod Algorithm="http://www.w3.org/2000/09/xmldsig#sha1"/>',
      `<ds:DigestValue>${certDigest}</ds:DigestValue>`,
      '</etsi:CertDigest>',
      '<etsi:IssuerSerial>',
      `<ds:X509IssuerName>${issuerDN}</ds:X509IssuerName>`,
      `<ds:X509SerialNumber>${certSerial}</ds:X509SerialNumber>`,
      '</etsi:IssuerSerial>',
      '</etsi:Cert>',
      '</etsi:SigningCertificate>',
      '</etsi:SignedSignatureProperties>',
      '<etsi:SignedDataObjectProperties>',
      `<etsi:DataObjectFormat ObjectReference="#${documentReferenceId}">`,
      '<etsi:Description>contenido comprobante</etsi:Description>',
      '<etsi:MimeType>text/xml</etsi:MimeType>',
      '</etsi:DataObjectFormat>',
      '</etsi:SignedDataObjectProperties>',
      '</etsi:SignedProperties>',
    ].join('');
  }

  private extractFromP12(p12Buffer: Buffer, password: string) {
    try {
      const der = forge.util.createBuffer(p12Buffer.toString('binary'));
      const asn1 = forge.asn1.fromDer(der);
      const p12 = forge.pkcs12.pkcs12FromAsn1(asn1, password);

      const keyBags = p12.getBags({
        bagType: forge.pki.oids.pkcs8ShroudedKeyBag,
      });
      const privateKey = keyBags[forge.pki.oids.pkcs8ShroudedKeyBag]?.[0]?.key;

      const certBags = p12.getBags({ bagType: forge.pki.oids.certBag });
      const certificate = certBags[forge.pki.oids.certBag]?.[0]?.cert;

      if (!privateKey || !certificate) {
        throw new InternalServerErrorException(
          'Could not extract key/cert from .p12',
        );
      }

      return { privateKey, certificate };
    } catch (err) {
      throw new InternalServerErrorException(
        `Signing failed: ${(err as Error).message}`,
      );
    }
  }

  private sha1Base64(data: Buffer): string {
    return createHash('sha1').update(data).digest('base64');
  }

  private sha1CanonicalXml(xml: string): string {
    return this.sha1Base64(Buffer.from(this.canonicalizeXml(xml), 'utf8'));
  }

  private sha1CanonicalNode(
    xml: string,
    namespaceUri: string,
    localName: string,
  ): string {
    return this.sha1Base64(
      Buffer.from(this.canonicalizeNode(xml, namespaceUri, localName), 'utf8'),
    );
  }

  private canonicalizeXml(xml: string): string {
    const document = new DOMParser().parseFromString(xml, 'text/xml');
    const parseError = document.getElementsByTagName('parsererror')[0];
    if (parseError) {
      throw new InternalServerErrorException(
        `Signing failed: invalid XML fragment ${parseError.textContent}`,
      );
    }

    return new C14nCanonicalization().process(
      document.documentElement as unknown as Node,
      {},
    );
  }

  private canonicalizeNode(
    xml: string,
    namespaceUri: string,
    localName: string,
  ): string {
    const document = new DOMParser().parseFromString(xml, 'text/xml');
    const node = document.getElementsByTagNameNS(namespaceUri, localName)[0];
    if (!node) {
      throw new InternalServerErrorException(
        `Signing failed: ${localName} node not found`,
      );
    }

    return new C14nCanonicalization().process(node as unknown as Node, {
      ancestorNamespaces: this.findAncestorNamespaces(node),
    });
  }

  private withoutXmlDeclaration(xml: string): string {
    return xml.replace(/^<\?xml[^>]*>\s*/, '');
  }

  private injectSignature(xmlString: string, signatureXml: string): string {
    return xmlString.replace(/(<\/[^>]+>)\s*$/, `${signatureXml}$1`);
  }

  private formatSigningTime(date: Date): string {
    const offsetMinutes = -5 * 60;
    const local = new Date(date.getTime() + offsetMinutes * 60_000);
    const pad = (value: number) => String(value).padStart(2, '0');

    return (
      `${local.getUTCFullYear()}-${pad(local.getUTCMonth() + 1)}-${pad(local.getUTCDate())}` +
      `T${pad(local.getUTCHours())}:${pad(local.getUTCMinutes())}:${pad(local.getUTCSeconds())}-05:00`
    );
  }

  private formatIssuerName(certificate: forge.pki.Certificate): string {
    return certificate.issuer.attributes
      .slice()
      .reverse()
      .map(
        (attribute) =>
          `${this.attributeName(attribute)}=${this.attributeValue(attribute)}`,
      )
      .join(',');
  }

  private attributeName(attribute: forge.pki.CertificateField): string {
    return attribute.shortName ?? attribute.name ?? attribute.type ?? 'OID';
  }

  private attributeValue(attribute: forge.pki.CertificateField): string {
    const value = String(attribute.value);
    if (attribute.type === '2.5.4.97') {
      return this.derUtf8Hex(value);
    }

    return value.replace(/([,+"\\<>;])/g, '\\$1');
  }

  private derUtf8Hex(value: string): string {
    const valueHex = Buffer.from(value, 'utf8').toString('hex');
    const byteLength = valueHex.length / 2;
    const lengthHex =
      byteLength < 128
        ? byteLength.toString(16).padStart(2, '0')
        : `81${byteLength.toString(16).padStart(2, '0')}`;

    return `#0c${lengthHex}${valueHex}`;
  }

  private hexToDecimal(hex: string): string {
    return BigInt(`0x${hex}`).toString(10);
  }

  private findAncestorNamespaces(node: any): AncestorNamespace[] {
    const namespaces = new Map<string, string>();
    let parent = node.parentNode;

    while (parent && parent.nodeType === 1) {
      const element = parent as Element;
      for (let index = 0; index < element.attributes.length; index += 1) {
        const attr = element.attributes.item(index);
        if (!attr) continue;

        if (attr.name === 'xmlns') {
          if (!namespaces.has('')) namespaces.set('', attr.value);
        } else if (attr.prefix === 'xmlns') {
          if (!namespaces.has(attr.localName))
            namespaces.set(attr.localName, attr.value);
        }
      }

      parent = parent.parentNode;
    }

    return Array.from(namespaces.entries()).map(([prefix, namespaceURI]) => ({
      prefix,
      namespaceURI,
    }));
  }

  private randomNumber(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
}
