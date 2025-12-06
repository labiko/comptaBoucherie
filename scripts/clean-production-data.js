// Script de nettoyage des données pour mise en production
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ylhwyotluskuhkjumqpf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlsaHd5b3RsdXNrdWhranVtcXBmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzNjA3NzUsImV4cCI6MjA3OTkzNjc3NX0.CpY8pyGJcNTczE31PzlIJX1GN3Fi8UC9y6MGyW3zjaU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanProductionData() {
  console.log('\n🗑️  NETTOYAGE DES DONNÉES POUR LA PRODUCTION\n');
  console.log('='.repeat(60));
  console.log('\n⚠️  ATTENTION: Cette opération est IRRÉVERSIBLE !');
  console.log('   Toutes les données de test vont être supprimées.\n');
  console.log('='.repeat(60));

  // Pause de 3 secondes pour laisser le temps de Ctrl+C si erreur
  console.log('\nDémarrage dans 3 secondes... (Ctrl+C pour annuler)\n');
  await new Promise(resolve => setTimeout(resolve, 3000));

  try {
    // 1. Compter avant suppression
    console.log('📊 État avant suppression:\n');

    const { count: encBefore } = await supabase
      .from('encaissements')
      .select('*', { count: 'exact', head: true });

    const { count: facBefore } = await supabase
      .from('factures')
      .select('*', { count: 'exact', head: true });

    const { count: fourBefore } = await supabase
      .from('fournisseurs')
      .select('*', { count: 'exact', head: true });

    console.log(`   Encaissements: ${encBefore}`);
    console.log(`   Factures: ${facBefore}`);
    console.log(`   Fournisseurs: ${fourBefore}`);

    // 2. Suppression de la traçabilité
    console.log('\n🗑️  Suppression de la traçabilité...');
    const { error: tracError } = await supabase
      .from('tracabilite')
      .delete()
      .in('table_name', ['encaissements', 'factures']);

    if (tracError) throw tracError;
    console.log('   ✅ Traçabilité supprimée');

    // 3. Suppression de l'historique des envois
    console.log('\n🗑️  Suppression de l\'historique des envois...');
    const { error: envoiError } = await supabase
      .from('envois_comptabilite')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Supprimer tous

    if (envoiError) throw envoiError;
    console.log('   ✅ Historique des envois supprimé');

    // 4. Suppression des factures
    console.log('\n🗑️  Suppression des factures...');
    const { error: facError } = await supabase
      .from('factures')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Supprimer tous

    if (facError) throw facError;
    console.log(`   ✅ ${facBefore} factures supprimées`);

    // 5. Suppression des encaissements
    console.log('\n🗑️  Suppression des encaissements...');
    const { error: encError } = await supabase
      .from('encaissements')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Supprimer tous

    if (encError) throw encError;
    console.log(`   ✅ ${encBefore} encaissements supprimés`);

    // 6. Suppression des fournisseurs
    console.log('\n🗑️  Suppression des fournisseurs...');
    const { error: fourError } = await supabase
      .from('fournisseurs')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Supprimer tous

    if (fourError) throw fourError;
    console.log(`   ✅ ${fourBefore} fournisseurs supprimés`);

    // 7. Vérification finale
    console.log('\n✅ VÉRIFICATION FINALE:\n');

    const { count: encAfter } = await supabase
      .from('encaissements')
      .select('*', { count: 'exact', head: true });

    const { count: facAfter } = await supabase
      .from('factures')
      .select('*', { count: 'exact', head: true });

    const { count: fourAfter } = await supabase
      .from('fournisseurs')
      .select('*', { count: 'exact', head: true });

    const { count: tracAfter } = await supabase
      .from('tracabilite')
      .select('*', { count: 'exact', head: true })
      .in('table_name', ['encaissements', 'factures']);

    const { count: envoiAfter } = await supabase
      .from('envois_comptabilite')
      .select('*', { count: 'exact', head: true });

    const { count: usersAfter } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    const { count: boucheriesAfter } = await supabase
      .from('boucheries')
      .select('*', { count: 'exact', head: true });

    console.log('   Données supprimées:');
    console.log(`      Encaissements: ${encAfter} (était ${encBefore})`);
    console.log(`      Factures: ${facAfter} (était ${facBefore})`);
    console.log(`      Fournisseurs: ${fourAfter} (était ${fourBefore})`);
    console.log(`      Traçabilité: ${tracAfter}`);
    console.log(`      Historique envois: ${envoiAfter}`);

    console.log('\n   Données préservées:');
    console.log(`      Utilisateurs: ${usersAfter}`);
    console.log(`      Boucheries: ${boucheriesAfter}`);

    console.log('\n' + '='.repeat(60));
    console.log('\n✅ NETTOYAGE TERMINÉ AVEC SUCCÈS !');
    console.log('\n   La boucherie peut maintenant saisir ses propres données.');
    console.log('\n   Prochaines étapes:');
    console.log('   1. Créer les fournisseurs dans Administration');
    console.log('   2. Saisir les encaissements journaliers');
    console.log('   3. Créer les factures');
    console.log('\n' + '='.repeat(60) + '\n');

  } catch (error) {
    console.error('\n❌ ERREUR lors du nettoyage:', error.message);
    console.error('\n⚠️  Certaines données peuvent ne pas avoir été supprimées.');
    console.error('   Vérifiez l\'état de la base et réessayez si nécessaire.\n');
    process.exit(1);
  }
}

cleanProductionData();
