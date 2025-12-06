/**
 * Script de génération de données de test
 * Génère des encaissements et factures du 01/01/2025 au 06/12/2025
 *
 * Usage: node scripts/generate-test-data.js
 */

import { createClient } from '@supabase/supabase-js';

// Variables d'environnement - À REMPLACER PAR VOS VRAIES VALEURS
const supabaseUrl = 'https://wnvngmtaiwcilwzitgey.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indudm5nbXRhaXdjaWx3eml0Z2V5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzM0MTE2MjUsImV4cCI6MjA0ODk4NzYyNX0.IVEt4uHBZjIJr83PGNrhZmZkqkjmDqLUmBOm5zXwLsE';

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY doivent être définis dans .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Génère des données de test
 */
async function generateTestData() {
  console.log('🚀 Démarrage de la génération de données de test...\n');

  try {
    // 1. Récupérer une boucherie et un utilisateur
    const { data: boucheries, error: boucherieError } = await supabase
      .from('boucheries')
      .select('id, nom')
      .eq('actif', true)
      .limit(1);

    if (boucherieError) throw boucherieError;
    if (!boucheries || boucheries.length === 0) {
      throw new Error('Aucune boucherie active trouvée');
    }

    const boucherie = boucheries[0];
    console.log(`📍 Boucherie sélectionnée: ${boucherie.nom} (${boucherie.id})`);

    // 2. Récupérer un utilisateur de cette boucherie
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('id, nom')
      .eq('boucherie_id', boucherie.id)
      .eq('actif', true)
      .limit(1);

    if (userError) throw userError;
    if (!users || users.length === 0) {
      throw new Error('Aucun utilisateur actif trouvé pour cette boucherie');
    }

    const user = users[0];
    console.log(`👤 Utilisateur sélectionné: ${user.nom} (${user.id})\n`);

    // 3. Configuration de la génération
    const dateDebut = new Date('2025-01-01');
    const dateFin = new Date('2025-12-06');
    const nombreJours = Math.floor((dateFin - dateDebut) / (1000 * 60 * 60 * 24)) + 1;

    console.log(`📅 Période: ${dateDebut.toLocaleDateString('fr-FR')} → ${dateFin.toLocaleDateString('fr-FR')}`);
    console.log(`📊 Nombre de jours: ${nombreJours}\n`);

    // 4. Génération des données
    const fournisseurs = ['Socopa', 'Sysco', 'Metro', 'Transgourmet', 'Brake France', 'Promocash'];
    const descriptions = ['Viande bovine', 'Viande porcine', 'Volaille', 'Charcuterie', 'Matériel', 'Fournitures'];
    const modesReglement = ['Virement', 'Chèque', 'Prélèvement', 'Espèces'];

    let encaissementsCount = 0;
    let facturesCount = 0;

    console.log('⏳ Génération des données en cours...\n');

    for (let d = new Date(dateDebut); d <= dateFin; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];

      // Générer un encaissement pour ce jour
      const espece = parseFloat((Math.random() * 500 + 100).toFixed(2));
      const cb = parseFloat((Math.random() * 800 + 200).toFixed(2));
      const ch_vr = parseFloat((Math.random() * 300 + 50).toFixed(2));
      const tr = parseFloat((Math.random() * 200 + 50).toFixed(2));
      const total = espece + cb + ch_vr + tr;

      const { error: encError } = await supabase
        .from('encaissements')
        .insert({
          boucherie_id: boucherie.id,
          date: dateStr,
          espece,
          cb,
          ch_vr,
          tr,
          total,
          user_id: user.id,
          updated_by: user.id
        });

      if (encError) {
        console.error(`❌ Erreur encaissement ${dateStr}:`, encError.message);
      } else {
        encaissementsCount++;
      }

      // Générer 2 à 5 factures pour ce jour
      const nbFactures = Math.floor(Math.random() * 4) + 2;

      for (let i = 0; i < nbFactures; i++) {
        const fournisseur = fournisseurs[Math.floor(Math.random() * fournisseurs.length)];
        const description = descriptions[Math.floor(Math.random() * descriptions.length)] +
                          ' - ' + d.toLocaleDateString('fr-FR');
        const modeReglement = modesReglement[Math.floor(Math.random() * modesReglement.length)];
        const montant = parseFloat((Math.random() * 2000 + 100).toFixed(2));
        const regle = Math.random() < 0.7;
        const soldeRestant = regle ? 0 : parseFloat(((Math.random() * 0.7 + 0.3) * montant).toFixed(2));

        // Échéance = 1 mois après
        const echeance = new Date(d);
        echeance.setMonth(echeance.getMonth() + 1);
        const echeanceStr = echeance.toISOString().split('T')[0];

        const { error: factError } = await supabase
          .from('factures')
          .insert({
            boucherie_id: boucherie.id,
            date_facture: dateStr,
            fournisseur,
            echeance: echeanceStr,
            description,
            montant,
            mode_reglement: modeReglement,
            solde_restant: soldeRestant,
            regle,
            user_id: user.id,
            updated_by: user.id
          });

        if (factError) {
          console.error(`❌ Erreur facture ${dateStr} #${i+1}:`, factError.message);
        } else {
          facturesCount++;
        }
      }

      // Afficher la progression tous les 30 jours
      if (encaissementsCount % 30 === 0) {
        console.log(`📈 Progression: ${encaissementsCount} encaissements, ${facturesCount} factures`);
      }
    }

    // 5. Résumé final
    console.log('\n✅ Génération terminée !\n');
    console.log('📊 Résumé:');
    console.log(`   - Encaissements créés: ${encaissementsCount}`);
    console.log(`   - Factures créées: ${facturesCount}`);
    console.log(`   - Total lignes: ${encaissementsCount + facturesCount}\n`);

    // 6. Vérification en base
    const { data: encStats } = await supabase
      .from('encaissements')
      .select('total')
      .gte('date', '2025-01-01')
      .lte('date', '2025-12-06')
      .eq('boucherie_id', boucherie.id);

    const { data: factStats } = await supabase
      .from('factures')
      .select('montant')
      .gte('date_facture', '2025-01-01')
      .lte('date_facture', '2025-12-06')
      .eq('boucherie_id', boucherie.id);

    const totalEncaissements = encStats?.reduce((sum, e) => sum + e.total, 0) || 0;
    const totalFactures = factStats?.reduce((sum, f) => sum + f.montant, 0) || 0;

    console.log('💰 Totaux:');
    console.log(`   - Total encaissements: ${totalEncaissements.toFixed(2)} €`);
    console.log(`   - Total factures: ${totalFactures.toFixed(2)} €`);
    console.log(`   - Solde: ${(totalEncaissements - totalFactures).toFixed(2)} €\n`);

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

// Exécuter le script
generateTestData();
