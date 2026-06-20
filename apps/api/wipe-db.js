const { Client } = require('pg');

async function wipeDB() {
  const client = new Client({
    user: 'postgres',
    password: 'Rodrigo505040',
    host: 'localhost',
    port: 5432,
    database: 'api-facturacion'
  });

  try {
    await client.connect();
    console.log("Conectado a PostgreSQL...");

    const res = await client.query('DELETE FROM comprobantes_recibidos');
    console.log(`¡Limpieza completada! Se eliminaron ${res.rowCount} comprobantes_recibidos defectuosos.`);

  } catch (err) {
    console.error("Error al limpiar:", err);
  } finally {
    await client.end();
  }
}

wipeDB();
