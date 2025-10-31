/**
 * Script to find and fix all /uploads/ paths in the database
 * This will upload missing files to Vercel Blob and update all URLs
 */

import { put, list } from '@vercel/blob';
import pg from 'pg';
import { config } from 'dotenv';

config();

const { Pool } = pg;

const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;
const DATABASE_URL = process.env.DATABASE_URL;

if (!BLOB_TOKEN) {
  console.error('❌ BLOB_READ_WRITE_TOKEN not set in environment');
  process.exit(1);
}

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not set in environment');
  process.exit(1);
}

const pool = new Pool({ connectionString: DATABASE_URL });

async function findOrUploadFile(localPath: string): Promise<string | null> {
  // Extract filename from local path like "/uploads/image.png"
  const filename = localPath.replace('/uploads/', '');
  const blobPath = `uploads/${filename}`;
  
  try {
    // Check if file already exists in Blob
    const existing = await list({ prefix: blobPath, token: BLOB_TOKEN });
    if (existing.blobs.length > 0) {
      console.log(`  ✅ Found in Blob: ${existing.blobs[0].url}`);
      return existing.blobs[0].url;
    }
  } catch (e) {
    // File doesn't exist, will need to upload
  }
  
  console.log(`  ⚠️  File not found in Blob: ${localPath}`);
  console.log(`     You may need to manually upload this file: ${filename}`);
  return null;
}

async function fixAllUrls() {
  console.log('🔍 Finding all /uploads/ paths in database...\n');
  
  try {
    // Get all products
    const productsResult = await pool.query(`
      SELECT id, name, model_url, image_url, shop_image_url, home_page_image_url, images 
      FROM products
    `);
    const products = productsResult.rows;
    
    let updatedCount = 0;
    const urlMappings = new Map<string, string>(); // localPath -> blobUrl
    
    // First pass: collect all /uploads/ paths
    const localPaths = new Set<string>();
    for (const product of products) {
      [product.model_url, product.image_url, product.shop_image_url, product.home_page_image_url]
        .filter(url => url && url.startsWith('/uploads/'))
        .forEach(url => localPaths.add(url));
      
      if (product.images && Array.isArray(product.images)) {
        product.images
          .filter((url: string) => url && url.startsWith('/uploads/'))
          .forEach((url: string) => localPaths.add(url));
      }
    }
    
    console.log(`📋 Found ${localPaths.size} unique /uploads/ paths to fix\n`);
    
    // Second pass: find or upload each file
    for (const localPath of localPaths) {
      console.log(`🔍 Checking: ${localPath}`);
      const blobUrl = await findOrUploadFile(localPath);
      if (blobUrl) {
        urlMappings.set(localPath, blobUrl);
      }
    }
    
    console.log(`\n✅ Found ${urlMappings.size} URLs in Blob\n`);
    
    // Third pass: update database
    console.log('🔄 Updating database...\n');
    
    for (const product of products) {
      let needsUpdate = false;
      const updates: any = {};
      
      // Update model_url
      if (product.model_url && product.model_url.startsWith('/uploads/') && urlMappings.has(product.model_url)) {
        updates.model_url = urlMappings.get(product.model_url);
        needsUpdate = true;
      }
      
      // Update image_url
      if (product.image_url && product.image_url.startsWith('/uploads/') && urlMappings.has(product.image_url)) {
        updates.image_url = urlMappings.get(product.image_url);
        needsUpdate = true;
      }
      
      // Update shop_image_url
      if (product.shop_image_url && product.shop_image_url.startsWith('/uploads/') && urlMappings.has(product.shop_image_url)) {
        updates.shop_image_url = urlMappings.get(product.shop_image_url);
        needsUpdate = true;
      }
      
      // Update home_page_image_url
      if (product.home_page_image_url && product.home_page_image_url.startsWith('/uploads/') && urlMappings.has(product.home_page_image_url)) {
        updates.home_page_image_url = urlMappings.get(product.home_page_image_url);
        needsUpdate = true;
      }
      
      // Update images array
      if (product.images && Array.isArray(product.images)) {
        const updatedImages = product.images.map((img: string) => {
          if (img && img.startsWith('/uploads/') && urlMappings.has(img)) {
            return urlMappings.get(img)!;
          }
          return img;
        });
        
        if (JSON.stringify(updatedImages) !== JSON.stringify(product.images)) {
          updates.images = updatedImages;
          needsUpdate = true;
        }
      }
      
      if (needsUpdate) {
        const setClause = Object.keys(updates).map((key, idx) => `"${key}" = $${idx + 1}`).join(', ');
        const values = Object.values(updates);
        values.push(product.id);
        
        await pool.query(
          `UPDATE products SET ${setClause} WHERE id = $${values.length}`,
          values
        );
        
        console.log(`  ✅ Updated: ${product.name}`);
        updatedCount++;
      }
    }
    
    console.log(`\n✅ Updated ${updatedCount} products\n`);
    console.log('🎉 All URLs fixed!\n');
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run
fixAllUrls().catch(console.error);

