const { Client } = require('pg');
const NEON_URL = "postgresql://neondb_owner:npg_w2sxnhqdtf6i@ep-young-thunder-ape551ax.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require";

async function verify() {
  const client = new Client({ connectionString: NEON_URL });
  await client.connect();

  const tables = ['User','Broker','Note','Subscription','UserBrokerAccount','Trade','LoginHistory','Ticket','TicketHistory','TicketComment'];
  for (const t of tables) {
    try {
      const r = await client.query(`SELECT COUNT(*) FROM "${t}"`);
      console.log(`${t}: ${r.rows[0].count} rows`);
    } catch (e) {
      console.log(`${t}: ERROR - ${e.message}`);
    }
  }
  await client.end();
}
verify();