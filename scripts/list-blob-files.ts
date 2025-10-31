/**
 * List all files in Vercel Blob to see their actual names
 */

import { list } from '@vercel/blob';
import { config } from 'dotenv';

config();

const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;

if (!BLOB_TOKEN) {
  console.error('❌ BLOB_READ_WRITE_TOKEN not set in environment');
  process.exit(1);
}

async function listFiles() {
  console.log('🔍 Fetching all files from Vercel Blob...\n');
  
  try {
    const allBlobs = await list({ token: BLOB_TOKEN, prefix: 'uploads/' });
    console.log(`📦 Found ${allBlobs.blobs.length} files:\n`);
    
    // Group by file type
    const byType: Record<string, string[]> = {};
    for (const blob of allBlobs.blobs) {
      const ext = blob.pathname.split('.').pop() || 'unknown';
      if (!byType[ext]) byType[ext] = [];
      byType[ext].push(blob.pathname);
    }
    
    console.log('📋 Files by type:\n');
    for (const [ext, files] of Object.entries(byType)) {
      console.log(`${ext.toUpperCase()}: ${files.length} files`);
      files.slice(0, 5).forEach(f => console.log(`  - ${f}`));
      if (files.length > 5) console.log(`  ... and ${files.length - 5} more`);
      console.log('');
    }
    
    // Show a sample of URLs
    console.log('📋 Sample URLs:\n');
    allBlobs.blobs.slice(0, 10).forEach(blob => {
      console.log(`  ${blob.pathname}`);
      console.log(`  -> ${blob.url}\n`);
    });
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
  }
}

listFiles();

