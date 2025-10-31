/**
 * Script to sync database URLs with Vercel Blob files
 * Matches files by base filename (without random suffixes)
 */

import { list } from '@vercel/blob';
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

// Extract base filename pattern - match by timestamp (the long number)
function getTimestamp(filename: string): string | null {
  // Remove /uploads/ prefix
  const cleanName = filename.replace('/uploads/', '');
  // Match timestamp pattern like "1761648939233" (13 digits)
  const match = cleanName.match(/(\d{13})/);
  return match ? match[1] : null;
}

// Check if blob filename contains the same timestamp
function matchesTimestamp(blobPath: string, timestamp: string): boolean {
  return blobPath.includes(timestamp);
}

async function syncUrls() {
  console.log('🔍 Fetching all files from Vercel Blob...\n');
  
  try {
    // Get all files from Blob
    const allBlobs = await list({ token: BLOB_TOKEN, prefix: 'uploads/' });
    console.log(`📦 Found ${allBlobs.blobs.length} files in Blob\n`);
    
    // Create a map of timestamp -> array of blob URLs (multiple files can share timestamp)
    const blobMap = new Map<string, Array<{path: string, url: string}>>();
    for (const blob of allBlobs.blobs) {
      const timestamp = getTimestamp(blob.pathname);
      if (timestamp) {
        if (!blobMap.has(timestamp)) {
          blobMap.set(timestamp, []);
        }
        blobMap.get(timestamp)!.push({ path: blob.pathname, url: blob.url });
      }
    }
    
    console.log(`📋 Created mapping for ${blobMap.size} unique timestamps\n`);
    
    // Get all products
    console.log('🔍 Checking database for /uploads/ paths...\n');
    const productsResult = await pool.query(`
      SELECT id, name, model_url, image_url, shop_image_url, home_page_image_url, images 
      FROM products
    `);
    const products = productsResult.rows;
    
    let updatedCount = 0;
    
    for (const product of products) {
      let needsUpdate = false;
      const updates: any = {};
      
      // Helper to find matching Blob URL by timestamp and file type
      const findBlobUrl = (localPath: string): string | null => {
        if (!localPath || !localPath.startsWith('/uploads/')) return null;
        
        const timestamp = getTimestamp(localPath);
        if (!timestamp) {
          console.log(`  ⚠️  No timestamp found in: ${localPath}`);
          return null;
        }
        
        // Get file extension
        const ext = localPath.split('.').pop()?.toLowerCase();
        const fileType = localPath.includes('/model-') ? 'model' : localPath.includes('/image-') ? 'image' : 'other';
        
        const candidates = blobMap.get(timestamp);
        if (!candidates || candidates.length === 0) {
          console.log(`  ⚠️  No files found with timestamp: ${timestamp}`);
          return null;
        }
        
        // Try to match by extension first, then by file type prefix
        let match = candidates.find(c => c.path.toLowerCase().endsWith(`.${ext}`));
        if (!match && fileType !== 'other') {
          match = candidates.find(c => c.path.toLowerCase().includes(`${fileType}-`));
        }
        
        // Fallback to first match
        if (!match) {
          match = candidates[0];
        }
        
        if (match) {
          console.log(`  ✅ Matched: ${localPath}`);
          console.log(`     -> ${match.path}`);
          console.log(`     -> ${match.url.substring(0, 60)}...`);
          return match.url;
        }
        
        return null;
      };
      
      // Update model_url
      if (product.model_url && product.model_url.startsWith('/uploads/')) {
        const blobUrl = findBlobUrl(product.model_url);
        if (blobUrl) {
          updates.model_url = blobUrl;
          needsUpdate = true;
        }
      }
      
      // Update image_url
      if (product.image_url && product.image_url.startsWith('/uploads/')) {
        const blobUrl = findBlobUrl(product.image_url);
        if (blobUrl) {
          updates.image_url = blobUrl;
          needsUpdate = true;
        }
      }
      
      // Update shop_image_url
      if (product.shop_image_url && product.shop_image_url.startsWith('/uploads/')) {
        const blobUrl = findBlobUrl(product.shop_image_url);
        if (blobUrl) {
          updates.shop_image_url = blobUrl;
          needsUpdate = true;
        }
      }
      
      // Update home_page_image_url
      if (product.home_page_image_url && product.home_page_image_url.startsWith('/uploads/')) {
        const blobUrl = findBlobUrl(product.home_page_image_url);
        if (blobUrl) {
          updates.home_page_image_url = blobUrl;
          needsUpdate = true;
        }
      }
      
      // Update images array
      if (product.images && Array.isArray(product.images)) {
        const updatedImages = product.images.map((img: string) => {
          if (img && img.startsWith('/uploads/')) {
            return findBlobUrl(img) || img;
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
        
        console.log(`\n✅ Updated: ${product.name}`);
        updatedCount++;
      }
    }
    
    console.log(`\n✅ Updated ${updatedCount} products\n`);
    console.log('🎉 All URLs synced!\n');
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run
syncUrls().catch(console.error);

