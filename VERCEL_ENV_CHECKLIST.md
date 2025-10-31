# ✅ Vercel Environment Variables Checklist

## Copy these EXACT values to Vercel:

### 1. DATABASE_URL (REQUIRED - This is why products aren't loading!)
```
postgresql://neondb_owner:REDACTED_DB_PASSWORD@REDACTED_DB_HOST/neondb?sslmode=require&channel_binding=require
```

### 2. SESSION_SECRET (Use your local one)
```
2fa14e2b6f78944915484826862e7fc5e4441ba337f6b555ba140abe318884ab
```

### 3. BLOB_READ_WRITE_TOKEN (For images/GLB files)
```
REDACTED_VERCEL_TOKEN
```

## How to Add in Vercel:

1. Go to: https://vercel.com/dashboard
2. Click **off-human** project
3. **Settings** → **Environment Variables**
4. For EACH variable above:
   - Click **Add New**
   - Paste the Name and Value
   - **Select: Production, Preview, AND Development** ✅
   - Click **Save**
5. After adding all 3, **Redeploy**:
   - Go to **Deployments**
   - Click the 3 dots on latest deployment → **Redeploy**

## Verify They're Set:

After redeploying, check the function logs:
- Vercel Dashboard → Your Deployment → **Functions** tab
- Look for: `✅ Database connection initialized`
- If you see `❌ DATABASE_URL environment variable is required` → it's not set!

## Test Your API:

Visit: `https://off-human-de0uc60w9-ble77s-projects.vercel.app/api/products`

Should return JSON with your 6 products!

