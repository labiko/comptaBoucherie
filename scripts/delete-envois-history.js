import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ylhwyotluskuhkjumqpf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlsaHd5b3RsdXNrdWhranVtcXBmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzMxNzM1NjcsImV4cCI6MjA0ODc0OTU2N30.tA65lmwIYqt0x2FH-y2OO0LhD1Bl43pIJIIBt1rTtHs';

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables d\'environnement manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function deleteEnvoisHistory() {
  try {
    console.log('🗑️  Suppression de l\'historique des envois...');

    const { error } = await supabase
      .from('envois_comptabilite')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Supprime tous les enregistrements

    if (error) {
      throw error;
    }

    console.log('✅ Historique des envois supprimé avec succès !');
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

deleteEnvoisHistory();
