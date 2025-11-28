// Script de test pour vérifier que les UPDATE vides ne sont plus créés
// Exécuter avec: node scripts/test-tracabilite-fix.js

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ylhwyotluskuhkjumqpf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlsaHd5b3RsdXNrdWhranVtcXBmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzNjA3NzUsImV4cCI6MjA3OTkzNjc3NX0.CpY8pyGJcNTczE31PzlIJX1GN3Fi8UC9y6MGyW3zjaU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testTracabiliteFix() {
  console.log('\n🧪 TEST DE LA CORRECTION DE TRAÇABILITÉ\n');
  console.log('='.repeat(60));

  // 1. Compter les logs AVANT le test
  const { data: logsBefore, error: errorBefore } = await supabase
    .from('tracabilite')
    .select('id')
    .order('timestamp', { ascending: false });

  if (errorBefore) {
    console.error('❌ Erreur:', errorBefore);
    return;
  }

  const countBefore = logsBefore.length;
  console.log(`\n📊 Nombre de logs AVANT le test: ${countBefore}`);

  // 2. Récupérer une facture existante
  const { data: factures, error: errorFactures } = await supabase
    .from('factures')
    .select('*')
    .limit(1);

  if (errorFactures || !factures || factures.length === 0) {
    console.error('❌ Erreur: Aucune facture trouvée pour le test');
    return;
  }

  const facture = factures[0];
  console.log(`\n📄 Facture de test: ${facture.fournisseur} - ${facture.montant}€`);
  console.log(`   ID: ${facture.id}`);

  // 3. UPDATE sans changement (doit ne PAS créer de log)
  console.log('\n🔄 Test 1: UPDATE SANS CHANGEMENT');
  console.log('-'.repeat(60));

  const { error: updateError1 } = await supabase
    .from('factures')
    .update({
      fournisseur: facture.fournisseur,
      montant: facture.montant,
      description: facture.description,
      solde_restant: facture.solde_restant,
      regle: facture.regle,
      mode_reglement: facture.mode_reglement,
      updated_by: facture.updated_by
    })
    .eq('id', facture.id);

  if (updateError1) {
    console.error('❌ Erreur lors de l\'UPDATE:', updateError1);
    return;
  }

  // Attendre un peu pour que le trigger s'exécute
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Compter les logs APRÈS l'UPDATE vide
  const { data: logsAfterEmpty } = await supabase
    .from('tracabilite')
    .select('id')
    .order('timestamp', { ascending: false });

  const countAfterEmpty = logsAfterEmpty.length;

  console.log(`✅ UPDATE exécuté sans erreur`);
  console.log(`📊 Nombre de logs APRÈS: ${countAfterEmpty}`);

  if (countAfterEmpty === countBefore) {
    console.log('✅ SUCCÈS: Aucun log créé (comportement attendu)');
  } else {
    console.log(`❌ ÉCHEC: ${countAfterEmpty - countBefore} log(s) créé(s) (inattendu)`);
  }

  // 4. UPDATE avec changement (doit créer un log)
  console.log('\n🔄 Test 2: UPDATE AVEC CHANGEMENT');
  console.log('-'.repeat(60));

  const newMontant = parseFloat(facture.montant) + 0.01; // Changer le montant de 1 centime

  const { error: updateError2 } = await supabase
    .from('factures')
    .update({
      montant: newMontant,
      updated_by: facture.updated_by
    })
    .eq('id', facture.id);

  if (updateError2) {
    console.error('❌ Erreur lors de l\'UPDATE:', updateError2);
    return;
  }

  // Attendre un peu pour que le trigger s'exécute
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Compter les logs APRÈS l'UPDATE avec changement
  const { data: logsAfterChange } = await supabase
    .from('tracabilite')
    .select('*')
    .order('timestamp', { ascending: false });

  const countAfterChange = logsAfterChange.length;

  console.log(`✅ UPDATE exécuté (montant: ${facture.montant}€ → ${newMontant}€)`);
  console.log(`📊 Nombre de logs APRÈS: ${countAfterChange}`);

  if (countAfterChange === countAfterEmpty + 1) {
    console.log('✅ SUCCÈS: 1 log créé (comportement attendu)');

    // Vérifier le contenu du log
    const lastLog = logsAfterChange[0];
    console.log('\n📝 Détails du log créé:');
    console.log(`   Action: ${lastLog.action}`);
    console.log(`   Table: ${lastLog.table_name}`);
    console.log(`   User: ${lastLog.user_nom}`);
    console.log(`   Montant OLD: ${lastLog.old_values?.montant}€`);
    console.log(`   Montant NEW: ${lastLog.new_values?.montant}€`);
  } else {
    console.log(`❌ ÉCHEC: ${countAfterChange - countAfterEmpty} log(s) créé(s) au lieu de 1`);
  }

  // 5. Restaurer le montant original
  console.log('\n🔄 Restauration du montant original...');

  await supabase
    .from('factures')
    .update({
      montant: facture.montant,
      updated_by: facture.updated_by
    })
    .eq('id', facture.id);

  console.log('✅ Montant restauré');

  // 6. Résumé final
  console.log('\n' + '='.repeat(60));
  console.log('📊 RÉSUMÉ DES TESTS');
  console.log('='.repeat(60));

  const { data: finalLogs } = await supabase
    .from('tracabilite')
    .select('id')
    .order('timestamp', { ascending: false });

  const finalCount = finalLogs.length;
  const logsCreated = finalCount - countBefore;

  console.log(`\nLogs au début: ${countBefore}`);
  console.log(`Logs à la fin: ${finalCount}`);
  console.log(`Logs créés pendant les tests: ${logsCreated}`);
  console.log(`\nAttendus: 2 logs (1 pour le changement + 1 pour la restauration)`);

  if (logsCreated === 2) {
    console.log('\n✅ TOUS LES TESTS RÉUSSIS !');
    console.log('   - Les UPDATE vides ne créent plus de logs');
    console.log('   - Les UPDATE avec changements créent bien des logs');
  } else {
    console.log(`\n⚠️  RÉSULTAT INATTENDU: ${logsCreated} logs créés au lieu de 2`);
  }

  console.log('\n' + '='.repeat(60) + '\n');
}

testTracabiliteFix().catch(console.error);
