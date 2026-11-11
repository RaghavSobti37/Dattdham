/**
 * Dattadham website form receiver.
 *
 * Deploy: Deploy > New deployment > Web app
 *   Execute as: Me
 *   Who has access: Anyone
 * Then put the web app URL in LEADS_ENDPOINT in site.js and gauganga/site.js.
 */
const SPREADSHEET_ID = '10fRBc95EQOVkexpT9HdqX_q7HPO-k8i-IKBw4J2e-G0';
const SHEET_NAME = 'Leads';
const HEADERS = ['Timestamp', 'Source', 'Name', 'Email', 'Phone', 'City', 'Participation', 'Message'];
const REPLY_TO = 'Dattadham1008@gmail.com';

function clean(value) {
  return typeof value === 'string' ? value.trim().slice(0, 2000) : '';
}

// Keep visitor input as text: never evaluate "=..." as a formula.
function asText(value) {
  return /^[=+\-@]/.test(value) ? "'" + value : value;
}

function escapeHtml(value) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function json(body) {
  return ContentService.createTextOutput(JSON.stringify(body)).setMimeType(ContentService.MimeType.JSON);
}

function getSheet() {
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = spreadsheet.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = spreadsheet.insertSheet(SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function sendConfirmationEmail(name, email, participation) {
  const interest = participation || 'Participation';
  const text = [
    'Namaste ' + name + ',', '',
    'Thank you for connecting with Shri Kshetra Dattadham and the GauGanga Sankalp.',
    'We have received your interest in: ' + interest + '.', '',
    'Our team will be in touch with you soon.', '',
    'With regards,', 'Shri Kshetra Dattadham', 'Govardhan, Nashik',
  ].join('\n');
  const html = '<div style="font-family:Georgia,serif;color:#29231f;max-width:600px;margin:0 auto;padding:28px;border-top:5px solid #a71922;background:#fff">'
    + '<p style="margin:0 0 8px;color:#a71922;font:12px Arial,sans-serif;letter-spacing:2px;text-transform:uppercase">Shri Kshetra Dattadham</p>'
    + '<h1 style="margin:0 0 24px;font-size:26px;font-weight:normal">Thank you for joining the Sankalp.</h1>'
    + '<p style="font-size:16px;line-height:1.7">Namaste ' + escapeHtml(name) + ',</p>'
    + '<p style="font-size:16px;line-height:1.7">Thank you for connecting with Shri Kshetra Dattadham and the GauGanga Sankalp. We have received your interest in <strong>' + escapeHtml(interest) + '</strong>.</p>'
    + '<p style="font-size:16px;line-height:1.7">Our team will be in touch with you soon.</p>'
    + '<p style="margin:28px 0 0;font-size:15px;line-height:1.7">With regards,<br><strong>Shri Kshetra Dattadham</strong><br>Govardhan, Nashik</p></div>';
  try {
    MailApp.sendEmail({
      to: email,
      subject: 'Thank you for connecting with Shri Kshetra Dattadham',
      body: text,
      htmlBody: html,
      name: 'Shri Kshetra Dattadham',
      replyTo: REPLY_TO,
    });
    return true;
  } catch (error) {
    console.error('Confirmation email failed: ' + error);
    return false;
  }
}

function doPost(e) {
  let data;
  try {
    data = JSON.parse((e && e.postData && e.postData.contents) || '{}');
  } catch (error) {
    return json({ ok: false, error: 'Invalid request body' });
  }

  const name = clean(data.name);
  const email = clean(data.email).toLowerCase();
  const phone = clean(data.phone);
  const source = clean(data.source) || 'Dattadham Website';
  const city = clean(data.city);
  const participation = clean(data.participation);
  const message = clean(data.message);

  if (!name || !/^\S+@\S+\.\S+$/.test(email) || !phone) {
    return json({ ok: false, error: 'Name, a valid email, and phone are required' });
  }

  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
    const sheet = getSheet();
    const row = sheet.getLastRow() + 1;
    const timestamp = Utilities.formatDate(new Date(), 'Asia/Kolkata', 'yyyy-MM-dd HH:mm:ss');
    sheet.getRange(row, 1, 1, HEADERS.length)
      .setNumberFormat('@')
      .setValues([[timestamp, source, name, email, phone, city, participation, message].map(asText)]);
    SpreadsheetApp.flush();
  } catch (error) {
    console.error('Lead save failed: ' + error);
    return json({ ok: false, error: 'Could not save your details' });
  } finally {
    lock.releaseLock();
  }

  const emailSent = sendConfirmationEmail(name, email, participation);
  return json({ ok: true, saved: true, emailSent: emailSent });
}

function doGet() {
  return json({ ok: true, service: 'Dattadham leads' });
}
