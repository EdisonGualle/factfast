import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { XmlParserService } from './src/modules/xml-parser/xml-parser.service';

const prisma = new PrismaClient();
const xmlParser = new XmlParserService();

async function procesarDirectorio(dirPath: string) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      await procesarDirectorio(fullPath);
    } else if (entry.isFile() && entry.name.endsWith('.xml')) {
      try {
        const xmlContent = fs.readFileSync(fullPath, 'utf8');
        const dataXml = xmlParser.parsearComprobanteRecibido(xmlContent);

        if (dataXml && dataXml.claveAcceso) {
          let fechaEmision = new Date();
          if (dataXml.fechaEmision) {
            const parts = dataXml.fechaEmision.split('/');
            if (parts.length === 3) {
              fechaEmision = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
            }
          }

          const importeTotal = dataXml.importeTotal || 0.00;
          const rucEmisor = dataXml.rucEmisor || '';
          const razonSocial = dataXml.razonSocialEmisor || 'PROVEEDOR EXTRACTO RPA';
          let tipoComprobante = 'FACTURA'; // Por defecto
          if (dataXml.codDoc === '01') tipoComprobante = 'FACTURA';
          if (dataXml.codDoc === '04') tipoComprobante = 'NOTA_CREDITO';
          if (dataXml.codDoc === '05') tipoComprobante = 'NOTA_DEBITO';
          if (dataXml.codDoc === '07') tipoComprobante = 'RETENCION';

          await prisma.comprobanteRecibido.upsert({
            where: { clave_acceso: dataXml.claveAcceso },
            update: {
              fecha_emision: fechaEmision,
              importe_total: importeTotal,
              ruc_emisor: rucEmisor,
              razon_social_emisor: razonSocial,
              tipo_comprobante: tipoComprobante as any,
              url_xml: fullPath,
            },
            create: {
              empresa_id: 'd9b89b4f-8b2b-42e2-9b24-7b952b1b3152', // Se actualizará si ya existe otra empresa por el upsert de arriba
              clave_acceso: dataXml.claveAcceso,
              tipo_comprobante: tipoComprobante as any,
              ruc_emisor: rucEmisor,
              razon_social_emisor: razonSocial,
              importe_total: importeTotal,
              fecha_emision: fechaEmision,
              numero_autorizacion: dataXml.claveAcceso,
              fecha_autorizacion: fechaEmision,
              url_xml: fullPath,
            }
          }).catch(() => {
             // Si falla el create por empresa_id estricto, ignoramos.
             // El objetivo es arreglar las fechas (update) de los que ya existen
          });

          // Actualizar con updateMany para ignorar restricciones de creación
          await prisma.comprobanteRecibido.updateMany({
            where: { clave_acceso: dataXml.claveAcceso },
            data: { fecha_emision: fechaEmision, url_xml: fullPath }
          });

          console.log(`Arreglado en BD: ${dataXml.claveAcceso} -> Fecha: ${fechaEmision.toISOString()}`);
        }
      } catch (err) {
        console.error(`Error procesando ${fullPath}: ${(err as Error).message}`);
      }
    }
  }
}

async function main() {
  console.log('--- INICIANDO REPARACIÓN DE FECHAS EN BASE DE DATOS ---');
  const storagePath = path.join(__dirname, 'storage', 'comprobantes');
  
  if (fs.existsSync(storagePath)) {
    await procesarDirectorio(storagePath);
  } else {
    console.log('No se encontró el directorio de storage.');
  }
  
  console.log('--- REPARACIÓN COMPLETADA ---');
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
