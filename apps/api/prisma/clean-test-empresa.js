const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  // Ver todas las empresas
  const empresas = await p.empresa.findMany({ select: { id: true, ruc: true, razon_social: true, tenant_id: true } });
  console.log('Empresas en BD:', JSON.stringify(empresas, null, 2));
  
  // Limpiar empresas de prueba (RUC de prueba conocido)
  const rucPrueba = '0705871689001';
  const deleted = await p.empresa.deleteMany({ where: { ruc: rucPrueba } });
  console.log(`Empresas eliminadas con RUC ${rucPrueba}:`, deleted.count);
  
  await p.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
