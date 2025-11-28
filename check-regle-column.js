import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ylhwyotluskuhkjumqpf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlsaHd5b3RsdXNrdWhranVtcXBmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzNjA3NzUsImV4cCI6MjA3OTkzNjc3NX0.CpY8pyGJcNTczE31PzlIJX1GN3Fi8UC9y6MGyW3zjaU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRegleColumn() {
  try {
    // Essayer de sélectionner la colonne regle
    const { data, error } = await supabase
      .from('factures')
      .select('id, regle')
      .limit(1);

    if (error) {
      if (error.message.includes('column') && error.message.includes('regle')) {
        console.log('❌ La colonne "regle" N\'EXISTE PAS dans la table factures');
        console.log('→ Vous devez exécuter le script: sql/alter-factures-add-regle.sql');
        console.log('→ Dans Supabase Dashboard > SQL Editor');
      } else {
        console.log('❌ Erreur:', error.message);
      }
    } else {
      console.log('✅ La colonne "regle" EXISTE dans la table factures');
      console.log('→ Le script a déjà été exécuté');
      if (data && data.length > 0) {
        console.log('→ Exemple de donnée:', data[0]);
      }
    }
  } catch (err) {
    console.error('Erreur lors de la vérification:', err.message);
  }
}

checkRegleColumn();
