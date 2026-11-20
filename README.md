# Shri Kshetra Dattadham

Official static website for Shri Kshetra Dattadham, Govardhan, Nashik.

## Deployment

Deploy the repository root on Vercel and attach the intended Dattadham domain.

## Participation form

Both forms (the main site and `/gauganga`) post to `/api/leads` (`api/leads.js`), which validates the input and saves it through `lib/store.js`:

- **Storage:** a private Vercel Blob store (`dattadham-leads`, Mumbai) connected to the Vercel project via `BLOB_READ_WRITE_TOKEN`; one JSON file per response under `leads/`. If `DATABASE_URL` or `POSTGRES_URL` is set (for example Neon Postgres from the Vercel Marketplace), a `leads` table is used instead.
- **Duplicates:** the same name, email, phone and message within 10 minutes is stored once.
- **Spam:** a hidden `company` field; submissions that fill it are dropped.
- **Viewing responses:** open `/admin` and enter the `ADMIN_KEY` (Vercel → Settings → Environment Variables) to see all responses and download a CSV. `GET /api/leads?format=csv` with an `x-admin-key` header returns the same CSV.
- **Confirmation email:** sent through Resend only when `RESEND_API_KEY` and `MAIL_FROM` are set; otherwise the form just shows the thank-you message.

Responses collected earlier in the Google Sheet (up to 12 Nov 2026) were imported, with repeat entries from the same email and phone merged into one.
