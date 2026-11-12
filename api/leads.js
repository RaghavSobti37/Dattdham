// Receives website form submissions and forwards them, server to server, to the
// Google Apps Script web app (google-apps-script/Code.gs), which appends the row
// to the Leads sheet and emails the visitor a confirmation.
//
// The browser posts here (same origin) rather than to Google directly: Google's
// reply is a cross-site redirect that some mobile and in-app browsers refuse to
// read, which made visitors see an error even though their row had been saved.

const LEADS_SCRIPT_URL = process.env.LEADS_SCRIPT_URL
  || 'https://script.google.com/macros/s/AKfycbyplFa8tTPNO6j0YUq2_27aOS5qha_10_tjZZv4UovezVRvsqF0y_jQomiwbzA8MfzDiQ/exec';

const FIELDS = ['name', 'email', 'phone', 'city', 'participation', 'message', 'source'];
const clean = (value) => (typeof value === 'string' ? value.trim().slice(0, 2000) : '');

function readBody(request) {
  if (typeof request.body === 'string') return JSON.parse(request.body || '{}');
  return request.body || {};
}

module.exports = async (request, response) => {
  response.setHeader('Cache-Control', 'no-store');

  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return response.status(405).json({ error: 'Method not allowed' });
  }

  let body;
  try {
    body = readBody(request);
  } catch {
    return response.status(400).json({ error: 'Invalid request body' });
  }

  const lead = Object.fromEntries(FIELDS.map((field) => [field, clean(body[field])]));
  lead.email = lead.email.toLowerCase();
  lead.source = lead.source || 'Dattadham Website';

  if (!lead.name || !/^\S+@\S+\.\S+$/.test(lead.email) || !lead.phone) {
    return response.status(400).json({ error: 'Name, a valid email, and phone are required' });
  }

  let scriptResponse;
  let text = '';
  try {
    scriptResponse = await fetch(LEADS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(lead),
      redirect: 'follow',
      signal: AbortSignal.timeout(25000),
    });
    text = await scriptResponse.text();
  } catch (error) {
    console.error('Lead forward failed', error.name, error.message);
    return response.status(502).json({ error: 'Could not save your details' });
  }

  let result;
  try {
    result = JSON.parse(text);
  } catch {
    console.error('Lead forward got a non-JSON reply', scriptResponse.status, text.slice(0, 300));
    return response.status(502).json({ error: 'Could not save your details' });
  }

  if (!result.saved) {
    console.error('Lead not saved by script', JSON.stringify(result).slice(0, 300));
    return response.status(502).json({ error: result.error || 'Could not save your details' });
  }

  return response.status(201).json({ ok: true, saved: true, emailSent: Boolean(result.emailSent) });
};
