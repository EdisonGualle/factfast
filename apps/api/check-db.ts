import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const recibidos = await prisma.comprobanteRecibido.findMany();
  console.log('Total recibidos en DB:', recibidos.length);
  if (recibidos.length > 0) {
    console.log('Muestra del primero:');
    console.log(recibidos[0]);
  }
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
