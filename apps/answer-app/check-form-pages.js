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

async function checkFormPages() {
  try {
    await client.connect();
    console.log('Connected to database\n');

    const formId = 'c29dc133-5e49-45c2-9a94-a04a786ff7fd';
    console.log(`=== Checking pages for form ID: ${formId} ===\n`);

    // 1. Check review form details
    const formQuery = `
      SELECT id, title, is_published, is_deleted, created_at 
      FROM review_forms 
      WHERE id = $1
    `;
    const formResult = await client.query(formQuery, [formId]);
    
    console.log('1. REVIEW FORM:');
    if (formResult.rows.length > 0) {
      const form = formResult.rows[0];
      console.log(`- ID: ${form.id}`);
      console.log(`- Title: ${form.title}`);
      console.log(`- Published: ${form.is_published}`);
      console.log(`- Deleted: ${form.is_deleted}`);
      console.log(`- Created: ${form.created_at}`);
    } else {
      console.log('❌ Form not found');
      return;
    }

    // 2. Check review form pages
    console.log('\n2. REVIEW FORM PAGES:');
    const pagesQuery = `
      SELECT id, page_number, created_at 
      FROM review_form_pages 
      WHERE review_forms_id = $1
      ORDER BY page_number
    `;
    const pagesResult = await client.query(pagesQuery, [formId]);
    
    console.log(`Found ${pagesResult.rows.length} page(s)`);
    if (pagesResult.rows.length === 0) {
      console.log('❌ No pages found for this form');
      
      // Check if there are any pages in the system
      console.log('\n3. CHECKING ALL REVIEW FORM PAGES:');
      const allPagesQuery = `
        SELECT COUNT(*) as count, review_forms_id 
        FROM review_form_pages 
        GROUP BY review_forms_id
        ORDER BY count DESC
        LIMIT 10
      `;
      const allPagesResult = await client.query(allPagesQuery);
      
      console.log('Forms with pages:');
      allPagesResult.rows.forEach(row => {
        console.log(`- Form ${row.review_forms_id}: ${row.count} page(s)`);
      });
    } else {
      pagesResult.rows.forEach(page => {
        console.log(`- Page ${page.page_number}: ID ${page.id}`);
      });

      // 3. Check questions for each page
      console.log('\n3. QUESTIONS PER PAGE:');
      for (const page of pagesResult.rows) {
        const questionsQuery = `
          SELECT id, question_type_id, question_text 
          FROM review_questions 
          WHERE review_form_pages_id = $1
        `;
        const questionsResult = await client.query(questionsQuery, [page.id]);
        
        console.log(`\nPage ${page.page_number} (${page.id}):`);
        console.log(`- ${questionsResult.rows.length} question(s)`);
        
        if (questionsResult.rows.length > 0) {
          questionsResult.rows.forEach(q => {
            console.log(`  - Type ${q.question_type_id}: ${q.question_text?.substring(0, 50)}...`);
          });
        }
      }
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
    console.log('\n✓ Database connection closed');
  }
}

checkFormPages();