import 'dotenv/config';
import { PrismaClient, RolUsuario } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

const CORREO = process.env.SEED_ADMIN_EMAIL ?? 'admin@test.com';
const CONTRASENA = process.env.SEED_ADMIN_PASSWORD ?? '12345678';
const NOMBRE = process.env.SEED_ADMIN_NOMBRE ?? 'Administrador Principal';

async function main() {
  const hash = await bcrypt.hash(CONTRASENA, 12);

  // 1. Crear Planes por Defecto
  const planTrial = await prisma.plan.upsert({
    where: { slug: 'trial' },
    update: {},
    create: {
      nombre: 'Plan Trial (Prueba)',
      slug: 'trial',
      descripcion: 'Prueba gratuita de 30 días con características completas',
      precio_mensual: 0,
      max_empresas: 1,
      max_sucursales: 2,
      max_cajas: 2,
      max_usuarios: 3,
      max_comprobantes_mes: 50,
      max_productos: 100,
      max_bodegas: 2,
      incluye_api: false,
      incluye_webhooks: false,
      incluye_lotes: false,
      incluye_reportes_avanzados: false,
      activo: true,
    },
  });

  const planBasico = await prisma.plan.upsert({
    where: { slug: 'basico' },
    update: {},
    create: {
      nombre: 'Plan Emprendedor (Básico)',
      slug: 'basico',
      descripcion: 'Para pequeños negocios y emprendedores en crecimiento',
      precio_mensual: 19.99,
      max_empresas: 1,
      max_sucursales: 2,
      max_cajas: 2,
      max_usuarios: 5,
      max_comprobantes_mes: 200,
      max_productos: 500,
      max_bodegas: 2,
      incluye_api: false,
      incluye_webhooks: false,
      incluye_lotes: false,
      incluye_reportes_avanzados: false,
      activo: true,
    },
  });

  const planPremium = await prisma.plan.upsert({
    where: { slug: 'premium' },
    update: {},
    create: {
      nombre: 'Plan Corporativo (Premium)',
      slug: 'premium',
      descripcion: 'Acceso ilimitado y APIs para integraciones complejas',
      precio_mensual: 49.99,
      max_empresas: 5,
      max_sucursales: 10,
      max_cajas: 10,
      max_usuarios: 20,
      max_comprobantes_mes: 5000,
      max_productos: 5000,
      max_bodegas: 10,
      incluye_api: true,
      incluye_webhooks: true,
      incluye_lotes: true,
      incluye_reportes_avanzados: true,
      activo: true,
    },
  });

  console.log('✔  Planes por defecto creados');

  const usuario = await prisma.usuario.upsert({
    where: { correo: CORREO },
    update: {
      hash_contrasena: hash,
      rol: RolUsuario.SUPERADMIN,
      activo: true,
    },
    create: {
      correo: CORREO,
      hash_contrasena: hash,
      nombre_completo: NOMBRE,
      rol: RolUsuario.SUPERADMIN,
      activo: true,
      empresa_id: null,
    },
  });

  console.log('\n✔  Superadmin listo');
  console.log(`   Correo    : ${usuario.correo}`);
  console.log(`   Contraseña: ${CONTRASENA}`);
  console.log(`   ID        : ${usuario.id}`);
  console.log('\n   Cambia la contraseña en producción.\n');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
