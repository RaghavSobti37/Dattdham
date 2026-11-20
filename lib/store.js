// Storage for website form leads.
// - Vercel Blob (private store, BLOB_READ_WRITE_TOKEN): one JSON file per lead.
// - Postgres (DATABASE_URL / POSTGRES_URL, e.g. Neon from the Vercel Marketplace) is used
//   instead whenever it is configured.
const crypto = require('crypto');

const DEDUPE_WINDOW_MS = 10 * 60 * 1000;
const COLUMNS = ['source', 'name', 'email', 'phone', 'city', 'participation', 'message'];

// ---------- Postgres ----------
let sql;
let tableReady;
function postgres() {
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!url) return null;
  if (!sql) sql = require('@neondatabase/serverless').neon(url);
  tableReady = tableReady || sql`
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
    )`.catch((error) => { tableReady = null; throw error; });
  return tableReady.then(() => sql);
}

async function saveToPostgres(db, lead) {
  const recent = await db`
    SELECT id FROM leads
    WHERE email = ${lead.email} AND phone = ${lead.phone} AND name = ${lead.name}
      AND message = ${lead.message} AND created_at > now() - interval '10 minutes'
    LIMIT 1`;
  if (recent.length) return { duplicate: true };
  await db`
    INSERT INTO leads (source, name, email, phone, city, participation, message)
    VALUES (${lead.source}, ${lead.name}, ${lead.email}, ${lead.phone}, ${lead.city}, ${lead.participation}, ${lead.message})`;
  return { duplicate: false };
}

// ---------- Vercel Blob ----------
function blob() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return null;
  return require('@vercel/blob');
}

async function saveToBlob(api, lead) {
  const now = Date.now();
  // Same person + same message inside one 10-minute window maps to the same file,
  // so a double tap or retry is stored once.
  const window = Math.floor(now / DEDUPE_WINDOW_MS);
  const fingerprint = crypto.createHash('sha256')
    .update([lead.email, lead.phone, lead.name, lead.message, window].join('\u0000'))
    .digest('hex').slice(0, 20);
  const stamp = new Date(window * DEDUPE_WINDOW_MS).toISOString().slice(0, 16).replace(/:/g, '');
  const pathname = `leads/${stamp}-${fingerprint}.json`;
  const record = { created_at: new Date(now).toISOString(), ...Object.fromEntries(COLUMNS.map((c) => [c, lead[c]])) };
  try {
    await api.put(pathname, JSON.stringify(record), {
      access: 'private',
      contentType: 'application/json',
      addRandomSuffix: false,
      allowOverwrite: false,
    });
    return { duplicate: false };
  } catch (error) {
    // Already stored in this window: treat as success.
    const existing = await api.head(pathname).catch(() => null);
    if (existing) return { duplicate: true };
    throw error;
  }
}

async function readBlobJson(api, pathname) {
  const result = await api.get(pathname, { access: 'private', useCache: false });
  if (!result) return null;
  return JSON.parse(await new Response(result.stream).text());
}

async function listFromBlob(api) {
  const items = [];
  let cursor;
  do {
    const page = await api.list({ prefix: 'leads/', cursor, limit: 1000 });
    items.push(...page.blobs);
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);

  const records = [];
  for (let i = 0; i < items.length; i += 15) {
    const batch = await Promise.all(items.slice(i, i + 15).map((item) => readBlobJson(api, item.pathname).catch(() => null)));
    records.push(...batch.filter(Boolean));
  }
  records.sort((a, b) => a.created_at.localeCompare(b.created_at));
  return records.map((record, index) => ({ id: index + 1, ...record })).reverse();
}

// ---------- public API ----------
async function saveLead(lead) {
  const pg = postgres();
  if (pg) return saveToPostgres(await pg, lead);
  const api = blob();
  if (api) return saveToBlob(api, lead);
  throw new Error('No lead storage is configured');
}

async function listLeads() {
  const pg = postgres();
  if (pg) {
    const db = await pg;
    return db`SELECT id, created_at, source, name, email, phone, city, participation, message FROM leads ORDER BY id DESC LIMIT 10000`;
  }
  const api = blob();
  if (api) return listFromBlob(api);
  throw new Error('No lead storage is configured');
}

module.exports = { saveLead, listLeads };
