/**
 * Script pour exécuter directement des fichiers SQL via Supabase
 * Utilise postgres.js pour une connexion directe à PostgreSQL
 *
 * Usage: node scripts/execute-sql.js <fichier.sql>
 * Exemple: node scripts/execute-sql.js scripts/analyze-data.sql
 */

import { readFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';

// Configuration Supabase
const supabaseUrl = 'https://wnvngmtaiwcilwzitgey.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indudm5nbXRhaXdjaWx3eml0Z2V5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzM0MTE2MjUsImV4cCI6MjA0ODk4NzYyNX0.IVEt4uHBZjIJr83PGNrhZmZkqkjmDqLUmBOm5zXwLsE';

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Exécute une requête SQL brute
 */
async function executeSQLFile(filePath) {
  console.log(`📄 Lecture du fichier: ${filePath}\n`);

  try {
    // Lire le fichier SQL
    const sqlContent = readFileSync(filePath, 'utf8');

    console.log('🔧 Exécution du SQL...\n');
    console.log('═══════════════════════════════════════════════\n');

    // Supabase ne permet pas d'exécuter du SQL brut directement via le client
    // On doit utiliser la méthode RPC ou REST API
    // Mais on peut exécuter via la REST API directement

    const { data, error } = await supabase.rpc('exec_sql', {
      query: sqlContent
    });

    if (error) {
      // Si la fonction RPC n'existe pas, essayer une autre méthode
      if (error.message.includes('exec_sql') || error.code === '42883') {
        console.log('⚠️  La fonction RPC exec_sql n\'existe pas dans Supabase.');
        console.log('📋 Méthode alternative: Exécution requête par requête...\n');

        // Séparer les requêtes SQL (simple split sur ;)
        const queries = sqlContent
          .split(';')
          .map(q => q.trim())
          .filter(q => q.length > 0 && !q.startsWith('--'));

        console.log(`📊 ${queries.length} requêtes détectées\n`);

        let queryIndex = 1;
        for (const query of queries) {
          if (query.toUpperCase().startsWith('SELECT')) {
            console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
            console.log(`Requête ${queryIndex}/${queries.length}`);
            console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

            // Exécuter la requête SELECT via FROM
            const { data: result, error: queryError } = await supabase
              .rpc('exec_select', { query_text: query })
              .catch(async () => {
                // Si exec_select n'existe pas, on doit passer par une vue ou fonction
                // Pour l'instant, afficher juste la requête
                console.log('⚠️  Impossible d\'exécuter directement.');
                console.log('📝 Requête SQL:');
                console.log(query.substring(0, 200) + '...\n');
                return { data: null, error: null };
              });

            if (queryError) {
              console.error('❌ Erreur:', queryError.message);
            } else if (result) {
              console.table(result);
            }
          }
          queryIndex++;
        }

        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('⚠️  RECOMMANDATION:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        console.log('Pour exécuter le SQL complet, utilisez:');
        console.log('1. Dashboard Supabase > SQL Editor');
        console.log('2. Copier-coller le contenu de:', filePath);
        console.log('3. Exécuter\n');

        return;
      }

      throw error;
    }

    console.log('✅ SQL exécuté avec succès !');
    if (data) {
      console.log('\n📊 Résultats:');
      console.table(data);
    }

  } catch (error) {
    console.error('\n❌ Erreur lors de l\'exécution:', error.message);
    console.error('\n💡 Solution alternative:');
    console.error('   1. Ouvrir Supabase Dashboard > SQL Editor');
    console.error('   2. Copier-coller le contenu de:', filePath);
    console.error('   3. Exécuter manuellement\n');
    process.exit(1);
  }
}

// Vérifier les arguments
const args = process.argv.slice(2);

if (args.length === 0) {
  console.error('❌ Usage: node scripts/execute-sql.js <fichier.sql>');
  console.error('\nExemples:');
  console.error('  node scripts/execute-sql.js scripts/analyze-data.sql');
  console.error('  node scripts/execute-sql.js scripts/generate-test-data-auto.sql');
  process.exit(1);
}

const sqlFile = args[0];

// Exécuter
executeSQLFile(sqlFile);
