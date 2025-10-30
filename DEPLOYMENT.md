Vercel Deployment Guide

Overview
- Frontend builds with Vite to `dist/public` and is served as static on Vercel.
- Backend runs as Vercel Serverless Functions using the existing Express app.
- Sessions use Postgres in production. Uploads use Vercel Blob in production.
- Email delivery uses Resend via environment variables.

Prerequisites
- Neon Postgres database (or Postgres compatible) and `DATABASE_URL`.
- Resend account + `RESEND_API_KEY` and `RESEND_FROM`.
- Vercel project with Vercel Blob (optional, recommended for uploads) and `BLOB_READ_WRITE_TOKEN`.
- X402 wallet envs for payments: `X402_WALLET_ADDRESS` and optionally `X402_SOLANA_WALLET_ADDRESS`.

Environment Variables
- See `.env.example` for the full list of variables to configure in Vercel.
- Required: `DATABASE_URL`, `SESSION_SECRET`, `RESEND_API_KEY`, `RESEND_FROM`.
- Recommended: `SITE_URL` (e.g. `https://your-app.vercel.app`).
- Payments: `X402_WALLET_ADDRESS`, `X402_SOLANA_WALLET_ADDRESS`, `SOLANA_NETWORK`.
- Uploads: `BLOB_READ_WRITE_TOKEN` (enables Vercel Blob uploads).
- Client: `VITE_HELIUS_API_KEY`, `VITE_SOLANA_NETWORK`.

Build & Output
- `vercel.json` sets `buildCommand` to `npm run build` and `outputDirectory` to `dist/public`.
- The SPA fallback rewrite ensures deep links serve `index.html`.

Serverless API
- Files under `api/` implement the Express server as a serverless handler.
- All `/api/*` routes are handled via `api/[...path].ts` and share the same Express app instance.

Sessions
- In production (including Vercel), sessions use Postgres via `connect-pg-simple`.
- Ensure `DATABASE_URL` and `SESSION_SECRET` are set in Vercel.

Uploads
- In production, uploads go to Vercel Blob (public) using `BLOB_READ_WRITE_TOKEN`.
- Local/dev continues to store files under `uploads/`.

Email
- Resend is used with `RESEND_API_KEY` and `RESEND_FROM`.
- Download link base is derived from `SITE_URL` or `VERCEL_URL`.

Migrations
- Run schema migrations from your machine or CI using: `npm run db:push`.
- `drizzle.config.ts` requires `DATABASE_URL` to be set when running migrations.

Local Development
- `npm run dev` starts the Express server with Vite middleware.
- Admin seeding can be enabled locally by setting `SEED_ADMIN=true` in `.env` (never enable in production).

