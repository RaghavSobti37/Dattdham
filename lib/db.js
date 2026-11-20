// Postgres (Neon, provisioned through the Vercel Marketplace) for form leads.
const { neon } = require('@neondatabase/serverless');

let sql;
let ready;

function db() {
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!url) throw new Error('DATABASE_URL is not set');
  sql = sql || neon(url);
  // Create the table on first use, once per warm instance.
  ready = ready || sql`
    CREATE TABLE IF NOT EXISTS leads (
      id            bigserial PRIMARY KEY,
      created_at    timestamptz NOT NULL DEFAULT now(),
      source        text NOT NULL,
      name          text NOT NULL,
      email         text NOT NULL,
      phone         text NOT NULL,
      city          text NOT NULL DEFAULT '',
      participation text NOT NULL DEFAULT '',
      message       text NOT NULL DEFAULT ''
    )`.catch((error) => { ready = null; throw error; });
  return ready.then(() => sql);
}

module.exports = { db };
