// Script pour créer des données d'encaissements en décembre 2025
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ylhwyotluskuhkjumqpf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlsaHd5b3RsdXNrdWhranVtcXBmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzNjA3NzUsImV4cCI6MjA3OTkzNjc3NX0.CpY8pyGJcNTczE31PzlIJX1GN3Fi8UC9y6MGyW3zjaU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function restoreDecemberData() {
  console.log('\n📥 Création des encaissements en décembre 2025...\n');

  try {
    // Récupérer un user_id et boucherie_id existants
    const { data: userData } = await supabase
      .from('users')
      .select('id, boucherie_id')
      .limit(1)
      .single();

    if (!userData) {
      console.error('❌ Aucun utilisateur trouvé');
      return;
    }

    const { id: userId, boucherie_id: boucherieId } = userData;
    console.log(`✓ Utilisation user_id: ${userId}, boucherie_id: ${boucherieId}\n`);

    // Données d'encaissements pour décembre (reprenant les valeurs de novembre)
    const encaissements = [
      { date: '2025-12-01', espece: 320, cb: 1250, ch_vr: 180, tr: 70 },
      { date: '2025-12-02', espece: 405, cb: 1340, ch_vr: 210, tr: 85 },
      { date: '2025-12-04', espece: 480, cb: 1450.5, ch_vr: 265, tr: 92.75 },
      { date: '2025-12-05', espece: 390.25, cb: 1180, ch_vr: 220, tr: 78 },
      { date: '2025-12-06', espece: 475, cb: 1320.75, ch_vr: 100, tr: 20 },
      { date: '2025-12-07', espece: 400, cb: 1450.25, ch_vr: 340, tr: 88.75 },
      { date: '2025-12-08', espece: 595, cb: 1680.5, ch_vr: 380, tr: 115 },
      { date: '2025-12-09', espece: 720.25, cb: 1920, ch_vr: 475.5, tr: 135 },
      { date: '2025-12-11', espece: 485, cb: 1385.75, ch_vr: 325, tr: 92.5 },
      { date: '2025-12-12', espece: 410.5, cb: 1240.25, ch_vr: 230, tr: 85 },
      { date: '2025-12-28', espece: 100, cb: 0, ch_vr: 200, tr: 500 },
      { date: '2025-12-29', espece: 133, cb: 90, ch_vr: 50, tr: 420 },
      { date: '2025-12-30', espece: 100, cb: 250, ch_vr: 0, tr: 0 }
    ];

    console.log('📤 Insertion des encaissements...');
    for (const enc of encaissements) {
      const { error } = await supabase
        .from('encaissements')
        .insert({
          date: enc.date,
          espece: enc.espece,
          cb: enc.cb,
          ch_vr: enc.ch_vr,
          tr: enc.tr,
          user_id: userId,
          boucherie_id: boucherieId
        });

      if (error) {
        console.error(`   ❌ Erreur pour ${enc.date}:`, error.message);
      } else {
        const total = enc.espece + enc.cb + enc.ch_vr + enc.tr;
        console.log(`   ✓ ${enc.date}: ${total}€`);
      }
    }

    console.log('\n✅ Données créées avec succès!\n');

    // Vérification
    const { data: finalData } = await supabase
      .from('encaissements')
      .select('date, total')
      .gte('date', '2025-12-01')
      .lte('date', '2025-12-31')
      .order('date');

    console.log('📊 Vérification - Encaissements en décembre:');
    finalData?.forEach(enc => {
      console.log(`   ${enc.date}: ${enc.total}€`);
    });

  } catch (error) {
    console.error('\n❌ Erreur:', error.message);
    process.exit(1);
  }
}

restoreDecemberData();
