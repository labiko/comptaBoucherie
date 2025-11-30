import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ylhwyotluskuhkjumqpf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlsaHd5b3RsdXNrdWhranVtcXBmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzNjA3NzUsImV4cCI6MjA3OTkzNjc3NX0.CpY8pyGJcNTczE31PzlIJX1GN3Fi8UC9y6MGyW3zjaU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTimezone() {
  try {
    console.log('🔍 Vérification du fuseau horaire de la base de données...\n');

    // Récupérer les derniers envois
    const { data: envois, error } = await supabase
      .from('envois_comptabilite')
      .select('*')
      .order('date_envoi', { ascending: false })
      .limit(3);

    if (error) {
      throw error;
    }

    if (!envois || envois.length === 0) {
      console.log('❌ Aucun envoi trouvé dans la base');
      return;
    }

    console.log('📊 Derniers envois dans la base:\n');

    envois.forEach((envoi, index) => {
      console.log(`Envoi ${index + 1}:`);
      console.log(`  - Date brute (PostgreSQL): ${envoi.date_envoi}`);
      console.log(`  - Type de date_envoi: ${typeof envoi.date_envoi}`);

      const dateObj = new Date(envoi.date_envoi);
      console.log(`  - new Date() sans Z: ${dateObj.toLocaleString('fr-FR', { timeZone: 'Europe/Paris' })}`);

      const dateObjZ = new Date(envoi.date_envoi + 'Z');
      console.log(`  - new Date() avec Z: ${dateObjZ.toLocaleString('fr-FR', { timeZone: 'Europe/Paris' })}`);

      console.log(`  - Heure locale navigateur: ${dateObj.toLocaleTimeString('fr-FR')}`);
      console.log(`  - Heure UTC: ${dateObj.toUTCString()}`);
      console.log('');
    });

    // Vérifier le fuseau horaire de PostgreSQL
    console.log('⏰ Vérification du timezone PostgreSQL...');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

checkTimezone();
