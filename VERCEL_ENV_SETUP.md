# ⚠️ REQUIRED: Set Environment Variables in Vercel

Your deployment is working, but the **products API is failing** because environment variables are missing!

## Quick Fix - Add These to Vercel NOW:

1. Go to: https://vercel.com/dashboard
2. Click on **off-human** project
3. Go to **Settings** → **Environment Variables**
4. Add these variables:

### Required Variables:

```
DATABASE_URL
= postgresql://neondb_owner:REDACTED_DB_PASSWORD@REDACTED_DB_HOST/neondb?sslmode=require
```

```
SESSION_SECRET
= (generate a random string - run this locally: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
```

```
BLOB_READ_WRITE_TOKEN
= REDACTED_VERCEL_TOKEN
```

### Important:
- ✅ Select **Production**, **Preview**, and **Development** for each variable
- ✅ Click **Save** after adding each one

### After Adding Variables:

**Redeploy** your project:
- Option 1: Click **Redeploy** in Vercel dashboard (from the latest deployment)
- Option 2: Run: `vercel --prod --yes`

## What Each Variable Does:

- `DATABASE_URL` - Connects to your Neon database (has your products!)
- `SESSION_SECRET` - Secures user sessions
- `BLOB_READ_WRITE_TOKEN` - Allows serving images/GLB files from Vercel Blob

## Optional Variables (for full functionality):

```
RESEND_API_KEY=... (if using email)
RESEND_FROM=noreply@yourdomain.com
X402_WALLET_ADDRESS=... (if using payments)
VITE_SOLANA_NETWORK=mainnet-beta
```

Once you add `DATABASE_URL`, your products should load! 🎉

