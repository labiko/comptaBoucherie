// Utilitaires pour l'envoi d'emails via Supabase
import { supabase } from './supabase';
import type { EnvoiComptabilite } from '../types';

/**
 * Envoie un email avec le CSV des factures en pièce jointe
 * Note: Cette fonction nécessite une configuration Supabase Edge Function
 * Pour l'instant, elle simule l'envoi et retourne un résultat
 */
export async function sendFacturesCsvEmail(
  emailDestinataire: string,
  csvContent: string,
  filename: string,
  mois: number,
  annee: number,
  boucherieNom: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // TODO: Implémenter l'envoi réel via Supabase Edge Function
    // Pour l'instant, on simule l'envoi

    const moisNoms = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];

    const subject = `Factures ${moisNoms[mois - 1]} ${annee} - ${boucherieNom}`;

    console.log('📧 Simulation envoi email:', {
      to: emailDestinataire,
      subject,
      attachment: filename,
      csvLines: csvContent.split('\n').length
    });

    // Simulation d'un délai réseau
    await new Promise(resolve => setTimeout(resolve, 500));

    // Pour l'instant, on retourne toujours un succès
    // Dans une vraie implémentation, il faudrait appeler une Edge Function
    return { success: true };

  } catch (error) {
    console.error('Erreur envoi email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    };
  }
}

/**
 * Enregistre un envoi dans la table envois_comptabilite
 */
export async function saveEnvoiComptabilite(
  boucherieId: string,
  typeExport: 'factures' | 'encaissements',
  mois: number,
  annee: number,
  emailDestinataire: string,
  nombreLignes: number,
  userId: string,
  statut: 'envoye' | 'erreur',
  erreurMessage?: string
): Promise<{ success: boolean; envoi?: EnvoiComptabilite; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('envois_comptabilite')
      .insert({
        boucherie_id: boucherieId,
        type_export: typeExport,
        mois,
        annee,
        email_destinataire: emailDestinataire,
        nombre_lignes: nombreLignes,
        statut,
        erreur_message: erreurMessage || null,
        user_id: userId
      })
      .select()
      .single();

    if (error) {
      console.error('Erreur sauvegarde envoi:', error);
      return { success: false, error: error.message };
    }

    return { success: true, envoi: data as EnvoiComptabilite };

  } catch (error) {
    console.error('Erreur sauvegarde envoi:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    };
  }
}

/**
 * Récupère l'historique des envois pour une boucherie
 */
export async function getEnvoisHistory(
  boucherieId: string,
  limit: number = 50
): Promise<{ success: boolean; envois?: EnvoiComptabilite[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('envois_comptabilite')
      .select('*')
      .eq('boucherie_id', boucherieId)
      .order('date_envoi', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Erreur récupération historique:', error);
      return { success: false, error: error.message };
    }

    return { success: true, envois: data as EnvoiComptabilite[] };

  } catch (error) {
    console.error('Erreur récupération historique:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    };
  }
}
