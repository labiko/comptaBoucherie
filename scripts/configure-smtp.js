// Script pour configurer les credentials SMTP dans la base de données
import { createClient } from '@supabase/supabase-js';

// Credentials Supabase
const supabaseUrl = 'https://ylhwyotluskuhkjumqpf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlsaHd5b3RsdXNrdWhranVtcXBmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzNjA3NzUsImV4cCI6MjA3OTkzNjc3NX0.CpY8pyGJcNTczE31PzlIJX1GN3Fi8UC9y6MGyW3zjaU';

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables d\'environnement manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function configureSMTP() {
  try {
    console.log('📧 Configuration des credentials SMTP...\n');

    // Étape 1: Vérifier si les colonnes existent déjà
    console.log('1️⃣  Vérification de la structure de la table...');

    // Étape 2: Mettre à jour les boucheries avec les credentials SMTP
    console.log('2️⃣  Mise à jour des credentials SMTP...');

    const { data: updateData, error: updateError } = await supabase
      .from('boucheries')
      .update({
        smtp_email: 'alpha.diallo.mdalpha@gmail.com',
        smtp_password: 'iqyn ldwm ahtl imsd'
      })
      .eq('actif', true)
      .select();

    if (updateError) {
      console.error('❌ Erreur lors de la mise à jour:', updateError);
      process.exit(1);
    }

    console.log(`✅ ${updateData?.length || 0} boucherie(s) mise(s) à jour\n`);

    // Étape 3: Vérifier la configuration
    console.log('3️⃣  Vérification de la configuration...');

    const { data: boucheries, error: selectError } = await supabase
      .from('boucheries')
      .select('id, nom, email_comptable, smtp_email, smtp_password')
      .eq('actif', true);

    if (selectError) {
      console.error('❌ Erreur lors de la vérification:', selectError);
      process.exit(1);
    }

    console.log('\n📋 Configuration actuelle:');
    console.log('═══════════════════════════════════════════════════════════');

    boucheries?.forEach(b => {
      console.log(`\n🏪 Boucherie: ${b.nom}`);
      console.log(`   📧 Email comptable: ${b.email_comptable || '❌ Non configuré'}`);
      console.log(`   📨 SMTP Email: ${b.smtp_email || '❌ Non configuré'}`);
      console.log(`   🔐 SMTP Password: ${b.smtp_password ? '✅ Configuré (masqué)' : '❌ Non configuré'}`);
    });

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('✅ Configuration SMTP terminée avec succès!\n');

  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

configureSMTP();
