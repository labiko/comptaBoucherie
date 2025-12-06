/**
 * Script pour exécuter directement des fichiers SQL via PostgreSQL
 * Utilise postgres.js pour une connexion directe
 *
 * Usage: node scripts/exec-sql.js <fichier.sql>
 * Exemple: node scripts/exec-sql.js scripts/analyze-data.sql
 */

import { readFileSync } from 'fs';
import postgres from 'postgres';

// Configuration PostgreSQL via Supabase
// Format de l'URL de connexion Supabase:
// postgresql://postgres.[project-ref]:[password]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres

const DATABASE_URL = process.env.DATABASE_URL ||
  'postgresql://postgres.ylhwyotluskuhkjumqpf:p4zN25F7Gfw9Py@aws-0-eu-central-1.pooler.supabase.com:6543/postgres';

/**
 * Exécute un fichier SQL
 */
async function executeSQLFile(filePath) {
  console.log(`📄 Lecture du fichier: ${filePath}\n`);

  let sql;

  try {
    // Lire le fichier SQL
    const sqlContent = readFileSync(filePath, 'utf8');

    console.log('🔗 Connexion à la base de données...');

    // Se connecter à PostgreSQL
    sql = postgres(DATABASE_URL, {
      ssl: 'require',
      max: 1
    });

    console.log('✅ Connecté !\n');
    console.log('🔧 Exécution du SQL...\n');
    console.log('═══════════════════════════════════════════════\n');

    // Séparer les requêtes SQL (split sur les points-virgules)
    const queries = sqlContent
      .split(';')
      .map(q => q.trim())
      .filter(q => q.length > 0 && !q.startsWith('--') && q !== '');

    console.log(`📊 ${queries.length} requêtes à exécuter\n`);

    let queryIndex = 1;
    for (const query of queries) {
      try {
        // Exécuter la requête
        const result = await sql.unsafe(query);

        // Afficher selon le type de requête
        if (query.toUpperCase().trim().startsWith('SELECT')) {
          console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
          console.log(`Requête ${queryIndex}/${queries.length}`);
          console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

          if (result.length > 0) {
            console.table(result);
          } else {
            console.log('(aucun résultat)\n');
          }
        } else {
          // Pour les requêtes non-SELECT (INSERT, UPDATE, etc.)
          console.log(`✓ Requête ${queryIndex}/${queries.length} exécutée`);
        }

        queryIndex++;
      } catch (queryError) {
        console.error(`\n❌ Erreur dans la requête ${queryIndex}:`, queryError.message);
        console.error('Requête:', query.substring(0, 100) + '...\n');
        // Continuer avec les autres requêtes
        queryIndex++;
      }
    }

    console.log('\n═══════════════════════════════════════════════');
    console.log('✅ Exécution terminée !');
    console.log('═══════════════════════════════════════════════\n');

  } catch (error) {
    console.error('\n❌ Erreur:', error.message);

    if (error.message.includes('password') || error.message.includes('authentication')) {
      console.error('\n💡 Configuration requise:');
      console.error('   1. Récupérer le mot de passe de la base de données depuis Supabase Dashboard');
      console.error('   2. Définir la variable d\'environnement DATABASE_URL:');
      console.error('      DATABASE_URL="postgresql://postgres.wnvngmtaiwcilwzitgey:[PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres"');
      console.error('\n   OU modifier directement dans scripts/exec-sql.js\n');
    } else if (error.code === 'ENOENT') {
      console.error(`\n❌ Fichier non trouvé: ${filePath}\n`);
    } else {
      console.error('\n💡 Solution alternative:');
      console.error('   1. Ouvrir Supabase Dashboard > SQL Editor');
      console.error('   2. Copier-coller le contenu de:', filePath);
      console.error('   3. Exécuter manuellement\n');
    }

    process.exit(1);
  } finally {
    // Fermer la connexion
    if (sql) {
      await sql.end();
      console.log('🔌 Connexion fermée.');
    }
  }
}

// Vérifier les arguments
const args = process.argv.slice(2);

if (args.length === 0) {
  console.error('❌ Usage: node scripts/exec-sql.js <fichier.sql>');
  console.error('\nExemples:');
  console.error('  node scripts/exec-sql.js scripts/analyze-data.sql');
  console.error('  node scripts/exec-sql.js scripts/generate-test-data-auto.sql\n');
  console.error('Configuration:');
  console.error('  Définir DATABASE_URL avec le mot de passe de votre base Supabase');
  console.error('  export DATABASE_URL="postgresql://postgres.PROJECT:[PASSWORD]@..."\n');
  process.exit(1);
}

const sqlFile = args[0];

// Exécuter
executeSQLFile(sqlFile);
