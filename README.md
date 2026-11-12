# Shri Kshetra Dattadham

Official static website for Shri Kshetra Dattadham, Govardhan, Nashik.

## Deployment

Deploy the repository root on Vercel and attach the intended Dattadham domain.

## Participation form

Both forms (the main site and `/gauganga`) post to `/api/leads` on this site. That Vercel function (`api/leads.js`) checks the input and forwards it, server to server, to a Google Apps Script web app (`google-apps-script/Code.gs`, deployed from the spreadsheet's Extensions → Apps Script as a web app: Execute as Me, access Anyone). The browser never talks to Google directly: Google's reply is a cross-site redirect that some mobile and in-app browsers refuse to read, which used to show visitors an error even though their row was saved.

The script appends each submission to the `Leads` tab of the [form responses spreadsheet](https://docs.google.com/spreadsheets/d/10fRBc95EQOVkexpT9HdqX_q7HPO-k8i-IKBw4J2e-G0/edit), columns A:H: Timestamp (India time), Source, Name, Email, Phone, City, Participation, Message. Values are stored as plain text, so phone numbers keep `+` and leading zeros. Participation is always saved in English, whichever language the visitor uses.

After saving, the script emails the visitor a confirmation from the script owner's Gmail, with `Dattadham1008@gmail.com` as reply-to. The site shows a thank-you message once the row is saved, and says so if the email could not be sent.

To change the script, edit it in Apps Script, then use Deploy → Manage deployments → Edit → New version so the URL stays the same, and copy the change back into `google-apps-script/Code.gs`. If the URL ever changes, set it as `LEADS_SCRIPT_URL` in Vercel or update the default in `api/leads.js`.
