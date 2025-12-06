// Script de vérification avant nettoyage de production
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ylhwyotluskuhkjumqpf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlsaHd5b3RsdXNrdWhranVtcXBmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzNjA3NzUsImV4cCI6MjA3OTkzNjc3NX0.CpY8pyGJcNTczE31PzlIJX1GN3Fi8UC9y6MGyW3zjaU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyData() {
  console.log('\n📊 VÉRIFICATION DES DONNÉES AVANT NETTOYAGE\n');
  console.log('='.repeat(60));

  try {
    // 1. Compter les données qui seront supprimées
    console.log('\n❌ DONNÉES QUI SERONT SUPPRIMÉES:\n');

    const { count: encCount } = await supabase
      .from('encaissements')
      .select('*', { count: 'exact', head: true });

    const { count: facCount } = await supabase
      .from('factures')
      .select('*', { count: 'exact', head: true });

    const { count: fourCount } = await supabase
      .from('fournisseurs')
      .select('*', { count: 'exact', head: true });

    const { count: tracCount } = await supabase
      .from('tracabilite')
      .select('*', { count: 'exact', head: true })
      .in('table_name', ['encaissements', 'factures']);

    const { count: envoiCount } = await supabase
      .from('envois_comptabilite')
      .select('*', { count: 'exact', head: true });

    console.log(`   📈 Encaissements: ${encCount}`);
    console.log(`   📋 Factures: ${facCount}`);
    console.log(`   🏢 Fournisseurs: ${fourCount}`);
    console.log(`   📝 Traçabilité: ${tracCount}`);
    console.log(`   📧 Historique envois: ${envoiCount}`);

    // 2. Compter les données qui seront préservées
    console.log('\n✅ DONNÉES QUI SERONT PRÉSERVÉES:\n');

    const { count: usersCount } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    const { count: boucheriesCount } = await supabase
      .from('boucheries')
      .select('*', { count: 'exact', head: true });

    const { data: boucheriesSmtp } = await supabase
      .from('boucheries')
      .select('id')
      .not('smtp_email', 'is', null);

    console.log(`   👥 Utilisateurs: ${usersCount}`);
    console.log(`   🏪 Boucheries: ${boucheriesCount}`);
    console.log(`   📧 Boucheries avec SMTP: ${boucheriesSmtp?.length || 0}`);

    // 3. Détail par boucherie
    console.log('\n📊 DÉTAIL PAR BOUCHERIE:\n');

    const { data: boucheries } = await supabase
      .from('boucheries')
      .select('id, nom');

    for (const b of boucheries || []) {
      const { count: encB } = await supabase
        .from('encaissements')
        .select('*', { count: 'exact', head: true })
        .eq('boucherie_id', b.id);

      const { count: facB } = await supabase
        .from('factures')
        .select('*', { count: 'exact', head: true })
        .eq('boucherie_id', b.id);

      const { count: fourB } = await supabase
        .from('fournisseurs')
        .select('*', { count: 'exact', head: true })
        .eq('boucherie_id', b.id);

      console.log(`   🏪 ${b.nom}:`);
      console.log(`      - Encaissements: ${encB}`);
      console.log(`      - Factures: ${facB}`);
      console.log(`      - Fournisseurs: ${fourB}`);
    }

    // 4. Utilisateurs
    console.log('\n👥 UTILISATEURS (PRÉSERVÉS):\n');

    const { data: users } = await supabase
      .from('users')
      .select('username, email, boucherie_id')
      .order('username');

    for (const u of users || []) {
      const boucherie = boucheries?.find(b => b.id === u.boucherie_id);
      console.log(`   - ${u.username} (${u.email}) → ${boucherie?.nom || 'N/A'}`);
    }

    // 5. Configurations SMTP
    console.log('\n📧 CONFIGURATIONS SMTP (PRÉSERVÉES):\n');

    const { data: smtpConfigs } = await supabase
      .from('boucheries')
      .select('nom, smtp_email, smtp_password, email_comptable, envoi_auto_factures')
      .order('nom');

    for (const s of smtpConfigs || []) {
      const status = s.smtp_password ? '✅ Configuré' : '❌ Non configuré';
      console.log(`   - ${s.nom}:`);
      console.log(`      SMTP: ${s.smtp_email || 'N/A'} ${status}`);
      console.log(`      Email comptable: ${s.email_comptable || 'N/A'}`);
      console.log(`      Envoi auto: ${s.envoi_auto_factures ? 'Oui' : 'Non'}`);
    }

    // Résumé final
    console.log('\n' + '='.repeat(60));
    console.log('\n⚠️  RÉSUMÉ:\n');
    console.log(`   Total à supprimer: ${encCount + facCount + fourCount} enregistrements`);
    console.log(`   Total à préserver: ${usersCount + boucheriesCount} enregistrements`);
    console.log('\n⚠️  ATTENTION:');
    console.log('   Si vous exécutez le script de nettoyage, TOUTES les données');
    console.log('   ci-dessus seront DÉFINITIVEMENT supprimées !');
    console.log('\n   Pour nettoyer: npm run clean-production');
    console.log('   ou exécutez: node scripts/clean-production-data.js');
    console.log('\n' + '='.repeat(60) + '\n');

  } catch (error) {
    console.error('\n❌ Erreur:', error.message);
    process.exit(1);
  }
}

verifyData();
