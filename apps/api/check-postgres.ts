import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function check() {
  const recibidos = await prisma.comprobanteRecibido.findMany({
    orderBy: { fecha_emision: 'desc' },
    take: 5
  });
  
  if (recibidos.length === 0) {
    console.log("No hay comprobantes recibidos en la base de datos.");
    return;
  }
  
  console.log("Últimos comprobantes recibidos en BD:");
  for (const c of recibidos) {
    console.log(`- Clave: ${c.clave_acceso.substring(0,20)}... | Fecha: ${c.fecha_emision.toISOString()} | Total: ${c.importe_total}`);
  }
}

check()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
