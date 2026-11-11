const { google } = require('googleapis');

// Existing Dattadham response spreadsheet. Keep the environment override for deployments.
const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID || '10fRBc95EQOVkexpT9HdqX_q7HPO-k8i-IKBw4J2e-G0';

// Accepts the key with real newlines, escaped "\\n", or wrapped in quotes.
const normalizePrivateKey = (value) => value
  .trim()
  .replace(/^["']|["']$/g, '')
  .replace(/\\n/g, '\n');

const clean = (value) => (typeof value === 'string' ? value.trim() : '');
const escapeHtml = (value) => clean(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

async function sendConfirmationEmail({ name, email, participation }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.MAIL_FROM;

  if (!apiKey || !from) {
    console.warn('Lead saved, but confirmation email is not configured');
    return false;
  }

  const safeName = escapeHtml(name);
  const safeParticipation = escapeHtml(participation || 'Participation');
  const text = [
    `Namaste ${name},`,
    '',
    'Thank you for connecting with Shri Kshetra Dattadham and the GauGanga Sankalp.',
    `We have received your interest in: ${participation || 'Participation'}.`,
    '',
    'Our team will be in touch with you soon.',
    '',
    'With regards,',
    'Shri Kshetra Dattadham',
    'Govardhan, Nashik',
  ].join('\n');

  const html = `<!doctype html>
<html lang="en">
  <body style="margin:0;padding:32px 16px;background:#f7f4ef;font-family:Georgia,serif;color:#29231f">
    <table role="presentation" style="width:100%;max-width:600px;margin:0 auto;background:#fff;border-collapse:collapse">
      <tr><td style="padding:32px 28px;border-top:5px solid #a71922">
        <p style="margin:0 0 8px;color:#a71922;font:12px Arial,sans-serif;letter-spacing:2px;text-transform:uppercase">Shri Kshetra Dattadham</p>
        <h1 style="margin:0 0 24px;font-size:28px;font-weight:normal">Thank you for joining the Sankalp.</h1>
        <p style="font-size:16px;line-height:1.7">Namaste ${safeName},</p>
        <p style="font-size:16px;line-height:1.7">Thank you for connecting with Shri Kshetra Dattadham and the GauGanga Sankalp. We have received your interest in <strong>${safeParticipation}</strong>.</p>
        <p style="font-size:16px;line-height:1.7">Our team will be in touch with you soon.</p>
        <p style="margin:28px 0 0;font-size:15px;line-height:1.7">With regards,<br><strong>Shri Kshetra Dattadham</strong><br>Govardhan, Nashik</p>
      </td></tr>
      <tr><td style="padding:18px 28px;background:#f7f4ef;color:#746b64;font:12px Arial,sans-serif">Sankalp · Seva · Sanvardhan</td></tr>
    </table>
  </body>
</html>`;

  try {
    const mailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [email],
        reply_to: 'Dattadham1008@gmail.com',
        subject: 'Thank you for connecting with Shri Kshetra Dattadham',
        text,
        html,
      }),
    });

    if (!mailResponse.ok) {
      const errorBody = await mailResponse.text();
      console.error('Confirmation email failed', mailResponse.status, errorBody);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Confirmation email failed', error.message);
    return false;
  }
}

module.exports = async (request, response) => {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method not allowed' });
  }

  let body;
  try {
    body = typeof request.body === 'string'
      ? JSON.parse(request.body)
      : (request.body || {});
  } catch {
    return response.status(400).json({ error: 'Invalid request body' });
  }

  const name = clean(body.name);
  const email = clean(body.email).toLowerCase();
  const phone = clean(body.phone);
  const source = clean(body.source) || 'Dattadham Website';
  const city = clean(body.city);
  const participation = clean(body.participation);
  const message = clean(body.message);

  if (!name || !/^\S+@\S+\.\S+$/.test(email) || !phone) {
    return response.status(400).json({
      error: 'Name, a valid email, and phone are required',
    });
  }

  if (
    !process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
    || !process.env.GOOGLE_PRIVATE_KEY
  ) {
    console.error('Lead submission failed: Google Sheets environment variables are missing');
    return response.status(503).json({ error: 'Submission service is not configured' });
  }

  try {
    const auth = new google.auth.JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: normalizePrivateKey(process.env.GOOGLE_PRIVATE_KEY),
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    await google.sheets({ version: 'v4', auth }).spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Leads!A:H',
      // RAW keeps visitor input as plain text: phone numbers keep "+" and leading
      // zeros, and values starting with "=" are never evaluated as formulas.
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      requestBody: {
        values: [[
          new Date().toISOString(),
          source,
          name,
          email,
          phone,
          city,
          participation,
          message,
        ]],
      },
    });

    const emailSent = await sendConfirmationEmail({
      name,
      email,
      participation,
    });

    return response.status(201).json({
      ok: true,
      saved: true,
      emailSent,
    });
  } catch (error) {
    console.error('Lead submission failed', error.message);
    return response.status(503).json({ error: 'Could not save your details' });
  }
};
