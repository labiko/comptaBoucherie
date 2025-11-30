import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ylhwyotluskuhkjumqpf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlsaHd5b3RsdXNrdWhranVtcXBmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzNjA3NzUsImV4cCI6MjA3OTkzNjc3NX0.CpY8pyGJcNTczE31PzlIJX1GN3Fi8UC9y6MGyW3zjaU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function setTimezoneParis() {
  try {
    console.log('🌍 Configuration du timezone Europe/Paris...\n');

    // Note: La modification du timezone de la base de données nécessite des privilèges superuser
    // Ce qu'on peut faire avec l'API Supabase standard est limité

    console.log('⚠️  La configuration du timezone de la base de données nécessite un accès SQL direct.');
    console.log('📝 Voici les étapes à suivre:\n');

    console.log('1. Allez sur le Dashboard Supabase:');
    console.log('   https://supabase.com/dashboard/project/ylhwyotluskuhkjumqpf/sql/new\n');

    console.log('2. Exécutez cette requête SQL:\n');
    console.log('   ALTER DATABASE postgres SET timezone TO \'Europe/Paris\';');
    console.log('   \n   -- Puis reconnectez-vous et vérifiez:');
    console.log('   SELECT current_setting(\'timezone\');\n');

    console.log('3. Ensuite, pour mettre à jour les données existantes:');
    console.log('   -- Les nouvelles insertions utiliseront automatiquement le bon timezone\n');

    console.log('✅ Alternative simple: Gardez la correction côté client avec parseISO()');
    console.log('   qui fonctionne déjà correctement!\n');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

setTimezoneParis();
