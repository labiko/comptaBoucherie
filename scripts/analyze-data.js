/**
 * Script d'analyse des données en base
 * Analyse les encaissements et factures générés
 *
 * Usage: node scripts/analyze-data.js
 */

import { createClient } from '@supabase/supabase-js';

// Variables d'environnement - Hardcodées temporairement
const supabaseUrl = 'https://wnvngmtaiwcilwzitgey.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indudm5nbXRhaXdjaWx3eml0Z2V5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzM0MTE2MjUsImV4cCI6MjA0ODk4NzYyNX0.IVEt4uHBZjIJr83PGNrhZmZkqkjmDqLUmBOm5zXwLsE';

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Erreur: clés Supabase manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Analyse les données en base
 */
async function analyzeData() {
  console.log('📊 Analyse des données en base de données...\n');

  try {
    const dateDebut = '2025-01-01';
    const dateFin = '2025-12-06';

    // 1. Statistiques des encaissements
    console.log('═══════════════════════════════════════════════');
    console.log('📈 ENCAISSEMENTS');
    console.log('═══════════════════════════════════════════════\n');

    const { data: encaissements, error: encError, count: encCount } = await supabase
      .from('encaissements')
      .select('*', { count: 'exact' })
      .gte('date', dateDebut)
      .lte('date', dateFin)
      .order('date', { ascending: true });

    if (encError) throw encError;

    console.log(`📅 Période analysée: ${dateDebut} → ${dateFin}`);
    console.log(`📝 Nombre total: ${encCount || 0} encaissements\n`);

    if (encaissements && encaissements.length > 0) {
      // Calcul des totaux
      const totalEspece = encaissements.reduce((sum, e) => sum + (e.espece || 0), 0);
      const totalCB = encaissements.reduce((sum, e) => sum + (e.cb || 0), 0);
      const totalChVr = encaissements.reduce((sum, e) => sum + (e.ch_vr || 0), 0);
      const totalTR = encaissements.reduce((sum, e) => sum + (e.tr || 0), 0);
      const totalGeneral = encaissements.reduce((sum, e) => sum + (e.total || 0), 0);

      console.log('💰 Totaux par mode de paiement:');
      console.log(`   • Espèce:    ${totalEspece.toFixed(2).padStart(12)} €`);
      console.log(`   • CB:        ${totalCB.toFixed(2).padStart(12)} €`);
      console.log(`   • CH/VR:     ${totalChVr.toFixed(2).padStart(12)} €`);
      console.log(`   • TR:        ${totalTR.toFixed(2).padStart(12)} €`);
      console.log(`   ${'─'.repeat(35)}`);
      console.log(`   • TOTAL:     ${totalGeneral.toFixed(2).padStart(12)} €\n`);

      // Moyenne journalière
      const moyenneJour = totalGeneral / encaissements.length;
      console.log(`📊 Moyenne par jour: ${moyenneJour.toFixed(2)} €\n`);

      // Premiers et derniers enregistrements
      console.log('🔍 Échantillon de données:');
      console.log('   Premiers enregistrements:');
      encaissements.slice(0, 3).forEach(e => {
        console.log(`   • ${e.date}: ${e.total.toFixed(2)} € (E:${e.espece} CB:${e.cb} CH/VR:${e.ch_vr} TR:${e.tr})`);
      });
      console.log('   ...');
      console.log('   Derniers enregistrements:');
      encaissements.slice(-3).forEach(e => {
        console.log(`   • ${e.date}: ${e.total.toFixed(2)} € (E:${e.espece} CB:${e.cb} CH/VR:${e.ch_vr} TR:${e.tr})`);
      });
    } else {
      console.log('⚠️  Aucun encaissement trouvé pour cette période.');
    }

    // 2. Statistiques des factures
    console.log('\n═══════════════════════════════════════════════');
    console.log('📋 FACTURES');
    console.log('═══════════════════════════════════════════════\n');

    const { data: factures, error: factError, count: factCount } = await supabase
      .from('factures')
      .select('*', { count: 'exact' })
      .gte('date_facture', dateDebut)
      .lte('date_facture', dateFin)
      .order('date_facture', { ascending: true });

    if (factError) throw factError;

    console.log(`📅 Période analysée: ${dateDebut} → ${dateFin}`);
    console.log(`📝 Nombre total: ${factCount || 0} factures\n`);

    if (factures && factures.length > 0) {
      // Calcul des totaux
      const totalFactures = factures.reduce((sum, f) => sum + (f.montant || 0), 0);
      const totalRegle = factures.filter(f => f.regle).reduce((sum, f) => sum + (f.montant || 0), 0);
      const totalNonRegle = factures.filter(f => !f.regle).reduce((sum, f) => sum + (f.montant || 0), 0);
      const totalSoldeRestant = factures.reduce((sum, f) => sum + (f.solde_restant || 0), 0);

      const nbRegle = factures.filter(f => f.regle).length;
      const nbNonRegle = factures.filter(f => !f.regle).length;

      console.log('💰 Totaux:');
      console.log(`   • Montant total:       ${totalFactures.toFixed(2).padStart(12)} €`);
      console.log(`   • Factures réglées:    ${totalRegle.toFixed(2).padStart(12)} € (${nbRegle} factures)`);
      console.log(`   • Factures non réglées: ${totalNonRegle.toFixed(2).padStart(12)} € (${nbNonRegle} factures)`);
      console.log(`   • Solde restant total:  ${totalSoldeRestant.toFixed(2).padStart(12)} €\n`);

      // Moyenne par facture
      const moyenneFacture = totalFactures / factures.length;
      console.log(`📊 Moyenne par facture: ${moyenneFacture.toFixed(2)} €\n`);

      // Répartition par fournisseur
      const fournisseurs = {};
      factures.forEach(f => {
        if (!fournisseurs[f.fournisseur]) {
          fournisseurs[f.fournisseur] = { count: 0, total: 0 };
        }
        fournisseurs[f.fournisseur].count++;
        fournisseurs[f.fournisseur].total += f.montant || 0;
      });

      console.log('🏢 Répartition par fournisseur:');
      Object.entries(fournisseurs)
        .sort((a, b) => b[1].total - a[1].total)
        .forEach(([nom, stats]) => {
          console.log(`   • ${nom.padEnd(20)} : ${stats.count.toString().padStart(3)} factures | ${stats.total.toFixed(2).padStart(10)} €`);
        });

      // Répartition par mode de règlement
      const modesReglement = {};
      factures.forEach(f => {
        if (!modesReglement[f.mode_reglement]) {
          modesReglement[f.mode_reglement] = { count: 0, total: 0 };
        }
        modesReglement[f.mode_reglement].count++;
        modesReglement[f.mode_reglement].total += f.montant || 0;
      });

      console.log('\n💳 Répartition par mode de règlement:');
      Object.entries(modesReglement)
        .sort((a, b) => b[1].total - a[1].total)
        .forEach(([mode, stats]) => {
          console.log(`   • ${mode.padEnd(20)} : ${stats.count.toString().padStart(3)} factures | ${stats.total.toFixed(2).padStart(10)} €`);
        });

      // Échantillon
      console.log('\n🔍 Échantillon de données:');
      console.log('   Premières factures:');
      factures.slice(0, 3).forEach(f => {
        console.log(`   • ${f.date_facture} | ${f.fournisseur.padEnd(15)} | ${f.montant.toFixed(2).padStart(8)} € | ${f.regle ? '✓ Réglé' : '✗ Non réglé'}`);
      });
      console.log('   ...');
      console.log('   Dernières factures:');
      factures.slice(-3).forEach(f => {
        console.log(`   • ${f.date_facture} | ${f.fournisseur.padEnd(15)} | ${f.montant.toFixed(2).padStart(8)} € | ${f.regle ? '✓ Réglé' : '✗ Non réglé'}`);
      });
    } else {
      console.log('⚠️  Aucune facture trouvée pour cette période.');
    }

    // 3. Résumé global
    console.log('\n═══════════════════════════════════════════════');
    console.log('📊 RÉSUMÉ GLOBAL');
    console.log('═══════════════════════════════════════════════\n');

    const totalEnc = encaissements ? encaissements.reduce((sum, e) => sum + (e.total || 0), 0) : 0;
    const totalFact = factures ? factures.reduce((sum, f) => sum + (f.montant || 0), 0) : 0;
    const solde = totalEnc - totalFact;

    console.log(`📈 Total encaissements:  ${totalEnc.toFixed(2).padStart(12)} €`);
    console.log(`📉 Total factures:       ${totalFact.toFixed(2).padStart(12)} €`);
    console.log(`${solde >= 0 ? '💚' : '❤️ '} Solde:               ${solde.toFixed(2).padStart(12)} €\n`);

    console.log(`📝 Total lignes générées: ${(encCount || 0) + (factCount || 0)}\n`);

    // 4. Distribution mensuelle
    console.log('═══════════════════════════════════════════════');
    console.log('📅 DISTRIBUTION MENSUELLE');
    console.log('═══════════════════════════════════════════════\n');

    const moisStats = {};

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

    const moisNoms = ['', 'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
                       'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

    Object.entries(moisStats)
      .sort()
      .forEach(([mois, stats]) => {
        const [annee, moisNum] = mois.split('-');
        const nomMois = moisNoms[parseInt(moisNum)];
        const soldeMois = stats.totalEnc - stats.totalFact;

        console.log(`${nomMois} ${annee}:`);
        console.log(`   • ${stats.encaissements} encaissements | ${stats.totalEnc.toFixed(2).padStart(10)} €`);
        console.log(`   • ${stats.factures} factures       | ${stats.totalFact.toFixed(2).padStart(10)} €`);
        console.log(`   • Solde              | ${soldeMois.toFixed(2).padStart(10)} €\n`);
      });

    console.log('═══════════════════════════════════════════════');
    console.log('✅ Analyse terminée !');
    console.log('═══════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

// Exécuter l'analyse
analyzeData();
