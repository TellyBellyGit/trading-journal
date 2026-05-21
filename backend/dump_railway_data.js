const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const RAILWAY_URL = "postgresql://postgres:xWsCOGvmCZblVHNgytuBUrTfOmmlPLob@crossover.proxy.rlwy.net:20318/railway";

function escapeString(val) {
  // Escape backslashes, single quotes, and convert newlines to literal \n
  return val
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "''")
    .replace(/\r/g, '\\r')
    .replace(/\n/g, '\\n');
}

function formatValue(col, val) {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'object' && val.constructor && val.constructor.name === 'Date') {
    return `'${val.toISOString()}'`;
  }
  if (typeof val === 'string') return `E'${escapeString(val)}'`;
  if (typeof val === 'boolean') return val ? 'true' : 'false';
  if (typeof val === 'number') {
    if (isNaN(val)) return 'NULL';
    if (!isFinite(val)) return 'NULL';
    return String(val);
  }
  return `'${escapeString(String(val))}'`;
}

function buildInsert(table, columns, row) {
  const vals = columns.map(col => formatValue(col, row[col]));
  return `INSERT INTO "${table}" (${columns.map(c => `"${c}"`).join(', ')}) VALUES (${vals.join(', ')});\n`;
}

async function dump() {
  const client = new Client({ connectionString: RAILWAY_URL });
  await client.connect();
  console.log('Connected to Railway');

  const outputPath = path.join(__dirname, '..', 'trading_data.sql');
  const stream = fs.createWriteStream(outputPath);
  stream.write('-- Data dump from Railway PostgreSQL\n');
  stream.write('-- Generated: ' + new Date().toISOString() + '\n\n');

  // Process tables in dependency order to avoid FK issues
  const tableOrder = [
    'User', 'Broker', 'Note', 'Subscription', 'UserBrokerAccount',
    'Trade', 'LoginHistory', 'Ticket', 'TicketHistory', 'TicketComment'
  ];

  for (const tableName of tableOrder) {
    try {
      const { rows } = await client.query(`SELECT * FROM "${tableName}"`);
      if (rows.length === 0) {
        console.log(`  ${tableName}: 0 rows (empty)`);
        continue;
      }

      const columns = Object.keys(rows[0]);
      stream.write(`-- Table: ${tableName} (${rows.length} rows)\n`);
      for (const row of rows) {
        stream.write(buildInsert(tableName, columns, row));
      }
      stream.write('\n');
      console.log(`  ${tableName}: ${rows.length} rows dumped`);
    } catch (err) {
      console.error(`  ${tableName}: ERROR - ${err.message}`);
    }
  }

  stream.end();
  await client.end();
  console.log(`\nDump written to ${outputPath}`);
}

dump().catch(err => {
  console.error('Dump failed:', err);
  process.exit(1);
});