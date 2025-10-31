# Vercel Deployment Checklist

## ✅ Security Check Complete
- ✅ No hardcoded private keys found
- ✅ `.env` files are properly ignored
- ✅ All secrets use environment variables
- ✅ `backup.dump` is excluded from git

## 🚀 Deploy to Vercel

### Step 1: Install Vercel CLI (if needed)
```bash
npm install -g vercel
```

### Step 2: Login to Vercel
```bash
vercel login
```

### Step 3: Deploy
```bash
vercel
```

Follow the prompts:
- Link to existing project? (Yes/No)
- Project name: `off-human` (or your choice)
- Directory: `.` (current directory)

### Step 4: Set Environment Variables in Vercel Dashboard

Go to your Vercel project → Settings → Environment Variables and add:

#### Required:
```
DATABASE_URL=postgresql://neondb_owner:REDACTED_DB_PASSWORD@REDACTED_DB_HOST/neondb?sslmode=require
SESSION_SECRET=<generate-a-random-secret-here>
RESEND_API_KEY=<your-resend-api-key>
RESEND_FROM=noreply@yourdomain.com
```

#### Recommended:
```
SITE_URL=https://your-app.vercel.app
VERCEL_URL=<auto-set-by-vercel>
```

#### Payments (if using X402):
```
X402_WALLET_ADDRESS=<your-wallet-address>
X402_SOLANA_WALLET_ADDRESS=<optional-separate-solana-wallet>
SOLANA_NETWORK=solana
```

#### Uploads (if using Vercel Blob):
```
BLOB_READ_WRITE_TOKEN=<your-vercel-blob-token>
```

#### Client-side (for Solana):
```
VITE_HELIUS_API_KEY=<your-helius-key>
VITE_SOLANA_NETWORK=mainnet-beta
```

### Step 5: Redeploy After Adding Variables
```bash
vercel --prod
```

Or trigger a new deployment from Vercel dashboard.

## 🔒 Security Notes

### Private Keys & Secrets
- **NEVER** commit private keys to git
- **NEVER** add `.env` files to git (already excluded ✅)
- All wallet private keys should be in Vercel environment variables
- `AGENT_WALLET_PRIVATE_KEY` is only needed if running the agent script locally

### Environment Variables in Vercel
All sensitive data must be set in Vercel dashboard:
- Go to Project Settings → Environment Variables
- Add variables for Production, Preview, and Development environments
- Use Vercel's "Encrypted" option for secrets

## 📝 Generate SESSION_SECRET

For production, generate a secure random secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 🧪 Test Deployment

After deployment:
1. Visit `https://your-app.vercel.app`
2. Test product listing: `/api/products`
3. Test admin login (if configured)
4. Test payment flow (if X402 is set up)

## 📚 Additional Resources

- Vercel Docs: https://vercel.com/docs
- Neon Connection: Already configured ✅
- Build settings: Already in `vercel.json` ✅

