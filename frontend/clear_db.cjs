const { Client } = require('pg');
const client = new Client({
  host: 'dpg-d743hu94tr6s73civ140-a.oregon-postgres.render.com',
  port: 5432,
  database: 'crm_database_hr6t',
  user: 'crm_database_hr6t_user',
  password: 'YoXV1OYKoAA04aZf1bkLtSs74gXGfEdU'
});

(async () => {
  try {
    await client.connect();
    console.log('\n[1] Connected to PostgreSQL database');
    console.log('    Host: dpg-d743hu94tr6s73civ140-a.oregon-postgres.render.com');
    console.log('    Database: crm_database_hr6t\n');

    console.log('[2] Listing tables in public schema...');
    const tablesResult = await client.query('SELECT tablename FROM pg_tables WHERE schemaname = ' + "'public'");
    const tables = tablesResult.rows.map(row => row.tablename);
    console.log('    Found ' + tables.length + ' tables:');
    tables.forEach(t => console.log('      - ' + t));

    if (tables.length > 0) {
      console.log('\n[3] Dropping all tables...');
      const dropStatements = tables.map(t => 'DROP TABLE IF EXISTS "' + t + '" CASCADE').join('; ');
      await client.query(dropStatements);
      console.log('    ? All tables dropped successfully');
    } else {
      console.log('\n[3] No tables to drop');
    }

    console.log('\n[4] Verifying database is empty...');
    const verifyResult = await client.query('SELECT tablename FROM pg_tables WHERE schemaname = ' + "'public'");
    if (verifyResult.rows.length === 0) {
      console.log('    ? Database is clean - all tables removed');
    } else {
      console.log('    ? Warning: ' + verifyResult.rows.length + ' tables still exist');
    }

    console.log('\n--------------------------------------------');
    console.log('DATABASE CLEANUP COMPLETE');
    console.log('--------------------------------------------');
    console.log('\nSummary:');
    console.log('  Tables dropped: ' + tables.length);
    console.log('  Remaining tables: ' + verifyResult.rows.length);
    console.log('\nNote: Hibernate will recreate tables when the application starts');
    console.log('--------------------------------------------\n');

  } catch (error) {
    console.error('\n? Error:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await client.end();
  }
})();
