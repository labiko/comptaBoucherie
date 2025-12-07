/**
 * Script pour supprimer la contrainte d'unicité via l'API Supabase
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ylhwyotluskuhkjumqpf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlsaHd5b3RsdXNrdWhranVtcXBmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzNjA3NzUsImV4cCI6MjA3OTkzNjc3NX0.CpY8pyGJcNTczE31PzlIJX1GN3Fi8UC9y6MGyW3zjaU';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function removeConstraint() {
  console.log('🔧 Tentative de suppression de la contrainte via Supabase...\n');

  try {
    // Exécuter une requête SQL via rpc (si une fonction existe) ou via l'API
    const { data, error } = await supabase.rpc('exec_sql', {
      query: 'ALTER TABLE encaissements DROP CONSTRAINT IF EXISTS encaissements_boucherie_date_key'
    });

    if (error) {
      console.error('❌ Erreur:', error);
      console.log('\n⚠️ La clé anonyme ne permet pas d\'exécuter des DDL directement.');
      console.log('📝 Solution manuelle requise:');
      console.log('   1. Ouvrez le Supabase Dashboard SQL Editor');
      console.log('   2. Exécutez la requête suivante:\n');
      console.log('   ALTER TABLE encaissements DROP CONSTRAINT IF EXISTS encaissements_boucherie_date_key;\n');
    } else {
      console.log('✅ Contrainte supprimée avec succès!');
      console.log('Data:', data);
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

removeConstraint().catch(console.error);
