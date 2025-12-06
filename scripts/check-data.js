// Script pour vérifier les données actuelles dans la base
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ylhwyotluskuhkjumqpf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlsaHd5b3RsdXNrdWhranVtcXBmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzNjA3NzUsImV4cCI6MjA3OTkzNjc3NX0.CpY8pyGJcNTczE31PzlIJX1GN3Fi8UC9y6MGyW3zjaU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
  console.log('\n📊 Vérification des données en base...\n');

  // Vérifier les encaissements
  console.log('🔍 ENCAISSEMENTS:');
  const { data: encaissements, error: encError } = await supabase
    .from('encaissements')
    .select('date, boucherie_id, espece, cb, ch_vr, tr, total')
    .order('date', { ascending: false })
    .limit(30);

  if (encError) {
    console.error('❌ Erreur encaissements:', encError);
  } else {
    // Grouper par mois
    const parMois = {};
    encaissements.forEach(enc => {
      const date = new Date(enc.date);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!parMois[key]) {
        parMois[key] = { count: 0, dates: [] };
      }
      parMois[key].count++;
      parMois[key].dates.push(enc.date);
    });

    console.log('\n📅 Répartition par mois:');
    Object.entries(parMois)
      .sort()
      .reverse()
      .forEach(([mois, info]) => {
        const datesUniques = [...new Set(info.dates)].sort();
        console.log(`   ${mois}: ${info.count} encaissements`);
        console.log(`      Dates: ${datesUniques[0]} → ${datesUniques[datesUniques.length - 1]}`);
      });

    console.log('\n📋 Derniers encaissements:');
    encaissements.slice(0, 10).forEach(enc => {
      console.log(`   ${enc.date}: Total ${enc.total}€ (Espèce: ${enc.espece}€, CB: ${enc.cb}€, CH/VR: ${enc.ch_vr}€, TR: ${enc.tr}€)`);
    });
  }

  // Vérifier les factures
  console.log('\n\n🔍 FACTURES:');
  const { data: factures, error: factError } = await supabase
    .from('factures')
    .select('date_facture, echeance, fournisseur, montant, mode_reglement')
    .order('date_facture', { ascending: false })
    .limit(30);

  if (factError) {
    console.error('❌ Erreur factures:', factError);
  } else {
    // Grouper par mois
    const parMois = {};
    factures.forEach(fac => {
      const date = new Date(fac.date_facture);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!parMois[key]) {
        parMois[key] = { count: 0, dates: [] };
      }
      parMois[key].count++;
      parMois[key].dates.push(fac.date_facture);
    });

    console.log('\n📅 Répartition par mois:');
    Object.entries(parMois)
      .sort()
      .reverse()
      .forEach(([mois, info]) => {
        const datesUniques = [...new Set(info.dates)].sort();
        console.log(`   ${mois}: ${info.count} factures`);
        console.log(`      Dates: ${datesUniques[0]} → ${datesUniques[datesUniques.length - 1]}`);
      });

    console.log('\n📋 Dernières factures:');
    factures.slice(0, 10).forEach(fac => {
      console.log(`   ${fac.date_facture}: ${fac.fournisseur} - ${fac.montant}€ (${fac.mode_reglement})`);
    });
  }

  console.log('\n✅ Vérification terminée\n');
}

checkData();
