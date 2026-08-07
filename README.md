# 2factor

A personal, self-hosted 2FA authenticator. Add TOTP secrets (the same kind
scanned via QR code into Google Authenticator / Authy) for other apps and
get their 6-digit codes, behind a PIN.

## How it's secured

- **Access is gated by a PIN** you set as the `APP_PIN` environment variable.
  It's checked with a constant-time comparison and a login endpoint that
  locks out for 30s after 5 failed attempts in a row.
- **Secrets are encrypted at rest** with AES-256-GCM using a separate
  `ENCRYPTION_KEY` env var — not the PIN. A short PIN is easy to type but has
  little entropy, so it's kept purely as an access gate; the vault's actual
  encryption key is a full 256-bit key you generate once and never type.
- **Sessions** are a signed, expiring cookie (HMAC-SHA256, 12h) set after a
  correct PIN; `middleware`/`proxy` rejects every route and API call without
  one.
- Nothing is ever written to disk or Blob storage unencrypted.

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Generate secrets and create `.env.local` (see `.env.example`):

   ```bash
   cp .env.example .env.local
   openssl rand -base64 32   # use for SESSION_SECRET
   openssl rand -base64 32   # use for ENCRYPTION_KEY
   ```

   Set `APP_PIN` to whatever PIN you want to type to unlock the app.

3. Run it locally:

   ```bash
   npm run dev
   ```

   Locally (no `BLOB_READ_WRITE_TOKEN` set), the encrypted vault is stored at
   `.data/vault.enc.json`, gitignored.

## Deploying to Vercel

1. Push this repo to Vercel (import the git repo, or `vercel --prod`).
2. In the project's **Settings → Environment Variables**, set `APP_PIN`,
   `SESSION_SECRET`, and `ENCRYPTION_KEY` (same values/process as above —
   generate fresh ones for production, don't reuse local dev values).
3. In the project's **Storage** tab, create a **Blob** store and connect it
   to this project. Vercel injects `BLOB_READ_WRITE_TOKEN` automatically —
   that's what the app uses to persist your encrypted vault across
   deployments and serverless invocations (the free tier is plenty for this).
4. Redeploy so the new env vars/storage connection take effect.

## Adding an account

Click **+ Add account**, then either:

- **Enter secret**: paste the base32 secret key the other service shows you
  ("can't scan the QR code?" / "enter this key manually"), plus a name.
- **Upload QR image**: screenshot or save the QR code the service shows and
  upload it — it's decoded entirely in your browser, nothing is sent
  anywhere until you submit the parsed account.

Codes refresh every 30 seconds; click a code to copy it.

## Notes / limitations

- This is built for one user (you). There's no multi-user support, and the
  login rate limit is a soft, cookie-based throttle rather than a hardened
  brute-force defense — pick a PIN with reasonable length (6+ digits).
- Losing `ENCRYPTION_KEY` means losing access to any stored accounts; back
  it up somewhere safe (e.g. a password manager), separately from `APP_PIN`.
