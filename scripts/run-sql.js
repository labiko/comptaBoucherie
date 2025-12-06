/**
 * Script pour exécuter un fichier SQL complet sans le découper
 * Usage: node scripts/run-sql.js <fichier.sql>
 */

import { readFileSync } from 'fs';
import postgres from 'postgres';

const DATABASE_URL = process.env.DATABASE_URL ||
  'postgresql://postgres.ylhwyotluskuhkjumqpf:p4zN25F7Gfw9Py@aws-0-eu-central-1.pooler.supabase.com:6543/postgres';

async function runSQL(filePath) {
  console.log(`📄 Lecture du fichier: ${filePath}\n`);

  let sql;

  try {
    // Lire le fichier SQL
    const sqlContent = readFileSync(filePath, 'utf8');

    console.log('🔗 Connexion à la base de données...');

    // Se connecter à PostgreSQL
    sql = postgres(DATABASE_URL, {
      ssl: 'require',
      max: 1,
      connection: {
        application_name: 'boucherie-compta'
      }
    });

    console.log('✅ Connecté !\n');
    console.log('🔧 Exécution du SQL complet...\n');

    // Exécuter tout le fichier SQL en un seul bloc
    const result = await sql.unsafe(sqlContent);

    console.log('\n✅ Exécution terminée avec succès !\n');

    if (Array.isArray(result) && result.length > 0) {
      console.log('📊 Résultats:');
      console.table(result);
    }

  } catch (error) {
    console.error('\n❌ Erreur:', error.message);
    console.error('\nDétails:', error);
    process.exit(1);
  } finally {
    if (sql) {
      await sql.end();
      console.log('\n🔌 Connexion fermée.');
    }
  }
}

// Vérifier les arguments
const args = process.argv.slice(2);

if (args.length === 0) {
  console.error('❌ Usage: node scripts/run-sql.js <fichier.sql>');
  console.error('\nExemples:');
  console.error('  node scripts/run-sql.js scripts/generate-test-data-auto.sql');
  console.error('  node scripts/run-sql.js scripts/analyze-data.sql\n');
  process.exit(1);
}

const sqlFile = args[0];
runSQL(sqlFile);
