const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const NEON_URL = "postgresql://neondb_owner:npg_w2sxnhqdtf6i@ep-young-thunder-ape551ax.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require";

async function importData() {
  const client = new Client({ connectionString: NEON_URL });
  await client.connect();
  console.log('Connected to Neon');

  // Truncate all tables in reverse dependency order
  const truncateOrder = [
    'TicketComment', 'TicketHistory', 'Ticket',
    'LoginHistory', 'Trade', 'UserBrokerAccount',
    'Subscription', 'Note', 'Broker', 'User'
  ];

  console.log('Truncating existing data...');
  const existingTables = await client.query(
    "SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public'"
  );
  const tableNames = existingTables.rows.map(r => r.tablename);

  for (const t of truncateOrder) {
    if (tableNames.includes(t)) {
      await client.query(`TRUNCATE TABLE "${t}" CASCADE`);
      console.log(`  Truncated ${t}`);
    }
  }

  // Read dump file
  const sqlPath = path.join(__dirname, '..', 'trading_data.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  // Split by INSERT statements
  const statements = sql.split('\n').filter(line => line.trim().startsWith('INSERT INTO'));

  console.log(`\nImporting ${statements.length} rows...`);
  let imported = 0;
  let errors = 0;

  for (const stmt of statements) {
    try {
      await client.query(stmt);
      imported++;
    } catch (err) {
      errors++;
      if (errors <= 5) {
        console.error(`Error on statement ${imported + errors}: ${err.message}`);
      }
      if (errors > 50) {
        console.error('Too many errors, aborting');
        break;
      }
    }
  }

  await client.end();
  console.log(`\nImport complete: ${imported} rows imported, ${errors} errors`);

  // Print summary
  const verifyClient = new Client({ connectionString: NEON_URL });
  await verifyClient.connect();
  console.log('\n--- Neon Row Counts ---');
  for (const t of ['User','Broker','Note','Subscription','UserBrokerAccount','Trade','LoginHistory']) {
    try {
      const r = await verifyClient.query(`SELECT COUNT(*) FROM "${t}"`);
      console.log(`  ${t}: ${r.rows[0].count}`);
    } catch (e) {}
  }
  await verifyClient.end();
}

importData().catch(err => {
  console.error('Import failed:', err);
  process.exit(1);
});