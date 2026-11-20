// Website form leads.
//   POST /api/leads               save a submission (both site forms post here)
//   GET  /api/leads?format=csv    export, requires the ADMIN_KEY (x-admin-key header or ?key=)
const crypto = require('crypto');
const { db } = require('../lib/db');

const FIELDS = ['name', 'email', 'phone', 'city', 'participation', 'message', 'source'];
const clean = (value) => (typeof value === 'string' ? value.trim().slice(0, 2000) : '');

function readBody(request) {
  if (typeof request.body === 'string') return JSON.parse(request.body || '{}');
  return request.body || {};
}

function isAdmin(request) {
  const expected = process.env.ADMIN_KEY || '';
  const given = String(request.headers['x-admin-key'] || request.query?.key || '');
  if (!expected || given.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(given), Buffer.from(expected));
}

const csvCell = (value) => {
  let text = value instanceof Date ? value.toISOString() : String(value ?? '');
  // Keep spreadsheet apps from running text as a formula; phone numbers like +91 stay as they are.
  if (/^[=@]|^[+\-]\s*[^\d\s]/.test(text)) text = `'${text}`;
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

async function sendConfirmationEmail({ name, email, participation }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.MAIL_FROM;
  if (!apiKey || !from) return null; // email not configured
  try {
    const result = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from,
        to: [email],
        reply_to: 'Dattadham1008@gmail.com',
        subject: 'Thank you for connecting with Shri Kshetra Dattadham',
        text: `Namaste ${name},\n\nThank you for connecting with Shri Kshetra Dattadham and the GauGanga Sankalp.\nWe have received your interest in: ${participation || 'Participation'}.\n\nOur team will be in touch with you soon.\n\nWith regards,\nShri Kshetra Dattadham\nGovardhan, Nashik`,
      }),
      signal: AbortSignal.timeout(8000),
    });
    return result.ok;
  } catch {
    return false;
  }
}

async function exportLeads(request, response) {
  if (!isAdmin(request)) return response.status(401).json({ error: 'Unauthorized' });
  const sql = await db();
  const rows = await sql`
    SELECT id, created_at, source, name, email, phone, city, participation, message
    FROM leads ORDER BY id DESC LIMIT 10000`;
  if (request.query?.format === 'csv') {
    const header = ['ID', 'Timestamp (IST)', 'Source', 'Name', 'Email', 'Phone', 'City', 'Participation', 'Message'];
    const ist = (d) => new Date(d).toLocaleString('sv-SE', { timeZone: 'Asia/Kolkata' });
    const lines = [header, ...rows.slice().reverse().map((r) => [r.id, ist(r.created_at), r.source, r.name, r.email, r.phone, r.city, r.participation, r.message])]
      .map((row) => row.map(csvCell).join(','));
    response.setHeader('Content-Type', 'text/csv; charset=utf-8');
    response.setHeader('Content-Disposition', `attachment; filename="dattadham-leads-${new Date().toISOString().slice(0, 10)}.csv"`);
    return response.status(200).send(`﻿${lines.join('\r\n')}\r\n`);
  }
  return response.status(200).json({ count: rows.length, leads: rows });
}

module.exports = async (request, response) => {
  response.setHeader('Cache-Control', 'no-store');

  try {
    if (request.method === 'GET') return await exportLeads(request, response);
  } catch (error) {
    console.error('Lead export failed', error.message);
    return response.status(500).json({ error: 'Export failed' });
  }

  if (request.method !== 'POST') {
    response.setHeader('Allow', 'GET, POST');
    return response.status(405).json({ error: 'Method not allowed' });
  }

  let body;
  try {
    body = readBody(request);
  } catch {
    return response.status(400).json({ error: 'Invalid request body' });
  }

  // Hidden field that people never see; bots that fill every field get a quiet success.
  if (clean(body.company)) return response.status(201).json({ ok: true, saved: true });

  const lead = Object.fromEntries(FIELDS.map((field) => [field, clean(body[field])]));
  lead.email = lead.email.toLowerCase();
  lead.source = lead.source || 'Dattadham Website';

  if (!lead.name || !/^\S+@\S+\.\S+$/.test(lead.email) || !lead.phone) {
    return response.status(400).json({ error: 'Name, a valid email, and phone are required' });
  }

  try {
    const sql = await db();
    // A repeat of the same person within 10 minutes (double tap, retry) is not stored twice.
    const recent = await sql`
      SELECT id FROM leads
      WHERE email = ${lead.email} AND phone = ${lead.phone} AND name = ${lead.name}
        AND message = ${lead.message} AND created_at > now() - interval '10 minutes'
      LIMIT 1`;
    if (!recent.length) {
      await sql`
        INSERT INTO leads (source, name, email, phone, city, participation, message)
        VALUES (${lead.source}, ${lead.name}, ${lead.email}, ${lead.phone}, ${lead.city}, ${lead.participation}, ${lead.message})`;
    }
  } catch (error) {
    console.error('Lead save failed', error.message);
    return response.status(503).json({ error: 'Could not save your details' });
  }

  const emailSent = await sendConfirmationEmail(lead);
  return response.status(201).json({ ok: true, saved: true, emailSent });
};
