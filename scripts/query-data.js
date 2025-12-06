/**
 * Script simplifié pour analyser les données via Supabase
 * Utilise l'API Supabase pour éviter les problèmes de connexion PostgreSQL
 *
 * Usage: node scripts/query-data.js
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wnvngmtaiwcilwzitgey.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indudm5nbXRhaXdjaWx3eml0Z2V5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzM0MTE2MjUsImV4cCI6MjA0ODk4NzYyNX0.IVEt4uHBZjIJr83PGNrhZmZkqkjmDqLUmBOm5zXwLsE';

const supabase = createClient(supabaseUrl, supabaseKey);

const dateDebut = '2025-01-01';
const dateFin = '2025-12-06';

async function analyzeData() {
  console.log('📊 Analyse des données en base de données...\n');
  console.log('═══════════════════════════════════════════════');
  console.log(`📅 Période: ${dateDebut} → ${dateFin}`);
  console.log('═══════════════════════════════════════════════\n');

  try {
    // ========================================
    // ENCAISSEMENTS
    // ========================================
    console.log('📈 ENCAISSEMENTS\n');

    const { data: encaissements, error: encError, count: encCount } = await supabase
      .from('encaissements')
      .select('*', { count: 'exact' })
      .gte('date', dateDebut)
      .lte('date', dateFin)
      .order('date', { ascending: true });

    if (encError) throw encError;

    if (encaissements && encaissements.length > 0) {
      const totalEspece = encaissements.reduce((sum, e) => sum + (e.espece || 0), 0);
      const totalCB = encaissements.reduce((sum, e) => sum + (e.cb || 0), 0);
      const totalChVr = encaissements.reduce((sum, e) => sum + (e.ch_vr || 0), 0);
      const totalTR = encaissements.reduce((sum, e) => sum + (e.tr || 0), 0);
      const totalGeneral = encaissements.reduce((sum, e) => sum + (e.total || 0), 0);

      console.log(`   Nombre total:        ${encCount}`);
      console.log(`   Date min:            ${encaissements[0].date}`);
      console.log(`   Date max:            ${encaissements[encaissements.length - 1].date}\n`);

      console.log('   💰 Totaux par mode de paiement:');
      console.log(`      Espèce:           ${totalEspece.toFixed(2).padStart(12)} €`);
      console.log(`      CB:               ${totalCB.toFixed(2).padStart(12)} €`);
      console.log(`      CH/VR:            ${totalChVr.toFixed(2).padStart(12)} €`);
      console.log(`      TR:               ${totalTR.toFixed(2).padStart(12)} €`);
      console.log(`      ${'─'.repeat(35)}`);
      console.log(`      TOTAL:            ${totalGeneral.toFixed(2).padStart(12)} €\n`);

      const moyenneJour = totalGeneral / encaissements.length;
      console.log(`   📊 Moyenne par jour: ${moyenneJour.toFixed(2)} €\n`);

      console.log('   🔍 Échantillon (5 premiers):');
      encaissements.slice(0, 5).forEach(e => {
        console.log(`      ${e.date}: ${e.total.toFixed(2).padStart(10)} € (E:${e.espece.toFixed(2)} CB:${e.cb.toFixed(2)} CH/VR:${e.ch_vr.toFixed(2)} TR:${e.tr.toFixed(2)})`);
      });

      console.log('\n   🔍 Échantillon (5 derniers):');
      encaissements.slice(-5).forEach(e => {
        console.log(`      ${e.date}: ${e.total.toFixed(2).padStart(10)} € (E:${e.espece.toFixed(2)} CB:${e.cb.toFixed(2)} CH/VR:${e.ch_vr.toFixed(2)} TR:${e.tr.toFixed(2)})`);
      });
    } else {
      console.log('   ⚠️  Aucun encaissement trouvé.');
    }

    // ========================================
    // FACTURES
    // ========================================
    console.log('\n\n═══════════════════════════════════════════════');
    console.log('📋 FACTURES\n');

    const { data: factures, error: factError, count: factCount } = await supabase
      .from('factures')
      .select('*', { count: 'exact' })
      .gte('date_facture', dateDebut)
      .lte('date_facture', dateFin)
      .order('date_facture', { ascending: true });

    if (factError) throw factError;

    if (factures && factures.length > 0) {
      const totalFactures = factures.reduce((sum, f) => sum + (f.montant || 0), 0);
      const facturesReglees = factures.filter(f => f.regle);
      const facturesNonReglees = factures.filter(f => !f.regle);
      const totalRegle = facturesReglees.reduce((sum, f) => sum + (f.montant || 0), 0);
      const totalNonRegle = facturesNonReglees.reduce((sum, f) => sum + (f.montant || 0), 0);
      const totalSoldeRestant = factures.reduce((sum, f) => sum + (f.solde_restant || 0), 0);

      console.log(`   Nombre total:        ${factCount}`);
      console.log(`   Date min:            ${factures[0].date_facture}`);
      console.log(`   Date max:            ${factures[factures.length - 1].date_facture}\n`);

      console.log('   💰 Totaux:');
      console.log(`      Montant total:       ${totalFactures.toFixed(2).padStart(12)} €`);
      console.log(`      Réglées:             ${totalRegle.toFixed(2).padStart(12)} € (${facturesReglees.length} factures)`);
      console.log(`      Non réglées:         ${totalNonRegle.toFixed(2).padStart(12)} € (${facturesNonReglees.length} factures)`);
      console.log(`      Solde restant:       ${totalSoldeRestant.toFixed(2).padStart(12)} €\n`);

      const moyenneFacture = totalFactures / factures.length;
      console.log(`   📊 Moyenne par facture: ${moyenneFacture.toFixed(2)} €\n`);

      // Répartition par fournisseur
      const parFournisseur = {};
      factures.forEach(f => {
        if (!parFournisseur[f.fournisseur]) {
          parFournisseur[f.fournisseur] = { count: 0, total: 0 };
        }
        parFournisseur[f.fournisseur].count++;
        parFournisseur[f.fournisseur].total += f.montant || 0;
      });

      console.log('   🏢 Répartition par fournisseur:');
      Object.entries(parFournisseur)
        .sort((a, b) => b[1].total - a[1].total)
        .forEach(([nom, stats]) => {
          console.log(`      ${nom.padEnd(20)} : ${stats.count.toString().padStart(3)} factures | ${stats.total.toFixed(2).padStart(10)} €`);
        });

      // Répartition par mode de règlement
      const parMode = {};
      factures.forEach(f => {
        if (!parMode[f.mode_reglement]) {
          parMode[f.mode_reglement] = { count: 0, total: 0 };
        }
        parMode[f.mode_reglement].count++;
        parMode[f.mode_reglement].total += f.montant || 0;
      });

      console.log('\n   💳 Répartition par mode de règlement:');
      Object.entries(parMode)
        .sort((a, b) => b[1].total - a[1].total)
        .forEach(([mode, stats]) => {
          console.log(`      ${mode.padEnd(20)} : ${stats.count.toString().padStart(3)} factures | ${stats.total.toFixed(2).padStart(10)} €`);
        });

      console.log('\n   🔍 Échantillon (5 premières):');
      factures.slice(0, 5).forEach(f => {
        console.log(`      ${f.date_facture} | ${f.fournisseur.padEnd(15)} | ${f.montant.toFixed(2).padStart(8)} € | ${f.regle ? '✓ Réglé' : '✗ Non réglé'}`);
      });

      console.log('\n   🔍 Échantillon (5 dernières):');
      factures.slice(-5).forEach(f => {
        console.log(`      ${f.date_facture} | ${f.fournisseur.padEnd(15)} | ${f.montant.toFixed(2).padStart(8)} € | ${f.regle ? '✓ Réglé' : '✗ Non réglé'}`);
      });
    } else {
      console.log('   ⚠️  Aucune facture trouvée.');
    }

    // ========================================
    // RÉSUMÉ GLOBAL
    // ========================================
    const totalEnc = encaissements ? encaissements.reduce((sum, e) => sum + (e.total || 0), 0) : 0;
    const totalFact = factures ? factures.reduce((sum, f) => sum + (f.montant || 0), 0) : 0;
    const solde = totalEnc - totalFact;

    console.log('\n\n═══════════════════════════════════════════════');
    console.log('📊 RÉSUMÉ GLOBAL\n');
    console.log(`   Total encaissements:  ${totalEnc.toFixed(2).padStart(12)} €`);
    console.log(`   Total factures:       ${totalFact.toFixed(2).padStart(12)} €`);
    console.log(`   ${solde >= 0 ? '💚' : '❤️ '} Solde:              ${solde.toFixed(2).padStart(12)} €\n`);
    console.log(`   📝 Total lignes:      ${(encCount || 0) + (factCount || 0)}\n`);

    // ========================================
    // DISTRIBUTION MENSUELLE
    // ========================================
    console.log('═══════════════════════════════════════════════');
    console.log('📅 DISTRIBUTION MENSUELLE\n');

    const moisStats = {};
    const moisNoms = ['', 'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
                     'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

    if (encaissements) {
      encaissements.forEach(e => {
        const mois = e.date.substring(0, 7); // YYYY-MM
        if (!moisStats[mois]) {
          moisStats[mois] = { encaissements: 0, factures: 0, totalEnc: 0, totalFact: 0 };
        }
        moisStats[mois].encaissements++;
        moisStats[mois].totalEnc += e.total || 0;
      });
    }

    if (factures) {
      factures.forEach(f => {
        const mois = f.date_facture.substring(0, 7); // YYYY-MM
        if (!moisStats[mois]) {
          moisStats[mois] = { encaissements: 0, factures: 0, totalEnc: 0, totalFact: 0 };
        }
        moisStats[mois].factures++;
        moisStats[mois].totalFact += f.montant || 0;
      });
    }

    Object.entries(moisStats)
      .sort()
      .forEach(([mois, stats]) => {
        const [annee, moisNum] = mois.split('-');
        const nomMois = moisNoms[parseInt(moisNum)];
        const soldeMois = stats.totalEnc - stats.totalFact;

        console.log(`   ${nomMois} ${annee}:`);
        console.log(`      ${stats.encaissements} encaissements | ${stats.totalEnc.toFixed(2).padStart(10)} €`);
        console.log(`      ${stats.factures} factures       | ${stats.totalFact.toFixed(2).padStart(10)} €`);
        console.log(`      Solde              | ${soldeMois.toFixed(2).padStart(10)} €\n`);
      });

    console.log('═══════════════════════════════════════════════');
    console.log('✅ Analyse terminée !');
    console.log('═══════════════════════════════════════════════\n');

  } catch (error) {
    console.error('\n❌ Erreur:', error.message);
    process.exit(1);
  }
}

// Exécuter l'analyse
analyzeData();
