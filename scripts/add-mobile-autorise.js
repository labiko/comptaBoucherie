// Script pour ajouter la colonne mobile_autorise à la table boucheries
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabaseUrl = 'https://znipxcuzpwbhddnjclbw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpuaXB4Y3V6cHdiaGRkbmpjbGJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc3MTQxNjYsImV4cCI6MjA1MzI5MDE2Nn0.h-tMl_WfDBVdU9KrNF7BwGJdZ3Rq8UoBmLPJDWL2eSk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  try {
    console.log('🔄 Exécution de la migration add-mobile-autorise...\n');

    // Lire le fichier SQL
    const sqlPath = join(__dirname, '..', 'sql', 'add-mobile-autorise.sql');
    const sql = readFileSync(sqlPath, 'utf-8');

    // Exécuter la requête SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
      console.error('❌ Erreur lors de l\'exécution de la migration:', error);

      // Essayer une approche alternative : exécuter directement
      console.log('\n🔄 Tentative avec approche alternative...\n');

      const { error: alterError } = await supabase.rpc('exec_sql', {
        sql_query: `
          ALTER TABLE boucheries
          ADD COLUMN IF NOT EXISTS mobile_autorise BOOLEAN DEFAULT false NOT NULL;
        `
      });

      if (alterError) {
        console.error('❌ Erreur:', alterError);
        process.exit(1);
      }
    }

    // Vérifier le résultat
    const { data: boucheries, error: selectError } = await supabase
      .from('boucheries')
      .select('id, nom, mobile_autorise')
      .order('id');

    if (selectError) {
      console.error('❌ Erreur lors de la vérification:', selectError);
    } else {
      console.log('✅ Migration réussie!\n');
      console.log('📊 État des boucheries:');
      console.table(boucheries);
    }

  } catch (error) {
    console.error('❌ Erreur inattendue:', error);
    process.exit(1);
  }
}

runMigration();
