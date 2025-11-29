// Script pour vérifier si les images sont bien uploadées dans la base de données
import { createClient } from '@supabase/supabase-js';

// Charger les variables d'environnement
const VITE_SUPABASE_URL = 'https://ylhwyotluskuhkjumqpf.supabase.co';
const VITE_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlsaHd5b3RsdXNrdWhranVtcXBmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzNjA3NzUsImV4cCI6MjA3OTkzNjc3NX0.CpY8pyGJcNTczE31PzlIJX1GN3Fi8UC9y6MGyW3zjaU';

const supabase = createClient(VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY);

async function checkImages() {
  console.log('\n=== Vérification des pièces jointes dans la table factures ===\n');

  const { data, error } = await supabase
    .from('factures')
    .select('id, fournisseur, piece_jointe, piece_jointe_updated_at, created_at')
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('❌ Erreur lors de la requête:', error);
    return;
  }

  if (!data || data.length === 0) {
    console.log('⚠️  Aucune facture trouvée dans la base de données.');
    return;
  }

  console.log(`✅ ${data.length} facture(s) trouvée(s)\n`);

  data.forEach((facture, index) => {
    console.log(`${index + 1}. Facture ID: ${facture.id}`);
    console.log(`   Fournisseur: ${facture.fournisseur}`);
    console.log(`   Créée le: ${new Date(facture.created_at).toLocaleString('fr-FR')}`);

    if (facture.piece_jointe) {
      console.log(`   ✅ Pièce jointe: ${facture.piece_jointe}`);
      if (facture.piece_jointe_updated_at) {
        console.log(`   📅 Ajoutée le: ${new Date(facture.piece_jointe_updated_at).toLocaleString('fr-FR')}`);
      }
    } else {
      console.log(`   ❌ Aucune pièce jointe`);
    }
    console.log('');
  });

  const withImages = data.filter(f => f.piece_jointe).length;
  console.log(`\n📊 Résumé: ${withImages}/${data.length} facture(s) avec pièce jointe\n`);
}

checkImages();
