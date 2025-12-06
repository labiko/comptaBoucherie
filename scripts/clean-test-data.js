/**
 * Script de nettoyage des données de test
 * Supprime tous les encaissements et factures de la période 01/01/2025 - 06/12/2025
 *
 * Usage: node scripts/clean-test-data.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Charger les variables d'environnement
dotenv.config({ path: join(__dirname, '..', '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY doivent être définis dans .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Demande confirmation à l'utilisateur
 */
function askConfirmation(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'oui' || answer.toLowerCase() === 'o');
    });
  });
}

/**
 * Nettoie les données de test
 */
async function cleanTestData() {
  console.log('🧹 Nettoyage des données de test\n');

  try {
    // 1. Compter les données à supprimer
    const { count: encCount } = await supabase
      .from('encaissements')
      .select('*', { count: 'exact', head: true })
      .gte('date', '2025-01-01')
      .lte('date', '2025-12-06');

    const { count: factCount } = await supabase
      .from('factures')
      .select('*', { count: 'exact', head: true })
      .gte('date_facture', '2025-01-01')
      .lte('date_facture', '2025-12-06');

    console.log(`📊 Données trouvées:`);
    console.log(`   - Encaissements: ${encCount || 0}`);
    console.log(`   - Factures: ${factCount || 0}`);
    console.log(`   - Total: ${(encCount || 0) + (factCount || 0)}\n`);

    if ((encCount || 0) === 0 && (factCount || 0) === 0) {
      console.log('✅ Aucune donnée à supprimer.');
      return;
    }

    // 2. Demander confirmation
    const confirmed = await askConfirmation(
      `⚠️  Êtes-vous sûr de vouloir supprimer ces ${(encCount || 0) + (factCount || 0)} lignes ? (oui/non): `
    );

    if (!confirmed) {
      console.log('❌ Annulation du nettoyage.');
      return;
    }

    console.log('\n🗑️  Suppression en cours...\n');

    // 3. Supprimer les encaissements
    const { error: encError } = await supabase
      .from('encaissements')
      .delete()
      .gte('date', '2025-01-01')
      .lte('date', '2025-12-06');

    if (encError) {
      console.error('❌ Erreur suppression encaissements:', encError.message);
    } else {
      console.log(`✅ ${encCount || 0} encaissements supprimés`);
    }

    // 4. Supprimer les factures
    const { error: factError } = await supabase
      .from('factures')
      .delete()
      .gte('date_facture', '2025-01-01')
      .lte('date_facture', '2025-12-06');

    if (factError) {
      console.error('❌ Erreur suppression factures:', factError.message);
    } else {
      console.log(`✅ ${factCount || 0} factures supprimées`);
    }

    console.log('\n✅ Nettoyage terminé !\n');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

// Exécuter le script
cleanTestData();
