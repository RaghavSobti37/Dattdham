# Shri Kshetra Dattadham

Official static website for Shri Kshetra Dattadham, Govardhan, Nashik.

## Deployment

Deploy the repository root on Vercel and attach the intended Dattadham domain.

## Participation form

The participation form submits to `/api/leads`. Successful submissions are appended to the existing Google spreadsheet, in the existing `Leads` tab, using columns A:H in this order:

1. Timestamp
2. Source
3. Name
4. Email
5. Phone
6. City
7. Participation
8. Message

The API responds with `saved: true` after the spreadsheet append succeeds. It then attempts to send a confirmation email to the submitted email address. The website shows a thank-you message even if email delivery is temporarily unavailable, and clearly indicates when the email confirmation could not be sent.

## Vercel environment variables

Configure these under the Vercel project's Settings → Environment Variables, then redeploy:

### Google Sheets (required)

- `GOOGLE_SERVICE_ACCOUNT_EMAIL`
- `GOOGLE_PRIVATE_KEY` — the service account private key; preserve newlines or use escaped `\\n`
- `GOOGLE_SHEET_ID`

The Google service account must have Editor access to the existing spreadsheet. The API writes only to `Leads!A:H`.

### Confirmation email (required for live email delivery)

- `RESEND_API_KEY` — API key from the Resend account
- `MAIL_FROM` — a sender identity verified in Resend, for example `Shri Kshetra Dattadham <no-reply@dattadham.in>`

The sender domain must be verified in Resend before sending to arbitrary visitors. The API uses `Dattadham1008@gmail.com` as the reply-to address. No separate mailbox is required for the no-reply sender, but DNS access is required to verify the domain.
