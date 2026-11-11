# Shri Kshetra Dattadham

Official static website for Shri Kshetra Dattadham, Govardhan, Nashik.

## Deployment

Deploy the repository root on Vercel and attach the intended Dattadham domain.

## Participation form

Both forms (the main site and `/gauganga`) post to a Google Apps Script web app, set as `LEADS_ENDPOINT` in `site.js` and `gauganga/site.js`. The script source is in `google-apps-script/Code.gs`; it is deployed from the spreadsheet's Extensions → Apps Script as a web app (Execute as: Me, Who has access: Anyone).

Each submission is appended to the `Leads` tab of the [form responses spreadsheet](https://docs.google.com/spreadsheets/d/10fRBc95EQOVkexpT9HdqX_q7HPO-k8i-IKBw4J2e-G0/edit), columns A:H:

1. Timestamp (India time)
2. Source
3. Name
4. Email
5. Phone
6. City
7. Participation
8. Message

Values are stored as plain text, so phone numbers keep `+` and leading zeros. After saving, the script sends a confirmation email to the visitor from the script owner's Gmail, with `Dattadham1008@gmail.com` as reply-to. The site shows a thank-you message once the row is saved, and says so if the email could not be sent.

To change the script, edit it in Apps Script, then use Deploy → Manage deployments → Edit → New version so the URL stays the same, and copy the change back into `google-apps-script/Code.gs`.

`api/leads.js` is an earlier Vercel function that writes through a service account. It is only used if `LEADS_ENDPOINT` is empty.
