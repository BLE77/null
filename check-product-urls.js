import pg from 'pg';
import { config } from 'dotenv';

config();

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

try {
  const products = await pool.query(`
    SELECT id, name, model_url, image_url, images
    FROM products
    ORDER BY created_at DESC
  `);
  
  console.log('\n📦 Product URLs in Database:\n');
  products.rows.forEach((p, i) => {
    console.log(`${i + 1}. ${p.name}`);
    console.log(`   Model URL: ${p.model_url || 'None'}`);
    console.log(`   Image URL: ${p.image_url || 'None'}`);
    if (p.images && Array.isArray(p.images) && p.images.length > 0) {
      console.log(`   Additional Images: ${p.images.length}`);
      p.images.slice(0, 2).forEach(img => console.log(`     - ${img.substring(0, 60)}...`));
    }
    console.log('');
  });
  
  // Count products with Vercel Blob URLs
  const blobUrls = products.rows.filter(p => 
    (p.model_url && p.model_url.includes('blob.vercel-storage.com')) ||
    (p.image_url && p.image_url.includes('blob.vercel-storage.com')) ||
    (p.images && Array.isArray(p.images) && p.images.some(img => img && img.includes('blob.vercel-storage.com')))
  );
  
  console.log(`✅ Products with Vercel Blob URLs: ${blobUrls.length}/${products.rows.length}`);
  
  // Count products with local /uploads/ URLs (these won't work on Vercel)
  const localUrls = products.rows.filter(p => 
    (p.model_url && p.model_url.startsWith('/uploads/')) ||
    (p.image_url && p.image_url.startsWith('/uploads/')) ||
    (p.images && Array.isArray(p.images) && p.images.some(img => img && img.startsWith('/uploads/')))
  );
  
  if (localUrls.length > 0) {
    console.log(`\n⚠️  Products with local /uploads/ URLs (won't work on Vercel): ${localUrls.length}`);
    localUrls.forEach(p => console.log(`   - ${p.name}`));
  }
  
} catch (error) {
  console.error('Error:', error.message);
} finally {
  await pool.end();
}

