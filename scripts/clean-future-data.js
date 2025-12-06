// Script pour supprimer toutes les données après le 6 décembre 2025
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ylhwyotluskuhkjumqpf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlsaHd5b3RsdXNrdWhranVtcXBmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzNjA3NzUsImV4cCI6MjA3OTkzNjc3NX0.CpY8pyGJcNTczE31PzlIJX1GN3Fi8UC9y6MGyW3zjaU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanFutureData() {
  console.log('\n🧹 Nettoyage des données futures après le 6 décembre 2025...\n');

  const dateLimit = '2025-12-06';

  try {
    // 1. Compter les données à supprimer
    console.log('📊 Analyse des données futures...');

    const { data: futureEnc, error: encCountError } = await supabase
      .from('encaissements')
      .select('date, total')
      .gt('date', dateLimit)
      .order('date');

    if (encCountError) throw encCountError;

    const { data: futureFac, error: facCountError } = await supabase
      .from('factures')
      .select('date_facture, fournisseur, montant')
      .gt('date_facture', dateLimit)
      .order('date_facture');

    if (facCountError) throw facCountError;

    console.log(`\n⚠️  ${futureEnc?.length || 0} encaissements à supprimer:`);
    futureEnc?.forEach(enc => {
      console.log(`   - ${enc.date}: ${enc.total}€`);
    });

    console.log(`\n⚠️  ${futureFac?.length || 0} factures à supprimer:`);
    futureFac?.forEach(fac => {
      console.log(`   - ${fac.date_facture}: ${fac.fournisseur} - ${fac.montant}€`);
    });

    // 2. Supprimer les encaissements futurs
    console.log('\n🗑️  Suppression des encaissements futurs...');
    const { error: delEncError } = await supabase
      .from('encaissements')
      .delete()
      .gt('date', dateLimit);

    if (delEncError) throw delEncError;
    console.log(`   ✓ ${futureEnc?.length || 0} encaissements supprimés`);

    // 3. Supprimer les factures futures
    console.log('\n🗑️  Suppression des factures futures...');
    const { error: delFacError } = await supabase
      .from('factures')
      .delete()
      .gt('date_facture', dateLimit);

    if (delFacError) throw delFacError;
    console.log(`   ✓ ${futureFac?.length || 0} factures supprimées`);

    // 4. Vérification finale
    console.log('\n📊 Vérification finale...');

    const { data: remainingEnc } = await supabase
      .from('encaissements')
      .select('date')
      .gte('date', '2025-12-01')
      .lte('date', dateLimit)
      .order('date');

    const { data: remainingFac } = await supabase
      .from('factures')
      .select('date_facture')
      .gte('date_facture', '2025-12-01')
      .lte('date_facture', dateLimit)
      .order('date_facture');

    console.log(`\n✅ Données restantes en décembre (01/12 → 06/12):`);
    console.log(`   - ${remainingEnc?.length || 0} encaissements`);
    console.log(`   - ${remainingFac?.length || 0} factures`);

    if (remainingEnc && remainingEnc.length > 0) {
      console.log(`\n📅 Encaissements restants:`);
      remainingEnc.forEach(enc => console.log(`   - ${enc.date}`));
    }

    if (remainingFac && remainingFac.length > 0) {
      console.log(`\n📅 Factures restantes:`);
      remainingFac.forEach(fac => console.log(`   - ${fac.date_facture}`));
    }

    console.log('\n✅ Nettoyage terminé avec succès!\n');

  } catch (error) {
    console.error('\n❌ Erreur:', error.message);
    process.exit(1);
  }
}

cleanFutureData();
