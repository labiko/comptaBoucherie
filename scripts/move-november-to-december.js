// Script pour déplacer les données de novembre 2025 vers décembre 2025
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ylhwyotluskuhkjumqpf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlsaHd5b3RsdXNrdWhranVtcXBmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzNjA3NzUsImV4cCI6MjA3OTkzNjc3NX0.CpY8pyGJcNTczE31PzlIJX1GN3Fi8UC9y6MGyW3zjaU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function moveToDecember() {
  console.log('\n🔄 Déplacement des données de novembre vers décembre...\n');

  try {
    // 1. Récupérer tous les encaissements de novembre 2025
    console.log('📥 Récupération des encaissements de novembre...');
    const { data: novEncaissements, error: novEncError } = await supabase
      .from('encaissements')
      .select('*')
      .gte('date', '2025-11-01')
      .lte('date', '2025-11-30');

    if (novEncError) throw novEncError;
    console.log(`   ✓ ${novEncaissements.length} encaissements trouvés`);

    // 2. Récupérer toutes les factures de novembre 2025
    console.log('📥 Récupération des factures de novembre...');
    const { data: novFactures, error: novFactError } = await supabase
      .from('factures')
      .select('*')
      .gte('date_facture', '2025-11-01')
      .lte('date_facture', '2025-11-30');

    if (novFactError) throw novFactError;
    console.log(`   ✓ ${novFactures.length} factures trouvées`);

    // 3. Supprimer les données de novembre
    console.log('\n🗑️  Suppression des données de novembre...');
    const { error: delEncError } = await supabase
      .from('encaissements')
      .delete()
      .gte('date', '2025-11-01')
      .lte('date', '2025-11-30');

    if (delEncError) throw delEncError;
    console.log('   ✓ Encaissements de novembre supprimés');

    const { error: delFactError } = await supabase
      .from('factures')
      .delete()
      .gte('date_facture', '2025-11-01')
      .lte('date_facture', '2025-11-30');

    if (delFactError) throw delFactError;
    console.log('   ✓ Factures de novembre supprimées');

    // 4. Insérer les encaissements en décembre
    console.log('\n📤 Insertion des encaissements en décembre...');
    const decEncaissements = novEncaissements.map(enc => {
      const dateNov = new Date(enc.date);
      const jour = dateNov.getDate();
      const dateDec = `2025-12-${String(jour).padStart(2, '0')}`;

      return {
        date: dateDec,
        espece: enc.espece,
        cb: enc.cb,
        ch_vr: enc.ch_vr,
        tr: enc.tr,
        user_id: enc.user_id,
        boucherie_id: enc.boucherie_id,
        updated_by: enc.updated_by,
        created_at: enc.created_at,
        updated_at: enc.updated_at
      };
    });

    for (const enc of decEncaissements) {
      const { error } = await supabase
        .from('encaissements')
        .insert(enc);

      if (error) {
        console.error(`   ❌ Erreur pour ${enc.date}:`, error.message);
      } else {
        const total = Number(enc.espece) + Number(enc.cb) + Number(enc.ch_vr) + Number(enc.tr);
        console.log(`   ✓ ${enc.date}: ${total}€`);
      }
    }

    // 5. Insérer les factures en décembre
    console.log('\n📤 Insertion des factures en décembre...');
    const decFactures = novFactures.map(fac => {
      const dateNov = new Date(fac.date_facture);
      const jour = dateNov.getDate();
      const dateDec = `2025-12-${String(jour).padStart(2, '0')}`;

      const echeanceNov = new Date(fac.echeance);
      const jourEch = echeanceNov.getDate();
      const echeanceDec = `2025-12-${String(jourEch).padStart(2, '0')}`;

      return {
        date_facture: dateDec,
        echeance: echeanceDec,
        fournisseur: fac.fournisseur,
        description: fac.description,
        montant: fac.montant,
        mode_reglement: fac.mode_reglement,
        solde_restant: fac.solde_restant,
        user_id: fac.user_id,
        boucherie_id: fac.boucherie_id,
        updated_by: fac.updated_by,
        regle: fac.regle,
        fournisseur_id: fac.fournisseur_id,
        piece_jointe: fac.piece_jointe,
        piece_jointe_updated_at: fac.piece_jointe_updated_at,
        created_at: fac.created_at,
        updated_at: fac.updated_at
      };
    });

    for (const fac of decFactures) {
      const { error } = await supabase
        .from('factures')
        .insert(fac);

      if (error) {
        console.error(`   ❌ Erreur pour ${fac.date_facture}:`, error.message);
      } else {
        console.log(`   ✓ ${fac.date_facture}: ${fac.fournisseur} - ${fac.montant}€`);
      }
    }

    console.log('\n✅ Migration terminée avec succès!\n');

    // Vérification finale
    console.log('📊 Vérification finale...');
    const { data: finalEnc } = await supabase
      .from('encaissements')
      .select('date')
      .gte('date', '2025-12-01')
      .lte('date', '2025-12-31');

    const { data: finalFac } = await supabase
      .from('factures')
      .select('date_facture')
      .gte('date_facture', '2025-12-01')
      .lte('date_facture', '2025-12-31');

    console.log(`   ✓ ${finalEnc?.length || 0} encaissements en décembre`);
    console.log(`   ✓ ${finalFac?.length || 0} factures en décembre\n`);

  } catch (error) {
    console.error('\n❌ Erreur:', error.message);
    process.exit(1);
  }
}

moveToDecember();
