// Utilitaires pour l'envoi d'emails via Supabase
import { supabase } from './supabase';
import type { EnvoiComptabilite } from '../types';

/**
 * Envoie un email avec le fichier Excel des factures en pièce jointe
 * Utilise Supabase Edge Function + SMTP Gmail de la boucherie
 */
export async function sendFacturesCsvEmail(
  emailDestinataire: string,
  excelBase64: string,
  filename: string,
  mois: number,
  annee: number,
  boucherieNom: string,
  smtpEmail: string,
  smtpPassword: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const moisNoms = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];

    const subject = `Factures ${moisNoms[mois - 1]} ${annee} - ${boucherieNom}`;

    const html = `
      <h2>Factures ${moisNoms[mois - 1]} ${annee}</h2>
      <p>Bonjour,</p>
      <p>Veuillez trouver ci-joint le fichier Excel des factures pour <strong>${moisNoms[mois - 1]} ${annee}</strong> de la boucherie <strong>${boucherieNom}</strong>.</p>
      <p>Cordialement,<br/>${boucherieNom}</p>
    `;

    // Appel de la Edge Function Supabase avec les credentials SMTP de la boucherie
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: {
        to: emailDestinataire,
        subject,
        html,
        attachmentBase64: excelBase64,
        attachmentFilename: filename,
        smtpEmail,
        smtpPassword
      }
    });

    if (error) {
      console.error('Erreur Edge Function:', error);
      return {
        success: false,
        error: error.message || 'Erreur lors de l\'envoi de l\'email'
      };
    }

    if (!data?.success) {
      return {
        success: false,
        error: data?.error || 'Erreur inconnue lors de l\'envoi'
      };
    }

    console.log('✅ Email envoyé avec succès:', data.messageId);
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
