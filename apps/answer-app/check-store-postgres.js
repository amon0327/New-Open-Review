const { Client } = require('pg');

const client = new Client({
  host: 'db.otfreskkeaenahqziriz.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'e.8x*+nfQP$b8)fuXXR2Cjh/Kt7agLpKs8(5',
  ssl: {
    rejectUnauthorized: false
  }
});

async function checkStoreData() {
  try {
    await client.connect();
    console.log('Connected to database\n');

    const storeCode = 'a5fb90ce';
    console.log(`=== Checking store data for store_code: ${storeCode} ===\n`);

    // 1. Check stores table
    const storeQuery = `SELECT * FROM stores WHERE store_url_code = $1`;
    const storeResult = await client.query(storeQuery, [storeCode]);
    
    console.log('1. STORES TABLE:');
    console.log(`Found ${storeResult.rows.length} store(s)`);
    if (storeResult.rows.length > 0) {
      console.log('Store data:', JSON.stringify(storeResult.rows[0], null, 2));
      
      const storeId = storeResult.rows[0].id;
      console.log(`\nStore ID: ${storeId}\n`);

      // 2. Check store_review_forms
      const srfQuery = `
        SELECT srf.*, rf.is_published, rf.is_deleted, rf.title
        FROM store_review_forms srf
        JOIN review_forms rf ON rf.id = srf.review_form_id
        WHERE srf.store_id = $1
      `;
      const srfResult = await client.query(srfQuery, [storeId]);
      
      console.log('2. STORE_REVIEW_FORMS TABLE:');
      console.log(`Found ${srfResult.rows.length} review form(s) for this store`);
      if (srfResult.rows.length > 0) {
        srfResult.rows.forEach((row, index) => {
          console.log(`\nForm ${index + 1}:`);
          console.log(`- Review Form ID: ${row.review_form_id}`);
          console.log(`- Title: ${row.title}`);
          console.log(`- Published: ${row.is_published}`);
          console.log(`- Deleted: ${row.is_deleted}`);
          console.log(`- Created: ${row.created_at}`);
        });
      }
    } else {
      console.log('❌ No store found with the given store_code');
    }

    // 3. Check all available published forms
    console.log('\n\n3. ALL PUBLISHED REVIEW FORMS:');
    const allFormsQuery = `
      SELECT id, title, created_at 
      FROM review_forms 
      WHERE is_published = true AND is_deleted = false
      ORDER BY created_at DESC
    `;
    const allFormsResult = await client.query(allFormsQuery);
    console.log(`Total published forms: ${allFormsResult.rows.length}`);
    if (allFormsResult.rows.length > 0) {
      allFormsResult.rows.forEach((form) => {
        console.log(`- ${form.id}: ${form.title} (created: ${form.created_at})`);
      });
    }

    // 4. Check all stores with review forms
    console.log('\n\n4. STORES WITH REVIEW FORMS:');
    const storesWithFormsQuery = `
      SELECT s.id, s.store_name, s.store_url_code, COUNT(srf.id) as form_count
      FROM stores s
      JOIN store_review_forms srf ON srf.store_id = s.id
      GROUP BY s.id, s.store_name, s.store_url_code
      ORDER BY s.store_name
    `;
    const storesWithFormsResult = await client.query(storesWithFormsQuery);
    console.log(`Total stores with forms: ${storesWithFormsResult.rows.length}`);
    if (storesWithFormsResult.rows.length > 0) {
      storesWithFormsResult.rows.forEach((store) => {
        console.log(`- ${store.store_name} (${store.store_url_code}): ${store.form_count} form(s)`);
      });
    }

    // 5. Check if there's any store with code a5fb90ce in the system
    console.log('\n\n5. SEARCHING FOR SIMILAR STORE CODES:');
    const similarQuery = `
      SELECT store_url_code, store_name, company_id, created_at 
      FROM stores 
      WHERE store_url_code LIKE '%a5fb90ce%' OR store_url_code LIKE '%a5fb%'
    `;
    const similarResult = await client.query(similarQuery);
    console.log(`Found ${similarResult.rows.length} similar store code(s)`);
    if (similarResult.rows.length > 0) {
      similarResult.rows.forEach((store) => {
        console.log(`- ${store.store_url_code}: ${store.store_name}`);
      });
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
    console.log('\n✓ Database connection closed');
  }
}

checkStoreData();