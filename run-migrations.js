const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('Error: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  console.error('Please ensure .env.local has both values');
  process.exit(1);
}

// Create admin client
const supabase = createClient(supabaseUrl, serviceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

const migrationFiles = [
  '001_dashboard_tables.sql',
  '002_settings_profile_extensions.sql',
  '003_add_profiles_rls_policies.sql',
  '004_create_proposals_tables.sql',
  '005_meetings_feature.sql',
  '006_scope_creep_detector.sql',
];

async function runMigration(filename) {
  try {
    const filepath = path.join(__dirname, 'supabase', 'migrations', filename);
    const sql = fs.readFileSync(filepath, 'utf-8');
    
    console.log(`\n📝 Running: ${filename}`);
    console.log('━'.repeat(60));
    
    // Execute the SQL
    const { error } = await supabase.rpc('run_sql', {
      sql_query: sql,
    }).then(() => ({ error: null })).catch(err => ({ error: err }));

    if (error && error.message?.includes('not found')) {
      // If run_sql doesn't exist, try direct execution via query
      const { error: queryError } = await supabase.query(sql);
      if (queryError) throw queryError;
    } else if (error) {
      throw error;
    }

    console.log(`✅ ${filename} completed successfully`);
    return true;
  } catch (error) {
    console.error(`❌ Error in ${filename}:`);
    console.error(error.message);
    return false;
  }
}

async function runAllMigrations() {
  console.log('🚀 Starting Supabase Migrations');
  console.log('═'.repeat(60));
  console.log(`Database: ${supabaseUrl}`);
  console.log('═'.repeat(60));

  let successful = 0;
  let failed = 0;

  for (const file of migrationFiles) {
    const success = await runMigration(file);
    if (success) successful++;
    else failed++;
  }

  console.log('\n' + '═'.repeat(60));
  console.log(`📊 Migration Summary:`);
  console.log(`✅ Successful: ${successful}`);
  console.log(`❌ Failed: ${failed}`);
  console.log('═'.repeat(60));

  if (failed === 0) {
    console.log('🎉 All migrations completed successfully!');
    process.exit(0);
  } else {
    console.log('⚠️  Some migrations failed. Please check the errors above.');
    process.exit(1);
  }
}

runAllMigrations();
