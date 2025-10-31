/**
 * Migration script to upload local uploads/ files to Vercel Blob
 * and update database URLs to point to Blob storage
 * 
 * Run this once after setting up Vercel Blob:
 * 1. Get BLOB_READ_WRITE_TOKEN from Vercel dashboard
 * 2. Set it in .env or as environment variable
 * 3. Run: tsx scripts/migrate-to-vercel-blob.ts
 */

import { put, list } from '@vercel/blob';
import pg from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { config } from 'dotenv';

// Load .env file
config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const { Pool } = pg;

const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;
const DATABASE_URL = process.env.DATABASE_URL;

if (!BLOB_TOKEN) {
  console.error('❌ BLOB_READ_WRITE_TOKEN not set in environment');
  console.log('💡 Get it from: Vercel Dashboard → Your Project → Settings → Environment Variables');
  process.exit(1);
}

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not set in environment');
  process.exit(1);
}

const pool = new Pool({ connectionString: DATABASE_URL });
const uploadsDir = path.join(__dirname, '..', 'uploads');

interface FileMapping {
  localPath: string;
  blobUrl: string;
  filename: string;
}

async function uploadFile(filePath: string): Promise<string> {
  const filename = path.basename(filePath);
  const fileBuffer = fs.readFileSync(filePath);
  const blobPath = `uploads/${filename}`;
  
  console.log(`  📤 Uploading ${filename}...`);
  
  try {
    // Check if file already exists in Blob
    try {
      const existing = await list({ prefix: blobPath, token: BLOB_TOKEN });
      if (existing.blobs.length > 0) {
        console.log(`  ✅ Already exists, using existing: ${existing.blobs[0].url}`);
        return existing.blobs[0].url;
      }
    } catch (e) {
      // File doesn't exist, continue to upload
    }
    
    const { url } = await put(blobPath, fileBuffer, {
      access: 'public',
      token: BLOB_TOKEN,
    });
    
    console.log(`  ✅ Uploaded: ${url}`);
    return url;
  } catch (error: any) {
    console.error(`  ❌ Failed to upload ${filename}:`, error.message);
    throw error;
  }
}

async function migrateFiles() {
  console.log('🚀 Starting migration to Vercel Blob...\n');
  
  // Check if uploads directory exists
  if (!fs.existsSync(uploadsDir)) {
    console.error(`❌ Uploads directory not found: ${uploadsDir}`);
    process.exit(1);
  }
  
  // Get all files from uploads directory
  const files = fs.readdirSync(uploadsDir)
    .filter(file => fs.statSync(path.join(uploadsDir, file)).isFile())
    .map(file => path.join(uploadsDir, file));
  
  console.log(`📁 Found ${files.length} files to migrate\n`);
  
  // Upload all files and create mapping
  const fileMappings: Map<string, string> = new Map(); // localPath -> blobUrl
  
  for (const filePath of files) {
    const filename = path.basename(filePath);
    const localPath = `/uploads/${filename}`;
    
    try {
      const blobUrl = await uploadFile(filePath);
      fileMappings.set(localPath, blobUrl);
    } catch (error) {
      console.error(`⚠️  Skipping ${filename} due to error`);
    }
  }
  
  console.log(`\n✅ Uploaded ${fileMappings.size} files to Vercel Blob\n`);
  
  // Update database URLs
  console.log('🔄 Updating database URLs...\n');
  
  try {
    // Get all products
    const productsResult = await pool.query('SELECT id, name, model_url, image_url, images FROM products');
    const products = productsResult.rows;
    
    let updatedCount = 0;
    
    for (const product of products) {
      let needsUpdate = false;
      const updates: any = {};
      
      // Update model_url
      if (product.model_url && fileMappings.has(product.model_url)) {
        updates.model_url = fileMappings.get(product.model_url);
        needsUpdate = true;
        console.log(`  🔄 ${product.name}: model_url`);
      }
      
      // Update image_url
      if (product.image_url && product.image_url.startsWith('/uploads/') && fileMappings.has(product.image_url)) {
        updates.image_url = fileMappings.get(product.image_url);
        needsUpdate = true;
        console.log(`  🔄 ${product.name}: image_url`);
      }
      
      // Update images array
      if (product.images && Array.isArray(product.images)) {
        const updatedImages = product.images.map((img: string) => {
          if (img.startsWith('/uploads/') && fileMappings.has(img)) {
            return fileMappings.get(img)!;
          }
          return img;
        });
        
        if (JSON.stringify(updatedImages) !== JSON.stringify(product.images)) {
          updates.images = updatedImages;
          needsUpdate = true;
          console.log(`  🔄 ${product.name}: images array`);
        }
      }
      
      if (needsUpdate) {
        const setClause = Object.keys(updates).map((key, idx) => `${key} = $${idx + 1}`).join(', ');
        const values = Object.values(updates);
        values.push(product.id);
        
        await pool.query(
          `UPDATE products SET ${setClause} WHERE id = $${values.length}`,
          values
        );
        
        updatedCount++;
      }
    }
    
    console.log(`\n✅ Updated ${updatedCount} products in database\n`);
    console.log('🎉 Migration complete! Your files are now in Vercel Blob.\n');
    console.log('📝 Next steps:');
    console.log('   1. Make sure BLOB_READ_WRITE_TOKEN is set in Vercel dashboard');
    console.log('   2. Redeploy your app: vercel --prod');
    
  } catch (error: any) {
    console.error('❌ Error updating database:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run migration
migrateFiles().catch(console.error);

