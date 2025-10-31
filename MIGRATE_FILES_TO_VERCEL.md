# Migrate Files to Vercel Blob

Your images and GLB files are currently stored locally in the `uploads/` directory, but they need to be on Vercel Blob for your deployed site to work.

## Quick Steps

### 1. Get Vercel Blob Token

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project → **Settings** → **Storage**
3. If you don't have Blob storage yet:
   - Click **Create Database**
   - Select **Blob**
   - Create it
4. Go to **Settings** → **Environment Variables**
5. Copy your `BLOB_READ_WRITE_TOKEN` value

### 2. Set Token Locally (for migration)

Add to your `.env` file:
```
BLOB_READ_WRITE_TOKEN=vercel_blob_xxxxx...
DATABASE_URL=postgresql://neondb_owner:...@.../neondb?sslmode=require
```

### 3. Run Migration Script

```bash
npm run migrate:blob
```

This will:
- ✅ Upload all files from `uploads/` to Vercel Blob (50 files)
- ✅ Update database URLs to point to Blob storage
- ✅ Keep your existing product data intact

### 4. Set Token in Vercel (Important!)

After migration, add `BLOB_READ_WRITE_TOKEN` to Vercel:

1. Vercel Dashboard → Your Project → **Settings** → **Environment Variables**
2. Add: `BLOB_READ_WRITE_TOKEN` = `vercel_blob_xxxxx...`
3. Select **Production**, **Preview**, and **Development**
4. Save

### 5. Redeploy

```bash
vercel --prod
```

Or redeploy from Vercel dashboard.

## What Gets Migrated

- ✅ All GLB model files (13 files)
- ✅ All product images (37 files)  
- ✅ Database URLs updated automatically

## Troubleshooting

**"BLOB_READ_WRITE_TOKEN not set"**
- Make sure it's in your `.env` file
- Or export it: `export BLOB_READ_WRITE_TOKEN=vercel_blob_xxxxx`

**"Upload failed"**
- Check your Blob token is valid
- Make sure Vercel Blob storage is created in your project

**"Database update failed"**
- Check `DATABASE_URL` is correct in `.env`
- Make sure database connection works

## After Migration

Once migrated:
- ✅ All files are in Vercel Blob (accessible globally)
- ✅ Database URLs point to Blob storage
- ✅ Your site will show images and 3D models
- ✅ New uploads will automatically go to Blob on Vercel

