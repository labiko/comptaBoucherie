// Helper functions pour la gestion des uploads de pièces jointes (images)
import { supabase } from './supabase';

const BUCKET_NAME = 'factures-images';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * Valide un fichier image avant l'upload
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  // Vérifier le type MIME
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: 'Format non supporté. Utilisez JPG, PNG ou WEBP.',
    };
  }

  // Vérifier la taille
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: 'Fichier trop volumineux. Maximum 5 MB.',
    };
  }

  return { valid: true };
}

/**
 * Upload une image de facture vers Supabase Storage
 */
export async function uploadFactureImage(
  file: File,
  boucherieId: string,
  factureId: string
): Promise<UploadResult> {
  try {
    // Validation
    const validation = validateImageFile(file);
    if (!validation.valid) {
      return {
        success: false,
        error: validation.error,
      };
    }

    // Déterminer l'extension du fichier
    const extension = file.type.split('/')[1];
    const fileName = `${boucherieId}/${factureId}.${extension}`;

    // Upload vers Supabase Storage
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true, // Remplacer si existe déjà
      });

    if (error) {
      console.error('Erreur upload Supabase Storage:', error);
      return {
        success: false,
        error: 'Erreur lors de l\'upload de l\'image',
      };
    }

    // Récupérer l'URL publique
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(fileName);

    return {
      success: true,
      url: urlData.publicUrl,
    };
  } catch (error) {
    console.error('Erreur lors de l\'upload:', error);
    return {
      success: false,
      error: 'Erreur inattendue lors de l\'upload',
    };
  }
}

/**
 * Supprime une image de facture de Supabase Storage
 */
export async function deleteFactureImage(
  boucherieId: string,
  factureId: string
): Promise<boolean> {
  try {
    // Lister les fichiers correspondants (peut avoir différentes extensions)
    const { data: files, error: listError } = await supabase.storage
      .from(BUCKET_NAME)
      .list(boucherieId, {
        search: factureId,
      });

    if (listError || !files || files.length === 0) {
      console.warn('Aucun fichier à supprimer ou erreur:', listError);
      return true; // Pas d'erreur bloquante
    }

    // Supprimer tous les fichiers trouvés
    const filesToDelete = files.map(file => `${boucherieId}/${file.name}`);
    const { error: deleteError } = await supabase.storage
      .from(BUCKET_NAME)
      .remove(filesToDelete);

    if (deleteError) {
      console.error('Erreur suppression Supabase Storage:', deleteError);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Erreur lors de la suppression:', error);
    return false;
  }
}

/**
 * Récupère l'URL publique d'une image (si elle existe)
 */
export function getFactureImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  return url;
}
